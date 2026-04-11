// components/AdminDashboard.jsx
// Shows the admin view of the dashboard.
// The content changes based on which sidebar tab is active.
//
// Props:
//   activeTab = which tab is selected (e.g. 'dashboard', 'guides', etc.)

import React from 'react'
import styles from './Dashboard.module.css'

// Fake data for the overview cards
const STATS = [
  { label: 'Total Guides',       value: '24',  icon: '👥', trend: '+2 this month',  color: '#2d6a4f' },
  { label: 'Active Modules',     value: '8',   icon: '📚', trend: '3 in progress',  color: '#3a86ff' },
  { label: 'Alerts Today',       value: '5',   icon: '🚨', trend: '2 unresolved',   color: '#e63946' },
  { label: 'Certifications',     value: '61',  icon: '🎖️', trend: '4 expiring soon',color: '#e9c46a' },
]

// Fake list of park guides for the table
const GUIDES = [
  { name: 'Ahmad Razif',    status: 'Active',    progress: 80, module: 'Biodiversity' },
  { name: 'Siti Nuraini',   status: 'Active',    progress: 65, module: 'Conservation' },
  { name: 'Ricky Unggang',  status: 'Inactive',  progress: 30, module: 'Safety' },
  { name: 'Linda Empang',   status: 'Active',    progress: 95, module: 'Eco-tourism' },
  { name: 'James Liew',     status: 'Active',    progress: 50, module: 'Legislation' },
]

// Fake alerts
const ALERTS = [
  { time: '09:12 AM', type: 'High',   msg: 'Possible plant handling detected — Guide #3, Sector B' },
  { time: '08:47 AM', type: 'Medium', msg: 'Wildlife disturbance flagged — near River Trail' },
  { time: 'Yesterday', type: 'Low',  msg: 'Guide certification expiring — Ahmad Razif' },
]

function AdminDashboard({ activeTab }) {
  // Decide what to render based on the active tab
  const renderContent = () => {
    switch (activeTab) {

      // ── OVERVIEW TAB ──
      case 'dashboard':
        return (
          <>
            <SectionTitle title="Admin Overview" subtitle="Sarawak Forestry Corporation Platform" />

            {/* Stat cards in a grid */}
            <div className={styles.statsGrid}>
              {STATS.map((stat, i) => (
                <div key={i} className={styles.statCard} style={{ '--accent': stat.color }}>
                  <div className={styles.statIcon}>{stat.icon}</div>
                  <div className={styles.statValue}>{stat.value}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                  <div className={styles.statTrend}>{stat.trend}</div>
                </div>
              ))}
            </div>

            {/* Recent alerts preview */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Recent Alerts</h3>
              {ALERTS.map((alert, i) => (
                <AlertRow key={i} alert={alert} />
              ))}
            </div>
          </>
        )

      // ── GUIDES TAB ──
      case 'guides':
        return (
          <>
            <SectionTitle title="Manage Guides" subtitle="View and monitor all park guides" />
            <div className={styles.section}>
              {/* Table showing guide info */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Current Module</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GUIDES.map((g, i) => (
                      <tr key={i}>
                        <td className={styles.guideName}>{g.name}</td>
                        <td>
                          <span className={styles.statusBadge} data-status={g.status.toLowerCase()}>
                            {g.status}
                          </span>
                        </td>
                        <td>{g.module}</td>
                        <td>
                          {/* Progress bar */}
                          <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${g.progress}%` }} />
                          </div>
                          <span className={styles.progressText}>{g.progress}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )

      // ── MODULES TAB ──
      case 'modules':
        return (
          <>
            <SectionTitle title="Training Modules" subtitle="Manage training content for guides" />
            <div className={styles.moduleGrid}>
              {['Biodiversity', 'Conservation', 'Eco-tourism', 'Legislation', 'Safety Protocols', 'Wildlife Handling'].map((mod, i) => (
                <div key={i} className={styles.moduleCard}>
                  <div className={styles.moduleEmoji}>
                    {['🦋','🌿','🌍','⚖️','🦺','🐾'][i]}
                  </div>
                  <div className={styles.moduleName}>{mod}</div>
                  <div className={styles.moduleStats}>12 enrolled</div>
                  <button className={styles.moduleBtn}>Manage →</button>
                </div>
              ))}
            </div>
          </>
        )

      // ── ALERTS TAB ──
      case 'alerts':
        return (
          <>
            <SectionTitle title="Alert Center" subtitle="Real-time AI detection alerts" />
            <div className={styles.section}>
              {ALERTS.map((alert, i) => (
                <AlertRow key={i} alert={alert} expanded />
              ))}
            </div>
          </>
        )

      // ── DEFAULT (Settings etc.) ──
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

// ── REUSABLE SMALL COMPONENTS ──

// Page title + subtitle at the top of each section
function SectionTitle({ title, subtitle }) {
  return (
    <div className={styles.pageHeader}>
      <h2 className={styles.pageTitle}>{title}</h2>
      <p className={styles.pageSub}>{subtitle}</p>
    </div>
  )
}

// A single alert row
function AlertRow({ alert, expanded }) {
  const colors = { High: '#e63946', Medium: '#f4a261', Low: '#2d6a4f' }
  return (
    <div className={styles.alertRow}>
      <div className={styles.alertDot} style={{ background: colors[alert.type] }} />
      <div className={styles.alertContent}>
        <span className={styles.alertMsg}>{alert.msg}</span>
        <span className={styles.alertTime}>{alert.time} · {alert.type} priority</span>
      </div>
    </div>
  )
}

export default AdminDashboard