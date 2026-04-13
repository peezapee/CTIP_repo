// components/AdminDashboard.jsx

import React, { useEffect, useState } from 'react'
import styles from './Dashboard.module.css'

import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";

// ===== STATIC UI DATA =====
const STATS = [
  { label: 'Total Guides', value: '24', icon: '👥', trend: '+2 this month', color: '#2d6a4f' },
  { label: 'Active Modules', value: '8', icon: '📚', trend: '3 in progress', color: '#3a86ff' },
  { label: 'Alerts Today', value: '5', icon: '🚨', trend: '2 unresolved', color: '#e63946' },
  { label: 'Certifications', value: '61', icon: '🎖️', trend: '4 expiring soon', color: '#e9c46a' },
]

const ALERTS = [
  { time: '09:12 AM', type: 'High', msg: 'Possible plant handling detected — Guide #3, Sector B' },
  { time: '08:47 AM', type: 'Medium', msg: 'Wildlife disturbance flagged — near River Trail' },
  { time: 'Yesterday', type: 'Low', msg: 'Guide certification expiring — Ahmad Razif' },
]

function AdminDashboard({ activeTab }) {

  const [users, setUsers] = useState([])

  // ===== FORM STATE =====
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [deleteId, setDeleteId] = useState(null);
  const [logs, setLogs] = useState([]);

  // ===== FETCH USERS =====
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"))

      const userList = []
      querySnapshot.forEach((doc) => {
        userList.push({
          uid: doc.id,
          ...doc.data()
        })
      })

      setUsers(userList)

    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  useEffect(() => {
  fetchUsers();
}, []);

useEffect(() => {

  if (activeTab !== "guides") return;

  const unsubscribe = onSnapshot(collection(db, "logs"), (snapshot) => {
    const logList = [];

    snapshot.forEach((doc) => {
      logList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    logList.reverse();
    setLogs(logList);
  });

  return () => unsubscribe();

}, [activeTab]);

  // ===== CREATE GUIDE (SECURE BACKEND) =====
const handleCreateGuide = async () => {
  try {

    if (!name || !email || !password) {
      setMessage("❌ All fields are required");
      return;
    }
    
    // ✅ VALIDATION (CORRECT PLACE)
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      setMessage("❌ Name must contain only letters");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("❌ Invalid email format");
      return;
    }


    if (password.length < 6) {
      setMessage("❌ Password must be at least 6 characters");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      setMessage("❌ User not logged in");
      return;
    }

    setLoading(true);
    setMessage("");

    const token = await user.getIdToken();

    const res = await fetch("http://localhost:3000/create-guide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessage("✅ Guide created successfully!");
      await fetchUsers();

      setName("");
      setEmail("");
      setPassword("");
    } else {
      setMessage("❌ " + data.error);
    }

    setTimeout(() => {
      setMessage("");
    }, 3000);

  } catch (error) {
    console.error(error);
    setMessage("❌ Server error");
  } finally {
    setLoading(false);
  }
};

const handleDelete = async (uid) => {

  try {
    const user = auth.currentUser;
    const token = await user.getIdToken();

    const res = await fetch(`http://localhost:3000/delete-guide/${uid}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

  if (data.success) {
    setMessage("✅ Guide deleted!");
    await fetchUsers();

    // ⏳ auto disappear
    setTimeout(() => {
      setMessage("");
    }, 3000);

    } else {
      setMessage("❌ " + data.error);
    }

  } catch (error) {
    console.error(error);
    setMessage("❌ Delete failed");
  }
};

  // ===== FILTER USERS =====
  const guides = users.filter(u => u.role === "guide")
  const admins = users.filter(u => u.role === "admin")

  // ===== MAIN RENDER =====
  const renderContent = () => {
    switch (activeTab) {

      // ===== DASHBOARD =====
      case 'dashboard':
        return (
          <>
            <SectionTitle title="Admin Overview" subtitle="Sarawak Forestry Corporation Platform" />

            <div className={styles.statsGrid}>
              {STATS.map((stat, i) => (
                <div key={i} className={styles.statCard} style={{ '--accent': stat.color }}>
                  <div className={styles.statIcon}>{stat.icon}</div>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                  <div className={styles.statTrend}>{stat.trend}</div>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Recent Alerts</h3>
              {ALERTS.map((alert, i) => (
                <AlertRow key={i} alert={alert} />
              ))}
            </div>
          </>
        )

      // ===== GUIDES =====
      case 'guides':
        return (
          <>
            <SectionTitle title="Manage Users" subtitle="Create Guides" />

            {/* CREATE GUIDE */}
            <div className={styles.formRow}>

              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button 
                className={styles.createBtn}
                onClick={handleCreateGuide} 
                disabled={loading}
              >
                {loading ? "Creating..." : "➕ Create"}
              </button>

            </div>

            {/* USER TABLE */}
            <div className={styles.section}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {/* ADMINS */}
                    <tr>
                      <td colSpan="4"><strong>🛡️ Admins ({admins.length})</strong></td>
                    </tr>

                    {admins.map((u) => (
                      <tr key={u.uid}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>
                          <button disabled className={styles.disabledBtn}>
                            🔒Protected
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* GUIDES */}
                    <tr>
                      <td colSpan="4"><strong>👤 Guides ({guides.length})</strong></td>
                    </tr>

                    {guides.map((u) => (
                      <tr key={u.uid}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>
                          <button 
                              className={styles.deleteBtn}
                              onClick={() => setDeleteId(u.uid)}
                            >
                              🗑 Delete
                            </button>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            </div>

           <div className={styles.section}>
          <h3>Recent Activity</h3>

          {logs.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No recent activity</p>
          ) : (
            <ul className={styles.logList}>
              {logs.slice(0, 5).map((log) => (
                <li key={log.id}>
                  {log.action === "delete_guide" && (
                    <>🗑 Deleted {log.targetEmail} ({getTimeAgo(log.timestamp)})</>
                  )}
                  {log.action === "create_guide" && (
                    <>➕ Created {log.targetEmail} ({getTimeAgo(log.timestamp)})</>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
          </>
        )

      default:
        return (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🚧</div>
            <h3>Coming Soon</h3>
          </div>
          
        )
    }
  }

    return (
    <div>

      {/* ✅ CONFIRM BOX (PUT HERE) */}
      {deleteId && (
        <div className={styles.confirmBox}>
          <p>Are you sure you want to delete this guide?</p>

          <button 
            className={styles.cancelBtn}
            onClick={() => setDeleteId(null)}
          >
            Cancel
          </button>

          <button 
            className={styles.deleteBtn}
            onClick={() => {
              handleDelete(deleteId);
              setDeleteId(null);
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* EXISTING CONTENT */}
      {renderContent()}

    </div>
  );
}

const getTimeAgo = (timestamp) => {
  if (!timestamp) return "";

  const now = new Date();
  const logTime = new Date(timestamp.seconds * 1000);

  const diff = Math.floor((now - logTime) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";

  return Math.floor(diff / 86400) + " days ago";
};

// ===== COMPONENTS =====

function SectionTitle({ title, subtitle }) {
  return (
    <div className={styles.pageHeader}>
      <h2 className={styles.pageTitle}>{title}</h2>
      <p className={styles.pageSub}>{subtitle}</p>
    </div>
  )
}

function AlertRow({ alert }) {
  const colors = { High: '#e63946', Medium: '#f4a261', Low: '#2d6a4f' }

  return (
    <div className={styles.alertRow}>
      <div className={styles.alertDot} style={{ background: colors[alert.type] }} />
      <div className={styles.alertContent}>
        <span className={styles.alertMsg}>{alert.msg}</span>
        <span className={styles.alertTime}>{alert.time} · {alert.type} priority</span>
      </div>
    </div>
  )
}

export default AdminDashboard;