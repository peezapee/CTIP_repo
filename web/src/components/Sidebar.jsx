import styles from './Sidebar.module.css'
import React, { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const TABS = [
  { id: 'dashboard',  icon: '📊', label: 'Overview' },
  { id: 'guides',     icon: '👥', label: 'Manage Guides',    adminOnly: true },
  { id: 'modules',    icon: '📚', label: 'Training Modules', adminOnly: true },
  { id: 'enrollment', icon: '✍️', label: 'Enroll Guides',    adminOnly: true },
  { id: 'progress',   icon: '📊', label: 'Track Progress',   adminOnly: true },
  { id: 'training',   icon: '📚', label: 'My Courses',       guideOnly: true },
  { id: 'badge',      icon: '🎖️', label: 'Badges' },
  { id: 'monitor',    icon: '📷', label: 'AI Monitor' },
  { id: 'alerts',     icon: '🔔', label: 'Alerts',           adminOnly: true },
  { id: 'settings',   icon: '⚙️', label: 'Settings' },
]

const ALERT_CLASSES = ['plant_picking', 'cuttingtrees', 'animaltrap', 'netgun', 'touching_animal']

function Sidebar({ user, activeTab, onTabChange, onLogout, isOpen }) {

  const [pendingCount,     setPendingCount]     = useState(0)
  const [requestCount,     setRequestCount]     = useState(0)
  const [alertCount,       setAlertCount]       = useState(0)
  const [sensorAlertCount, setSensorAlertCount] = useState(0)

  const role = user?.role || 'guide'
  const name = user?.name || user?.email || 'User'

  // Pending user approvals
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'pending')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.docs.length)
    })
    return () => unsub()
  }, [])

  // Unresolved AI violation alerts
  useEffect(() => {
    if (role !== 'admin') return
    const q = query(
      collection(db, 'incidents'),
      where('type', 'in', ALERT_CLASSES)
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter((d) => !d.data().reviewed).length
      setAlertCount(count)
    })
    return () => unsub()
  }, [role])

  // Unresolved IoT sensor alerts
  useEffect(() => {
    if (role !== 'admin') return
    const q = query(collection(db, 'sensorData'))
    const unsub = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter((d) => {
        const status = d.data().status
        return status === 'EXTREMELY DRY' || status === 'WATERLOGGED'
      }).length
      setSensorAlertCount(count)
    })
    return () => unsub()
  }, [role])

  // Pending module requests
  useEffect(() => {
    if (role !== 'admin') return
    const q = query(
      collection(db, 'moduleRequests'),
      where('status', '==', 'pending')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setRequestCount(snapshot.docs.length)
    })
    return () => unsub()
  }, [role])

  const totalAlerts = alertCount + sensorAlertCount

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>

        <div className={styles.brand}>
          <span className={styles.brandIcon}>🌿</span>
          <div>
            <div className={styles.brandName}>SFC Platform</div>
            <div className={styles.brandVersion}>v1.0</div>
          </div>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.avatar}>{name.charAt(0)}</div>
          <div>
            <div className={styles.userName}>{name}</div>
            <div className={styles.userRole}>
              {role === 'admin' ? 'Administrator' : 'Park Guide'}
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <nav className={styles.nav}>
          <p className={styles.navLabel}>MENU</p>

          {TABS.filter((tab) => {
            if (tab.adminOnly && role !== 'admin') return false
            if (tab.guideOnly && role !== 'guide') return false
            return true
          }).map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => onTabChange(tab.id)}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              <span className={styles.navLabel2}>{tab.label}</span>

              {tab.id === 'guides' && role === 'admin' && pendingCount > 0 && (
                <span className={styles.badge}>{pendingCount}</span>
              )}

              {tab.id === 'enrollment' && role === 'admin' && requestCount > 0 && (
                <span className={styles.badge}>{requestCount}</span>
              )}

              {tab.id === 'alerts' && role === 'admin' && totalAlerts > 0 && (
                <span className={styles.badge}>
                  {totalAlerts > 99 ? '99+' : totalAlerts}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.footer}>
          <button className={styles.logoutBtn} onClick={onLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>

      </aside>
    </>
  )
}

export default Sidebar
