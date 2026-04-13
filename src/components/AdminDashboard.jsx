// components/AdminDashboard.jsx

import React, { useEffect, useState } from 'react'
import styles from './Dashboard.module.css'

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const STATS = [
  { label: 'Total Guides', value: '24', icon: '👥', trend: '+2 this month', color: '#2d6a4f' },
  { label: 'Active Modules', value: '8', icon: '📚', trend: '3 in progress', color: '#3a86ff' },
  { label: 'Alerts Today', value: '5', icon: '🚨', trend: '2 unresolved', color: '#e63946' },
  { label: 'Certifications', value: '61', icon: '🎖️', trend: '4 expiring soon', color: '#e9c46a' },
]

const ALERTS = [
  { time: '09:12 AM', type: 'High', msg: 'Possible plant handling detected — Guide #3, Sector B' },
  { time: '08:47 AM', type: 'Medium', msg: 'Wildlife disturbance flagged — near River Trail' },
  { time: 'Yesterday', type: 'Low', msg: 'Guide certification expiring — Ahmad Razif' },
]

function AdminDashboard({ activeTab }) {

  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"))

        const userList = []
        querySnapshot.forEach((doc) => {
          userList.push({
            id: doc.id,
            ...doc.data()
          })
        })

        setUsers(userList)

      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [])

  // 🔥 SEPARATE USERS
  const guides = users.filter(u => u.role === "guide")
  const admins = users.filter(u => u.role === "admin")

  const renderContent = () => {
    switch (activeTab) {

      // ── OVERVIEW ──
      case 'dashboard':
        return (
          <>
            <SectionTitle title="Admin Overview" subtitle="Sarawak Forestry Corporation Platform" />

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

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Recent Alerts</h3>
              {ALERTS.map((alert, i) => (
                <AlertRow key={i} alert={alert} />
              ))}
            </div>
          </>
        )

      // ── GUIDES (REAL + SEPARATED) ──
      case 'guides':
        return (
          <>
            <SectionTitle title="Manage Users" subtitle="Real users from database" />

            <div className={styles.section}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>

                  <tbody>

                    {/* 🛡️ ADMINS */}
                    <tr>
                      <td colSpan="3"><strong>🛡️ Admins ({admins.length})</strong></td>
                    </tr>

                    {admins.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                      </tr>
                    ))}

                    {/* 👤 GUIDES */}
                    <tr>
                      <td colSpan="3"><strong>👤 Guides ({guides.length})</strong></td>
                    </tr>

                    {guides.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            </div>
          </>
        )

      case 'modules':
        return (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3>Modules Section</h3>
          </div>
        )

      case 'alerts':
        return (
          <div className={styles.section}>
            {ALERTS.map((alert, i) => (
              <AlertRow key={i} alert={alert} />
            ))}
          </div>
        )

      default:
        return (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🚧</div>
            <h3>Coming Soon</h3>
          </div>
        )
    }
  }

  return <div>{renderContent()}</div>
}

// ── COMPONENTS ──

function SectionTitle({ title, subtitle }) {
  return (
    <div className={styles.pageHeader}>
      <h2 className={styles.pageTitle}>{title}</h2>
      <p className={styles.pageSub}>{subtitle}</p>
    </div>
  )
}

function AlertRow({ alert }) {
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