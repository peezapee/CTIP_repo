import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { spawn } from "child_process";
import { execSync } from "child_process";
import path from "path";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

// Use relative path for detector (works on any platform)
const DETECTOR_CWD = path.join(process.cwd(), "..", "innovation_project");
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

// Find Python executable (python3 on macOS/Linux, python on Windows)
function getPythonExecutable() {

  const possiblePaths = [

    "C:/Users/celes/AppData/Local/Programs/Python/Python310/python.exe",

    "/Users/switch/Documents/GitHub/CTIP_repo/.venv/bin/python3",

    "python3",

    "python"
  ];

  for (const path of possiblePaths) {

    try {

      execSync(`"${path}" --version`, {
        stdio: "ignore"
      });

      return path;

    } catch {}
  }

  throw new Error(
    "Python not found. Please install Python 3."
  );
}

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
  async (req, res) => {
    
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

    // Spawn detector process
    let pythonCmd;
    try {
      pythonCmd = getPythonExecutable();
    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    detectorProcess = spawn(
      pythonCmd,
      ["abnormal_detector.py"],
      {
        cwd: DETECTOR_CWD
      }
    );

    let errorOccurred = false;
    let errorMessage = "Unknown error";

    detectorProcess.stdout.on("data", (data) => {
      console.log(`[PYTHON]: ${data}`);
    });

    detectorProcess.stderr.on("data", (data) => {
      console.error(`[PYTHON ERROR]: ${data}`);
      // Capture camera-related errors
      if (data.includes("Cannot open webcam") || data.includes("No available camera")) {
        errorOccurred = true;
        errorMessage = "Camera device not found or not accessible. Check camera permissions and connections.";
      }
    });

    detectorProcess.on("error", (error) => {
      console.error("Detector failed to start:", error);
      errorOccurred = true;
      errorMessage = error.message;
      detectorProcess = null;
    });

    detectorProcess.on("close", (code) => {
      console.log(`Detector exited with code ${code}`);
      if (code !== 0 && !errorOccurred) {
        errorOccurred = true;
        errorMessage = `Detector exited with code ${code}. Check logs for details.`;
      }
      detectorProcess = null;
    });

    // Wait for Flask to be ready (with timeout)
    const maxWaitTime = 5000; // 5 seconds
    const startTime = Date.now();
    let flaskReady = false;

    while (Date.now() - startTime < maxWaitTime) {
      if (errorOccurred) {
        return res.status(500).json({
          error: errorMessage
        });
      }

      try {
        const response = await fetch("http://127.0.0.1:5000/health");
        if (response.ok) {
          flaskReady = true;
          break;
        }
      } catch (err) {
        // Flask not ready yet, wait and retry
      }

      await new Promise(r => setTimeout(r, 200)); // Wait 200ms before retrying
    }

    if (!flaskReady) {
      return res.status(500).json({
        error: "Detector failed to start: Video server did not respond. Check camera access."
      });
    }

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

// ===== SET ADMIN ROLE =====
app.post(
  "/set-admin-role",
  verifyToken,
  loadUserProfile,
  requireAdmin,
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: "Email required"
        });
      }

      // Get user by email
      const user = await admin.auth().getUserByEmail(email);

      // Set custom claims
      await admin.auth().setCustomUserClaims(user.uid, {
        role: 'admin'
      });

      // Update Firestore user document
      await db.collection("users").doc(user.uid).update({
        role: "admin"
      });

      // Log the action
      await db.collection("logs").add({
        action: "set_admin_role",
        adminId: req.user.uid,
        adminName: req.userProfile?.name || "Admin",
        targetUserId: user.uid,
        targetEmail: email,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: `Admin role set for ${email}`
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: error.message || "Server error"
      });
    }
  }
);

app.use(
  "/incident_clips",
  express.static(
    "C:/Users/celes/Downloads/COS30049 CTIP/CTIP_repo/innovation_project/incident_clips"
  )
);

app.use(
  "/incident_snapshots",
  express.static(
    "C:/Users/celes/Downloads/COS30049 CTIP/CTIP_repo/innovation_project/incident_snapshots"
  )
);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
