import React, { useState } from 'react'
import styles from './Sidebar.module.css'

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
    id: 'settings',
    icon: '⚙️',
    label: 'Settings',
    adminOnly: true,
  },
]

function Sidebar({
  
  user,
  activeTab,
  onTabChange,
  onLogout,
  isOpen
}) {

  const [accessMessage, setAccessMessage] = useState('')
  const role = user?.role || 'guide'
  const name = user?.name || user?.email || 'User'

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

            {tab.id === 'alerts' &&
             role === 'admin' && (

              <span className={styles.badge}>
                2
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

    {accessMessage && (
      <div className={styles.accessDenied}>
        {accessMessage}
      </div>
    )}

  </>
)
}

export default Sidebar