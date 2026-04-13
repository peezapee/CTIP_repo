// pages/DashboardPage.jsx

import React, { useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import AdminDashboard from '../components/AdminDashboard.jsx'
import GuideDashboard from '../components/GuideDashboard.jsx'
import styles from './DashboardPage.module.css'

function DashboardPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 🔥 SAFE FALLBACKS (prevents crash)
  const displayName = user?.name || user?.email || "User"
  const role = user?.role || "guide"

  return (
    <div className={styles.layout}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSidebarOpen(false)
        }}
        onLogout={onLogout}
        isOpen={sidebarOpen}
      />

      {/* Main content */}
      <div className={styles.main}>

        {/* Top bar */}
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
              Hello, <strong>{displayName}</strong> 👋
            </span>

            <div className={styles.roleBadge} data-role={role}>
              {role === 'admin' ? '🛡️ Admin' : '🌿 Park Guide'}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {role === 'admin'
            ? <AdminDashboard activeTab={activeTab} />
            : <GuideDashboard activeTab={activeTab} user={user} />
          }
        </div>

      </div>
    </div>
  )
}

export default DashboardPage