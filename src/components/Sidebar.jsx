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
    id: 'training',
    icon: '📚',
    label: 'Training',
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

        {TABS.map((tab) => (

          <button
            key={tab.id}

            className={`${styles.navItem} ${
              activeTab === tab.id
                ? styles.active
                : ''
            }`}

            onClick={() => {

              if (
                tab.adminOnly &&
                role !== 'admin'
              ) {

                setAccessMessage(
                'Access Denied — Administrator privileges required.'
              )

              setTimeout(() => {
                setAccessMessage('')
              }, 3000)

                return
              }

              onTabChange(tab.id)
            }}

            style={{
              cursor:
                tab.adminOnly &&
                role !== 'admin'
                  ? 'not-allowed'
                  : 'pointer',

              opacity:
                tab.adminOnly &&
                role !== 'admin'
                  ? 0.7
                  : 1
            }}
          >

            <span className={styles.navIcon}>
              {tab.icon}
            </span>

            <span className={styles.navLabel2}>
              {tab.label}
            </span>

            {tab.adminOnly &&
             role !== 'admin' && (

              <span className={styles.badge}>
                🔒
              </span>
            )}

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