import styles from './Sidebar.module.css'

import React, {
  useState,
  useEffect
} from 'react'

import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore'



import { db } from '../firebase'

const TABS = [
  {
    id: 'dashboard',
    icon: '📊',
    label: 'Overview',
  },

  {
    id: 'guides',
    icon: '👥',
    label: 'Manage Guides',
    adminOnly: true,
  },

  {
    id: 'modules',
    icon: '📚',
    label: 'Training Modules',
    adminOnly: true,
  },

  {
    id: 'enrollment',
    icon: '✍️',
    label: 'Enroll Guides',
    adminOnly: true,
  },

  {
    id: 'progress',
    icon: '📊',
    label: 'Track Progress',
    adminOnly: true,
  },

  {
    id: 'training',
    icon: '📚',
    label: 'My Courses',
    guideOnly: true,
  },

  {
    id: 'certificate',
    icon: '🎖️',
    label: 'Certificates',
  },

  {
    id: 'monitor',
    icon: '📷',
    label: 'AI Monitor',
  },

  {
    id: 'alerts',
    icon: '🔔',
    label: 'Alerts',
    adminOnly: true,
  },

  {
    id: 'settings',
    icon: '⚙️',
    label: 'Settings',
    adminOnly: true,
  },
]

const ALERT_CLASSES = ['plant_picking', 'cuttingtrees', 'animaltrap', 'netgun', 'touching_animal']

function Sidebar({
  
  user,
  activeTab,
  onTabChange,
  onLogout,
  isOpen
}) {

  const [pendingCount, setPendingCount] = useState(0)
  const [alertCount, setAlertCount]     = useState(0)
  const role = user?.role || 'guide'
  const name = user?.name || user?.email || 'User'

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'pending')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.docs.length)
    })
    return () => unsubscribe()
  }, [])

  // Real-time count of unresolved violation alerts from the detector
  useEffect(() => {
    if (role !== 'admin') return

    const q = query(
      collection(db, 'incidents'),
      where('type', 'in', ALERT_CLASSES)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter((d) => !d.data().reviewed).length
      setAlertCount(count)
    })
    return () => unsubscribe()
  }, [role])

  return (
    <>
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
    >

      <div className={styles.brand}>
        <span className={styles.brandIcon}>🌿</span>

        <div>
          <div className={styles.brandName}>
            SFC Platform
          </div>

          <div className={styles.brandVersion}>
            v1.0
          </div>
        </div>
      </div>

      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {name.charAt(0)}
        </div>

        <div>
          <div className={styles.userName}>
            {name}
          </div>

          <div className={styles.userRole}>
            {role === 'admin'
              ? 'Administrator'
              : 'Park Guide'}
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <nav className={styles.nav}>
        <p className={styles.navLabel}>
          MENU
        </p>

        {TABS.filter((tab) => {
          // Hide admin-only tabs from guides
          if (tab.adminOnly && role !== 'admin') return false
          // Hide guide-only tabs from admins
          if (tab.guideOnly && role !== 'guide') return false
          return true
        }).map((tab) => (

          <button
            key={tab.id}

            className={`${styles.navItem} ${
              activeTab === tab.id
                ? styles.active
                : ''
            }`}

            onClick={() => {
              onTabChange(tab.id)
            }}

            style={{
              cursor: 'pointer'
            }}
          >

            <span className={styles.navIcon}>
              {tab.icon}
            </span>

            <span className={styles.navLabel2}>
              {tab.label}
            </span>

            {tab.id === 'guides' &&
            role === 'admin' &&
            pendingCount > 0 && (

              <span className={styles.badge}>
                🔴 {pendingCount}
              </span>
            )}

            {tab.id === 'alerts' &&
             role === 'admin' &&
             alertCount > 0 && (

              <span className={styles.badge}>
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}

          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          className={styles.logoutBtn}
          onClick={onLogout}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>

    </aside>

  </>
)
}

export default Sidebar