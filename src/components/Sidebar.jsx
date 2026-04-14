import React from 'react'
import styles from './Sidebar.module.css'

const ADMIN_TABS = [
  { id: 'dashboard',  icon: '📊', label: 'Overview' },
  { id: 'guides',     icon: '👥', label: 'Manage Guides' },
  { id: 'modules',    icon: '📚', label: 'Training Modules' },
  { id: 'alerts',     icon: '🔔', label: 'Alerts' },
  { id: 'settings',   icon: '⚙️', label: 'Settings' },
]

const GUIDE_TABS = [
  { id: 'dashboard',   icon: '🏠', label: 'My Dashboard' },
  { id: 'training',    icon: '📖', label: 'My Training' },
  { id: 'certificate', icon: '🎖️', label: 'Certificates' },
  { id: 'alerts',      icon: '🔔', label: 'Notifications' },
]

function Sidebar({ user, activeTab, onTabChange, onLogout, isOpen }) {

  // 🔥 SAFE FALLBACKS
  const role = user?.role || 'guide'
  const name = user?.name || user?.email || 'User'

  const tabs = role === 'admin' ? ADMIN_TABS : GUIDE_TABS

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>

      <div className={styles.brand}>
        <span className={styles.brandIcon}>🌿</span>
        <div>
          <div className={styles.brandName}>SFC Platform</div>
          <div className={styles.brandVersion}>v1.0</div>
        </div>
      </div>

      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {name.charAt(0)}
        </div>
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

        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className={styles.navIcon}>{tab.icon}</span>
            <span className={styles.navLabel2}>{tab.label}</span>

            {tab.id === 'alerts' && (
              <span className={styles.badge}>2</span>
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
  )
}

export default Sidebar