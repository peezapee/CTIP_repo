// components/GuideDashboard.jsx
// Shows the Park Guide's personal dashboard.
// Different from admin — guides see THEIR OWN training, progress, certs.
//
// Props:
//   activeTab = which sidebar tab is active
//   user      = the logged-in guide's info

import React, { useState } from 'react'
import styles from './Dashboard.module.css'

import MonitorPanel from './MonitorPanel'
import GuideCourseList from './GuideCourseList'
import CertificateManager from './CertificateManager'


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
            {/* Welcome Banner */}
            <div className={styles.welcomeBanner}>
              <div className={styles.bannerContent}>
                <h3>Welcome, {user?.name || 'Guide'}! 🌿</h3>
                <p>You're doing great! Keep up with your training to earn certifications.</p>
              </div>
              <div className={styles.bannerProgress}>
                <div className={styles.progressCircleAlt}>
                  <div className={styles.progressCircleValue}>{overallProgress}%</div>
                </div>
              </div>
            </div>

            {/* Overall Progress Section */}
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

            {/* Quick Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard} style={{ '--accent': '#2d6a4f' }}>
                <div className={styles.statCardInner}>
                  <div className={styles.statIcon}>📚</div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Modules Done</div>
                    <div className={styles.statValue}>{completed}</div>
                    <div className={styles.statTrend}>🔹 Keep going!</div>
                  </div>
                </div>
              </div>
              <div className={styles.statCard} style={{ '--accent': '#3a86ff' }}>
                <div className={styles.statCardInner}>
                  <div className={styles.statIcon}>🎖️</div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Valid Certs</div>
                    <div className={styles.statValue}>1</div>
                    <div className={styles.statTrend}>🔹 Earn more!</div>
                  </div>
                </div>
              </div>
              <div className={styles.statCard} style={{ '--accent': '#e63946' }}>
                <div className={styles.statCardInner}>
                  <div className={styles.statIcon}>⚠️</div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Expired Certs</div>
                    <div className={styles.statValue}>1</div>
                    <div className={styles.statTrend}>🔹 Renew soon</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Module List */}
            <div className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <h3>📚 Training Modules</h3>
                <span className={styles.badge}>{total} Total</span>
              </div>
              <div className={styles.moduleList}>
                {MY_MODULES.map((mod, idx) => (
                  <div key={idx} className={styles.moduleListItem}>
                    <div className={styles.moduleListItemLeft}>
                      <span className={styles.moduleEmoji}>{mod.emoji}</span>
                      <div>
                        <div className={styles.moduleName}>{mod.name}</div>
                        <div className={styles.moduleStatusBadge} style={{ color: mod.status === 'Completed' ? '#06a77d' : mod.status === 'In Progress' ? '#f77f00' : '#666' }}>
                          {mod.status}
                        </div>
                      </div>
                    </div>
                    <div className={styles.moduleListItemRight}>
                      <div className={styles.progressBarTiny}>
                        <div className={styles.progressFillTiny} style={{ width: `${mod.progress}%` }} />
                      </div>
                      <span className={styles.progressPercent}>{mod.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className={styles.ctaCard}>
              <div className={styles.ctaContent}>
                <h3>🎯 Next Steps</h3>
                <p>Continue your training to earn certificates and advance your skills.</p>
                <button className={styles.primaryBtn} style={{ marginTop: '15px' }}>
                  Start Next Module →
                </button>
              </div>
            </div>
          </>
        )

      // ── MY TRAINING TAB ──
      case 'training':
        return <GuideCourseList userId={user?.uid} />

      // ── CERTIFICATES TAB ──
      case 'certificate':
        return <CertificateManager userId={user?.uid} isAdmin={false} />

      // ── NOTIFICATIONS TAB ──
      case 'alerts':
        return (
          <>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Notifications</h2>
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

      case 'monitor':
        return <MonitorPanel />

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
