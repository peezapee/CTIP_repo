// components/AdminDashboard.jsx

import React, { useEffect, useState } from 'react'
import styles from './Dashboard.module.css'

import { collection, onSnapshot, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";

import AdminMonitoringPanel from './AdminMonitoringPanel';
import TrainingModuleManager from './TrainingModuleManager';
import GuideEnrollment from './GuideEnrollment';
import ProgressTracking from './ProgressTracking';
import CertificateManager from './CertificateManager';


function AdminDashboard({ activeTab, onTabChange }) {

  const [users, setUsers] = useState([])
  const [modules, setModules] = useState([])
  const [certificates, setCertificates] = useState([])
  const [stats, setStats] = useState([
    { label: 'Total Guides', value: '0', icon: '👥', trend: 'Active guides', color: '#2d6a4f', tab: 'guides' },
    { label: 'Active Modules', value: '0', icon: '📚', trend: 'Training modules', color: '#3a86ff', tab: 'modules' },
    { label: 'Certifications', value: '0', icon: '🎖️', trend: 'Issued certificates', color: '#e9c46a', tab: 'certificate' },
  ])

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
  fetchModules();
  fetchCertificates();
}, []);

const fetchModules = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "trainingModules"))
    setModules(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  } catch (error) {
    console.error("Error fetching modules:", error)
  }
}

const fetchCertificates = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "certificates"))
    setCertificates(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
  } catch (error) {
    console.error("Error fetching certificates:", error)
  }
}

useEffect(() => {
  // Update stats whenever data changes
  const guides = users.filter(u => u.role === "guide")
  setStats([
    { label: 'Total Guides', value: guides.length.toString(), icon: '👥', trend: 'Active guides', color: '#2d6a4f', tab: 'guides' },
    { label: 'Active Modules', value: modules.length.toString(), icon: '📚', trend: 'Training modules', color: '#3a86ff', tab: 'modules' },
    { label: 'Certifications', value: certificates.length.toString(), icon: '🎖️', trend: 'Issued certificates', color: '#e9c46a', tab: 'certificate' },
  ])
}, [users, modules, certificates])

useEffect(() => {
  if (activeTab !== "guides") return;

  const q = query(
    collection(db, "logs"),
    orderBy("timestamp", "desc") 
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const logList = [];

    snapshot.forEach((doc) => {
      logList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

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
            {/* Key Metrics Grid */}
            <div className={styles.statsGrid}>
              {stats.map((stat, i) => (
                <div 
                  key={i} 
                  className={styles.statCard} 
                  style={{ '--accent': stat.color, cursor: 'pointer' }}
                  onClick={() => onTabChange && onTabChange(stat.tab)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && onTabChange) onTabChange(stat.tab);
                  }}
                >
                  <div className={styles.statCardInner}>
                    <div className={styles.statIcon}>{stat.icon}</div>
                    <div className={styles.statContent}>
                      <div className={styles.statLabel}>{stat.label}</div>
                      <div className={styles.statValue}>{stat.value}</div>
                      <div className={styles.statTrend}>🔹 {stat.trend}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Alerts & Quick Links Row */}
            <div className={styles.dashboardRow}>
              {/* Recent Alerts */}
              <div className={styles.dashboardCard}>
                <div className={styles.cardHeader}>
                  <h3>🚨 Recent Alerts</h3>
                  <span className={styles.badge} style={{ background: '#e63946' }}>System Status: OK</span>
                </div>
                <div className={styles.alertList}>
                  <div className={styles.alertItem} style={{ borderLeft: `4px solid #06a77d` }}>
                    <div className={styles.alertMeta}>
                      <span className={styles.alertTime}>Now</span>
                      <span className={`${styles.alertType} ${styles.typeLow}`}>System</span>
                    </div>
                    <p className={styles.alertMsg}>✅ All systems operational</p>
                  </div>
                  <div className={styles.alertItem} style={{ borderLeft: `4px solid #06a77d` }}>
                    <div className={styles.alertMeta}>
                      <span className={styles.alertTime}>Recently</span>
                      <span className={`${styles.alertType} ${styles.typeLow}`}>Info</span>
                    </div>
                    <p className={styles.alertMsg}>📚 {modules.length} training modules available</p>
                  </div>
                  <div className={styles.alertItem} style={{ borderLeft: `4px solid #06a77d` }}>
                    <div className={styles.alertMeta}>
                      <span className={styles.alertTime}>Recently</span>
                      <span className={`${styles.alertType} ${styles.typeLow}`}>Info</span>
                    </div>
                    <p className={styles.alertMsg}>👥 {users.filter(u => u.role === 'guide').length} active guides in system</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.dashboardCard}>
                <div className={styles.cardHeader}>
                  <h3>⚡ Quick Actions</h3>
                </div>
                <div className={styles.actionGrid}>
                  <button 
                    className={styles.actionBtn} 
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    onClick={() => onTabChange && onTabChange('modules')}
                  >
                    <span className={styles.actionIcon}>📚</span>
                    <span>Create Module</span>
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                    onClick={() => onTabChange && onTabChange('enroll')}
                  >
                    <span className={styles.actionIcon}>✍️</span>
                    <span>Enroll Guide</span>
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
                    onClick={() => onTabChange && onTabChange('progress')}
                  >
                    <span className={styles.actionIcon}>📊</span>
                    <span>View Progress</span>
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
                    onClick={() => onTabChange && onTabChange('certificate')}
                  >
                    <span className={styles.actionIcon}>🎖️</span>
                    <span>Manage Certs</span>
                  </button>
                </div>
              </div>
            </div>

            {/* System Health & Summary */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>👥 Active Guides</span>
                  <span className={styles.summaryValue}>{guides.length}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>🛡️ Admins</span>
                  <span className={styles.summaryValue}>{admins.length}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>⚙️ System Status</span>
                  <span className={styles.summaryValue} style={{ color: '#06a77d' }}>✅ Operational</span>
                </div>
              </div>
            </div>
          </>
        )

        
      case 'monitor':
        return <AdminMonitoringPanel />;

      case 'modules':
        return <TrainingModuleManager />;

      case 'enrollment':
        return <GuideEnrollment />;

      case 'progress':
        return <ProgressTracking />;

      case 'certificate':
        return <CertificateManager isAdmin={true} />;

      // ===== GUIDES =====
      case 'guides':
        return (
          <>
            <SectionTitle title="Manage Users" />

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
                    <>🗑 {log.adminName} deleted {log.targetEmail} ({getTimeAgo(log.timestamp)})</>
                  )}
                  {log.action === "create_guide" && (
                    <>➕ {log.adminName} created {log.targetEmail} ({getTimeAgo(log.timestamp)})</>
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

function SectionTitle({ title }) {
  return (
    <div className={styles.pageHeader}>
      <h2 className={styles.pageTitle}>{title}</h2>
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
