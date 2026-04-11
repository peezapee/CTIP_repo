// components/GuideDashboard.jsx
// Shows the Park Guide's personal dashboard.
// Different from admin — guides see THEIR OWN training, progress, certs.
//
// Props:
//   activeTab = which sidebar tab is active
//   user      = the logged-in guide's info

import React, { useState } from 'react'
import styles from './Dashboard.module.css'

// Fake training modules for the guide
const MY_MODULES = [
  { name: 'Biodiversity Basics',     progress: 100, status: 'Completed',  emoji: '🦋' },
  { name: 'Conservation Principles', progress: 75,  status: 'In Progress', emoji: '🌿' },
  { name: 'Eco-Tourism Practices',   progress: 40,  status: 'In Progress', emoji: '🌍' },
  { name: 'Safety Protocols',        progress: 0,   status: 'Not Started', emoji: '🦺' },
  { name: 'Park Legislation',        progress: 0,   status: 'Not Started', emoji: '⚖️' },
]

// Fake certifications
const MY_CERTS = [
  { name: 'Biodiversity Level 1', date: 'Issued: Jan 2025',  expires: 'Jan 2027', valid: true  },
  { name: 'Safety Basic Training', date: 'Issued: Mar 2024', expires: 'Mar 2025', valid: false },
]

// Fake notifications
const NOTIFICATIONS = [
  { msg: 'New module available: Wildlife Ethics',       time: '2h ago',      icon: '📚' },
  { msg: 'Your Safety certification has expired',       time: '1 day ago',   icon: '⚠️' },
  { msg: 'Completed: Biodiversity Basics — great work!', time: '3 days ago', icon: '✅' },
]

function GuideDashboard({ activeTab, user }) {

  const renderContent = () => {
    switch (activeTab) {

      // ── MY DASHBOARD TAB ──
      case 'dashboard':
        const completed = MY_MODULES.filter(m => m.status === 'Completed').length
        const total     = MY_MODULES.length
        const overallProgress = Math.round((completed / total) * 100)

        return (
          <>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>My Dashboard</h2>
              <p className={styles.pageSub}>Track your training progress and certifications</p>
            </div>

            {/* Overall progress card */}
            <div className={styles.progressCard}>
              <div className={styles.progressCardLeft}>
                <h3>Overall Training Progress</h3>
                <p>{completed} of {total} modules completed</p>
                <div className={styles.bigProgressBar}>
                  <div className={styles.bigProgressFill} style={{ width: `${overallProgress}%` }} />
                </div>
                <span className={styles.bigProgressText}>{overallProgress}% Complete</span>
              </div>
              <div className={styles.progressCircle}>
                {overallProgress}%
              </div>
            </div>

            {/* Quick stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard} style={{ '--accent': '#2d6a4f' }}>
                <div className={styles.statIcon}>📚</div>
                <div className={styles.statValue}>{completed}</div>
                <div className={styles.statLabel}>Modules Done</div>
              </div>
              <div className={styles.statCard} style={{ '--accent': '#3a86ff' }}>
                <div className={styles.statIcon}>🎖️</div>
                <div className={styles.statValue}>{MY_CERTS.filter(c => c.valid).length}</div>
                <div className={styles.statLabel}>Valid Certs</div>
              </div>
              <div className={styles.statCard} style={{ '--accent': '#e63946' }}>
                <div className={styles.statIcon}>⚠️</div>
                <div className={styles.statValue}>{MY_CERTS.filter(c => !c.valid).length}</div>
                <div className={styles.statLabel}>Expired Certs</div>
              </div>
            </div>
          </>
        )

      // ── MY TRAINING TAB ──
      case 'training':
        return (
          <>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>My Training</h2>
              <p className={styles.pageSub}>Your enrolled modules and progress</p>
            </div>
            <div className={styles.section}>
              {MY_MODULES.map((mod, i) => (
                <div key={i} className={styles.trainingRow}>
                  <span className={styles.trainingEmoji}>{mod.emoji}</span>
                  <div className={styles.trainingInfo}>
                    <div className={styles.trainingName}>{mod.name}</div>
                    <div className={styles.progressBar} style={{ marginTop: 6 }}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${mod.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className={styles.trainingRight}>
                    <span
                      className={styles.statusBadge}
                      data-status={mod.status === 'Completed' ? 'active' : mod.status === 'In Progress' ? 'progress' : 'inactive'}
                    >
                      {mod.status}
                    </span>
                    <span className={styles.progressText}>{mod.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )

      // ── CERTIFICATES TAB ──
      case 'certificate':
        return (
          <>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>My Certificates</h2>
              <p className={styles.pageSub}>Your earned qualifications</p>
            </div>
            <div className={styles.certGrid}>
              {MY_CERTS.map((cert, i) => (
                <div key={i} className={`${styles.certCard} ${!cert.valid ? styles.certExpired : ''}`}>
                  <div className={styles.certIcon}>{cert.valid ? '🎖️' : '⚠️'}</div>
                  <div className={styles.certName}>{cert.name}</div>
                  <div className={styles.certDate}>{cert.date}</div>
                  <div className={styles.certExpiry}>Expires: {cert.expires}</div>
                  <div className={styles.certStatus}>
                    {cert.valid ? '✅ Valid' : '❌ Expired — Renew Required'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )

      // ── NOTIFICATIONS TAB ──
      case 'alerts':
        return (
          <>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Notifications</h2>
              <p className={styles.pageSub}>Your latest updates and reminders</p>
            </div>
            <div className={styles.section}>
              {NOTIFICATIONS.map((n, i) => (
                <div key={i} className={styles.alertRow}>
                  <div className={styles.notifIcon}>{n.icon}</div>
                  <div className={styles.alertContent}>
                    <span className={styles.alertMsg}>{n.msg}</span>
                    <span className={styles.alertTime}>{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )

      default:
        return (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🚧</div>
            <h3>Coming Soon</h3>
            <p>This section is under construction.</p>
          </div>
        )
    }
  }

  return <div>{renderContent()}</div>
}

export default GuideDashboard