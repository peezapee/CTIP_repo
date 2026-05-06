import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { spawn } from "child_process";
import path from "path";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

const DETECTOR_CWD = "C:/Users/celes/Downloads/COS30049 CTIP/CTIP_repo/innovation_project";
const DETECTOR_FEED_URL = "http://127.0.0.1:5000/video-feed";

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: {
    error: "Too many requests, please try again later."
  }
});

app.use(limiter);

let detectorProcess = null;
let detectorLocked = false;

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      error: "Invalid token"
    });
  }
};

const loadUserProfile = async (req, res, next) => {
  try {
    const userDoc = await db
      .collection("users")
      .doc(req.user.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(403).json({
        error: "User not found"
      });
    }

    req.userProfile = userDoc.data();
    next();

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });
  }
};

const requireAdmin = (req, res, next) => {

  console.log("ROLE:", req.userProfile?.role);

  if (req.userProfile?.role !== "admin") {
    return res.status(403).json({
      error: "Admin only"
    });
  }

  next();
};

const hasMonitorAccess = (role) => role === "admin" || role === "guide";
const canUserControlDetector = (role) => role === "admin" || (role === "guide" && !detectorLocked);

app.post(
  "/create-guide",
  verifyToken,
  loadUserProfile,
  requireAdmin,
  async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          error: "Missing fields"
        });
      }

      if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({
          error: "Invalid name (letters only)"
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          error: "Invalid email format"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: "Password too weak"
        });
      }

      const user = await admin.auth().createUser({
        email,
        password
      });

      await db.collection("users").doc(user.uid).set({
        email,
        name,
        role: "guide"
      });

      await db.collection("logs").add({
        action: "create_guide",
        adminId: req.user.uid,
        adminName: req.userProfile?.name || "Admin",
        targetUserId: user.uid,
        targetEmail: email,
        timestamp: new Date()
      });

      res.json({
        success: true
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Server error"
      });
    }
  }
);

app.delete(
  "/delete-guide/:uid",
  verifyToken,
  loadUserProfile,
  requireAdmin,
  async (req, res) => {
    try {
      const { uid } = req.params;
      const targetUserDoc = await db.collection("users").doc(uid).get();
      const targetData = targetUserDoc.data();

      await db.collection("logs").add({
        action: "delete_guide",
        adminId: req.user.uid,
        adminName: req.userProfile?.name || "Admin",
        targetUserId: uid,
        targetEmail: targetData?.email || "unknown",
        timestamp: new Date()
      });

      await admin.auth().deleteUser(uid);
      await db.collection("users").doc(uid).delete();

      res.json({
        success: true
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Server error"
      });
    }
  }
);

app.get(
  "/detector/status",
  verifyToken,
  loadUserProfile,
  (req, res) => {
    const role = req.userProfile?.role;

    res.json({
      running: detectorProcess !== null,
      feedUrl: DETECTOR_FEED_URL,
      canControl: canUserControlDetector(role),
      isLocked: detectorLocked,
      role
    });
  }
);

app.post(
  "/detector/lock",
  verifyToken,
  loadUserProfile,
  requireAdmin,
  (req, res) => {

    detectorLocked = true;

    console.log("LOCKED:", detectorLocked);

    // FORCE STOP RUNNING DETECTOR
    if (detectorProcess) {
      detectorProcess.kill("SIGTERM");
      detectorProcess = null;
    }

    res.json({
      success: true,
      message: "Camera locked and detector stopped"
    });
  }
);

app.post(
  "/detector/unlock",
  verifyToken,
  loadUserProfile,
  requireAdmin,
  (req, res) => {
    detectorLocked = false;

    res.json({
      success: true,
      message: "Camera unlocked for guides"
    });
  }
);

app.post(
  "/detector/start",
  verifyToken,
  loadUserProfile,
  (req, res) => {
    const role = req.userProfile?.role;

    if (!hasMonitorAccess(role)) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    console.log("LOCK STATUS:", detectorLocked);

    if (!canUserControlDetector(role)) {
      return res.status(403).json({
        error: "Camera is locked by admin"
      });
    }

    if (detectorProcess) {
      return res.json({
        success: true,
        message: "Detector already running"
      });
    }

    detectorProcess = spawn(
      "python",
      ["abnormal_detector.py"],
      {
        cwd: DETECTOR_CWD
      }
    );

    detectorProcess.stdout.on("data", (data) => {
      console.log(`[PYTHON]: ${data}`);
    });

    detectorProcess.stderr.on("data", (data) => {
      console.error(`[PYTHON ERROR]: ${data}`);
    });

    detectorProcess.on("error", (error) => {
      console.error("Detector failed to start:", error);
      detectorProcess = null;
    });

    detectorProcess.on("close", (code) => {
      console.log(`Detector exited with code ${code}`);
      detectorProcess = null;
    });

    res.json({
      success: true,
      message: "Detector started"
    });
  }
);

app.delete(
  "/detector/stop",
  verifyToken,
  loadUserProfile,
  (req, res) => {
    const role = req.userProfile?.role;

    if (!hasMonitorAccess(role)) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    if (!canUserControlDetector(role)) {
      return res.status(403).json({
        error: "Camera is locked by admin"
      });
    }

    if (!detectorProcess) {
      return res.json({
        success: true,
        message: "Detector not running"
      });
    }

    detectorProcess.kill("SIGTERM");
    detectorProcess = null;

    res.json({
      success: true,
      message: "Detector stopped"
    });
  }
);

app.get(
  "/video-feed",
  verifyToken,
  loadUserProfile,
  (req, res) => {
    res.json({
      url: DETECTOR_FEED_URL
    });
  }
);

app.get(
  "/incident_snapshots/:file",
  verifyToken,
  loadUserProfile,
  requireAdmin,
  (req, res) => {

    const filePath = path.join(
      DETECTOR_CWD,
      "incident_snapshots",
      req.params.file
    );

    res.sendFile(filePath);
  }
);

app.get(
  "/incident_clips/:file",
  verifyToken,
  loadUserProfile,
  requireAdmin,
  (req, res) => {

    const filePath = path.join(
      DETECTOR_CWD,
      "incident_clips",
      req.params.file
    );

    res.sendFile(filePath);
  }
);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
