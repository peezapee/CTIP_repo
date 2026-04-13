import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import fs from "fs";
import rateLimit from "express-rate-limit";

// 🔑 load service key
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json")
);

// 🔥 INIT FIREBASE ADMIN
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // max 20 requests per minute
  message: { error: "Too many requests, please try again later." }
});

app.use(limiter);


// 🔐 VERIFY TOKEN MIDDLEWARE
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded; // attach user info
    next();

  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// 🔥 CREATE GUIDE API (SECURED)
app.post("/create-guide", verifyToken, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({ error: "Invalid name (letters only)" });
    }

// ✅ EMAIL VALIDATION
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (!email || !password || !name) {
        return res.status(400).json({ error: "Missing fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password too weak" });
    }

    // 🔐 CHECK ADMIN ROLE (MUST BE INSIDE HERE)
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Only admin allowed" });
    }

    // ✅ CREATE AUTH USER
    const user = await admin.auth().createUser({
      email,
      password
    });

    // ✅ SAVE TO FIRESTORE
    await db.collection("users").doc(user.uid).set({
      email,
      name,
      role: "guide"
    });

    // 📝 LOG CREATE
    await db.collection("logs").add({
    action: "create_guide",
    adminId: req.user.uid,
    targetUserId: user.uid,
    targetEmail: email,
    timestamp: new Date()
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/delete-guide/:uid", verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;

    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Only admin allowed" });
    }

    // 🔍 GET TARGET USER
    const targetUserDoc = await db.collection("users").doc(uid).get();
    const targetData = targetUserDoc.data();

    // 📝 LOG DELETE
    await db.collection("logs").add({
      action: "delete_guide",
      adminId: req.user.uid,
      targetUserId: uid,
      targetEmail: targetData?.email || "unknown",
      timestamp: new Date()
    });

    await admin.auth().deleteUser(uid);
    await db.collection("users").doc(uid).delete();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🚀 START SERVER
app.listen(3000, () => console.log("Server running on port 3000"));

