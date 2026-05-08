// components/AdminDashboard.jsx

import React, { useEffect, useState } from 'react'
import styles from './Dashboard.module.css'

import { collection, onSnapshot, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";

import AdminMonitoringPanel from './AdminMonitoringPanel';
import AlertsPanel from './AlertsPanel';
import TrainingModuleManager from './TrainingModuleManager';
import GuideEnrollment from './GuideEnrollment';
import ProgressTracking from './ProgressTracking';
import CertificateManager from './CertificateManager';
import GuideManagementPanel from './GuideManagementPanel'


function AdminDashboard({ activeTab, onTabChange }) {

  const [users, setUsers] = useState([])
  const [modules, setModules] = useState([])
  const [certificates, setCertificates] = useState([])
  const [stats, setStats] = useState([
    { label: 'Total Guides', value: '0', icon: '👥', trend: 'Active guides', color: '#2d6a4f', tab: 'guides' },
    { label: 'Active Modules', value: '0', icon: '📚', trend: 'Training modules', color: '#3a86ff', tab: 'modules' },
    { label: 'Certifications', value: '0', icon: '🎖️', trend: 'Issued certificates', color: '#e9c46a', tab: 'certificate' },
  ]);

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
}, [users, modules, certificates]);

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
                style={{
                  '--accent': stat.color,
                  cursor: 'pointer'
                }}
                onClick={() =>
                  onTabChange &&
                  onTabChange(stat.tab)
                }
              >
                <div className={styles.statCardInner}>

                  <div className={styles.statIcon}>
                    {stat.icon}
                  </div>

                  <div className={styles.statContent}>

                    <div className={styles.statLabel}>
                      {stat.label}
                    </div>

                    <div className={styles.statValue}>
                      {stat.value}
                    </div>

                    <div className={styles.statTrend}>
                      🔹 {stat.trend}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alerts & Quick Links */}
          <div className={styles.dashboardRow}>

            <div className={styles.dashboardCard}>

              <div className={styles.cardHeader}>
                <h3>🚨 Recent Alerts</h3>

                <span
                  className={styles.badge}
                  style={{ background: '#e63946' }}
                >
                  System Status: OK
                </span>
              </div>

              <div className={styles.alertList}>

                <div
                  className={styles.alertItem}
                  style={{
                    borderLeft:
                      `4px solid #06a77d`
                  }}
                >
                  <div className={styles.alertMeta}>
                    <span className={styles.alertTime}>
                      Now
                    </span>

                    <span
                      className={`${styles.alertType} ${styles.typeLow}`}
                    >
                      System
                    </span>
                  </div>

                  <p className={styles.alertMsg}>
                    ✅ All systems operational
                  </p>
                </div>

                <div
                  className={styles.alertItem}
                  style={{
                    borderLeft:
                      `4px solid #06a77d`
                  }}
                >
                  <div className={styles.alertMeta}>
                    <span className={styles.alertTime}>
                      Recently
                    </span>

                    <span
                      className={`${styles.alertType} ${styles.typeLow}`}
                    >
                      Info
                    </span>
                  </div>

                  <p className={styles.alertMsg}>
                    📚 {modules.length} training modules available
                  </p>
                </div>

                <div
                  className={styles.alertItem}
                  style={{
                    borderLeft:
                      `4px solid #06a77d`
                  }}
                >
                  <div className={styles.alertMeta}>
                    <span className={styles.alertTime}>
                      Recently
                    </span>

                    <span
                      className={`${styles.alertType} ${styles.typeLow}`}
                    >
                      Info
                    </span>
                  </div>

                  <p className={styles.alertMsg}>
                    👥 {
                      users.filter(
                        u => u.role === 'guide'
                      ).length
                    } active guides in system
                  </p>
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
                  style={{
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                  onClick={() =>
                    onTabChange &&
                    onTabChange('modules')
                  }
                >
                  <span className={styles.actionIcon}>
                    📚
                  </span>

                  <span>Create Module</span>
                </button>

                <button
                  className={styles.actionBtn}
                  style={{
                    background:
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                  }}
                  onClick={() =>
                    onTabChange &&
                    onTabChange('progress')
                  }
                >
                  <span className={styles.actionIcon}>
                    📊
                  </span>

                  <span>View Progress</span>
                </button>

                <button
                  className={styles.actionBtn}
                  style={{
                    background:
                      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                  }}
                  onClick={() =>
                    onTabChange &&
                    onTabChange('certificate')
                  }
                >
                  <span className={styles.actionIcon}>
                    🎖️
                  </span>

                  <span>Manage Certs</span>
                </button>

              </div>
            </div>
          </div>

          {/* Summary */}
          <div className={styles.summaryCard}>

            <div className={styles.summaryGrid}>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>
                  👥 Active Guides
                </span>

                <span className={styles.summaryValue}>
                  {
                    users.filter(
                      u => u.role === 'guide'
                    ).length
                  }
                </span>
              </div>

              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>
                  ⚙️ System Status
                </span>

                <span
                  className={styles.summaryValue}
                  style={{ color: '#06a77d' }}
                >
                  ✅ Operational
                </span>
              </div>

            </div>
          </div>
        </>
      )

      case 'guides':
        return <GuideManagementPanel />

    case 'monitor':
      return <AdminMonitoringPanel />

    case 'alerts':
      return <AlertsPanel />

    case 'modules':
      return <TrainingModuleManager />

    case 'enrollment':
      return <GuideEnrollment />

    case 'progress':
      return <ProgressTracking />

    case 'certificate':
      return <CertificateManager isAdmin={true} />

    default:
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            🚧
          </div>

          <h3>Coming Soon</h3>
        </div>
      )
  }
}
  return (
  <div>
    {renderContent()}
  </div>
)
}

export default AdminDashboard