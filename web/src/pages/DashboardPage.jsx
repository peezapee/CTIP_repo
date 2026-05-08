// pages/DashboardPage.jsx

import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import AdminDashboard from '../components/AdminDashboard.jsx'
import GuideDashboard from '../components/GuideDashboard.jsx'
import { db } from '../firebase.js'
import { seedModules } from '../utils/seedModules.js'
import styles from './DashboardPage.module.css'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

const ALERT_CLASSES = ['plant_picking', 'cuttingtrees', 'animaltrap', 'netgun', 'touching_animal']

const VIOLATION_LABELS = {
  plant_picking:   'Plant Picking',
  cuttingtrees:    'Cutting Trees',
  animaltrap:      'Animal Trap',
  netgun:          'Net Gun',
  touching_animal: 'Touching Animal',
}

const VIOLATION_ICONS = {
  plant_picking:   '🌿',
  cuttingtrees:    '🪓',
  animaltrap:      '🪤',
  netgun:          '🔫',
  touching_animal: '🐾',
}

function DashboardPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null) // { type, confidence } | null
  const seenIds = useRef(null)             // null = listener not yet initialized
  const toastTimer = useRef(null)

  // Disabled seed — use admin UI instead
  useEffect(() => {
    // seedModules(db)
  }, [])

  // Watch for NEW violation detections and show a toast only for admins
  useEffect(() => {
    const role = user?.role
    if (role !== 'admin') return

    const q = query(
      collection(db, 'incidents'),
      where('type', 'in', ALERT_CLASSES)
    )

    const unsub = onSnapshot(q, (snap) => {
      if (seenIds.current === null) {
        // First snapshot: remember current IDs without alerting
        seenIds.current = new Set(snap.docs.map((d) => d.id))
        return
      }

      // Find any doc we haven't seen yet
      for (const d of snap.docs) {
        if (!seenIds.current.has(d.id)) {
          seenIds.current.add(d.id)
          const data = d.data()

          // Show toast
          clearTimeout(toastTimer.current)
          setToast({ type: data.type, confidence: data.confidence ?? 0 })
          toastTimer.current = setTimeout(() => setToast(null), 7000)
          break // one toast at a time
        }
      }
    })

    return () => {
      unsub()
      clearTimeout(toastTimer.current)
    }
  }, [user?.role])

  const displayName = user?.name || user?.email || 'User'
  const role        = user?.role || 'guide'

  return (
    <div className={styles.layout}>

      {/* Violation alert toast — only fires on NEW detections */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          background: '#1a1a2e',
          border: '1px solid #e63946',
          borderLeft: '4px solid #e63946',
          borderRadius: 12,
          padding: '16px 20px 14px',
          color: 'white',
          boxShadow: '0 8px 32px rgba(230,57,70,0.35)',
          minWidth: 280,
          maxWidth: 360,
        }}>
          <button
            onClick={() => { clearTimeout(toastTimer.current); setToast(null) }}
            style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
          >
            ✕
          </button>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
            🚨 Violation Detected
          </div>
          <div style={{ fontSize: '0.88rem', opacity: 0.9, marginBottom: 2 }}>
            {VIOLATION_ICONS[toast.type] ?? '⚠️'} {VIOLATION_LABELS[toast.type] ?? toast.type}
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.65, marginBottom: 12 }}>
            Confidence: {Math.round(toast.confidence * 100)}%
          </div>
          <button
            onClick={() => { clearTimeout(toastTimer.current); setToast(null); setActiveTab('alerts') }}
            style={{ background: '#e63946', color: 'white', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
          >
            View Alerts
          </button>
        </div>
      )}

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