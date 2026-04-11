// pages/DashboardPage.jsx
// This is the DASHBOARD — the main screen after login.
// Props:
//   user     = the logged-in user object (name, role, email)
//   onLogout = function to call when user clicks Logout

import React, { useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import AdminDashboard from '../components/AdminDashboard.jsx'
import GuideDashboard from '../components/GuideDashboard.jsx'
import styles from './DashboardPage.module.css'

function DashboardPage({ user, onLogout }) {
  // activeTab controls which section of the sidebar is selected
  const [activeTab, setActiveTab]     = useState('dashboard')
  // sidebarOpen controls if the sidebar is visible on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.layout}>

      {/* Mobile overlay — dark background when sidebar is open on small screens */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}  // clicking overlay closes sidebar
        />
      )}

      {/* Sidebar navigation on the left */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSidebarOpen(false)  // close sidebar on mobile after selecting a tab
        }}
        onLogout={onLogout}
        isOpen={sidebarOpen}
      />

      {/* Main content area on the right */}
      <div className={styles.main}>

        {/* Top bar with menu button (mobile) and user greeting */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className={styles.topbarRight}>
            <span className={styles.greeting}>
              Hello, <strong>{user.name}</strong> 👋
            </span>
            <div className={styles.roleBadge} data-role={user.role}>
              {user.role === 'admin' ? '🛡️ Admin' : '🌿 Park Guide'}
            </div>
          </div>
        </header>

        {/* Page content — switches between Admin and Guide view */}
        <div className={styles.content}>
          {user.role === 'admin'
            ? <AdminDashboard activeTab={activeTab} />
            : <GuideDashboard activeTab={activeTab} user={user} />
          }
        </div>
      </div>
    </div>
  )
}

export default DashboardPage