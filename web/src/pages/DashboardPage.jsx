// pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import AdminDashboard from '../components/AdminDashboard.jsx'
import GuideDashboard from '../components/GuideDashboard.jsx'
import { db } from '../firebase.js'
import { seedModules } from '../utils/seedModules.js'
import styles from './DashboardPage.module.css'

function DashboardPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 🔥 Seed training modules on component mount (DISABLED - use UI instead)
  useEffect(() => {
    // seedModules(db) - Disabled, create modules via admin UI
  }, [])

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
          {role === 'admin' ? (

  <AdminDashboard activeTab={activeTab} onTabChange={setActiveTab} />

) : (

  <>
    {/* block admin tabs */}
    {['guides', 'modules', 'settings'].includes(activeTab) ? (

      <div>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>

    ) : (

      <GuideDashboard
        activeTab={activeTab}
        user={user}
        onTabChange={setActiveTab}
      />

    )}
  </>

)}
        </div>

      </div>
    </div>
  )
}

export default DashboardPage