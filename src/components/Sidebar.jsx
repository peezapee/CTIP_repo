// components/Sidebar.jsx
// The left-side navigation panel.
// Shows different menu items depending on if you're Admin or Guide.
//
// Props:
//   user        = current logged-in user
//   activeTab   = which tab is currently selected (e.g. 'dashboard')
//   onTabChange = function to call when user clicks a tab
//   onLogout    = function to log out
//   isOpen      = boolean — is the sidebar visible on mobile?

import React from 'react'
import styles from './Sidebar.module.css'

// Menu items for admin users
const ADMIN_TABS = [
  { id: 'dashboard',  icon: '📊', label: 'Overview' },
  { id: 'guides',     icon: '👥', label: 'Manage Guides' },
  { id: 'modules',    icon: '📚', label: 'Training Modules' },
  { id: 'alerts',     icon: '🔔', label: 'Alerts' },
  { id: 'settings',   icon: '⚙️', label: 'Settings' },
]

// Menu items for park guide users
const GUIDE_TABS = [
  { id: 'dashboard',   icon: '🏠', label: 'My Dashboard' },
  { id: 'training',    icon: '📖', label: 'My Training' },
  { id: 'certificate', icon: '🎖️', label: 'Certificates' },
  { id: 'alerts',      icon: '🔔', label: 'Notifications' },
]

function Sidebar({ user, activeTab, onTabChange, onLogout, isOpen }) {
  // Choose which menu items to show based on role
  const tabs = user.role === 'admin' ? ADMIN_TABS : GUIDE_TABS

  return (
    // The isOpen class slides the sidebar in on mobile
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>

      {/* Logo / App Name at top of sidebar */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🌿</span>
        <div>
          <div className={styles.brandName}>SFC Platform</div>
          <div className={styles.brandVersion}>v1.0</div>
        </div>
      </div>

      {/* User info section */}
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {/* Show first letter of user's name as avatar */}
          {user.name.charAt(0)}
        </div>
        <div>
          <div className={styles.userName}>{user.name}</div>
          <div className={styles.userRole}>
            {user.role === 'admin' ? 'Administrator' : 'Park Guide'}
          </div>
        </div>
      </div>

      {/* Divider line */}
      <div className={styles.divider} />

      {/* Navigation menu */}
      <nav className={styles.nav}>
        <p className={styles.navLabel}>MENU</p>
        {/* Loop through tabs and render each one */}
        {tabs.map(tab => (
          <button
            key={tab.id}             // React needs a unique key when rendering a list
            className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className={styles.navIcon}>{tab.icon}</span>
            <span className={styles.navLabel2}>{tab.label}</span>

            {/* Show a dot on the Alerts tab */}
            {tab.id === 'alerts' && (
              <span className={styles.badge}>2</span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout button at the bottom */}
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