// components/GuideDashboard.jsx
// Shows the Park Guide's personal dashboard.
// Different from admin — guides see THEIR OWN training, progress, badges.
//
// Props:
//   activeTab = which sidebar tab is active
//   user      = the logged-in guide's info
//   onTabChange = function to change the active tab

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import styles from './Dashboard.module.css'
import SettingsPanel from './SettingsPanel'
import { auth } from '../firebase'

import MonitorPanel from './MonitorPanel'
import GuideCourseList from './GuideCourseList'
import BadgeManager from './BadgeManager'

function GuideDashboard({ activeTab, user, onTabChange }) {
  const [enrollments, setEnrollments] = useState([])
  const [modules, setModules] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      fetchEnrollments()
      fetchBadges()
    }
    fetchModules()
  }, [user?.uid])

  const fetchModules = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'trainingModules'))
      const moduleList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setModules(moduleList)
    } catch (error) {
      console.error('Error fetching modules:', error)
    }
  }

  const fetchEnrollments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'enrollments'))
      const enrollmentList = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.guideId === user?.uid)
      setEnrollments(enrollmentList)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    }
  }

  const fetchBadges = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'badges'))
      const badgeList = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(b => b.guideId === user?.uid)
      setBadges(badgeList)
    } catch (error) {
      console.error('Error fetching badges:', error)
    }
  }

  const getModuleInfo = (moduleId) => {
    return modules.find(m => m.id === moduleId)
  }

  const getCategoryEmoji = (category) => {
    const categoryEmoji = {
      conservation: '🌍',
      biodiversity: '🦋',
      'eco-tourism': '🌿',
      legislation: '⚖️',
      safety: '🦺',
    }
    return categoryEmoji[category] || '📚'
  }

  const getEnrollmentProgress = (enrollment) => {
    if (enrollment.status === 'passed') return 100
    if (enrollment.status === 'failed') return 50
    if (enrollment.progress) return enrollment.progress
    return 0
  }

  const getStatusLabel = (enrollment) => {
    if (enrollment.status === 'passed') return 'Completed'
    if (enrollment.status === 'failed') return 'Failed'
    if (enrollment.progress === 100) return 'In Progress'
    return 'Not Started'
  }

  const handleStartNextModule = () => {
    if (onTabChange) {
      onTabChange('training')
    }
  }

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date()
  }

  const renderContent = () => {
    switch (activeTab) {

      // ── MY DASHBOARD TAB ──
      case 'dashboard':

      const approvedEnrollments =
        enrollments.filter(
          e =>
            e.status === 'approved' ||
            e.status === 'passed' ||
            e.status === 'failed'
        )
        const completed = enrollments.filter(e => e.status === 'passed').length
        const total = approvedEnrollments.length
        const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0
        const validBadges = badges.filter(b => !isExpired(b.expiresAt)).length
        const expiredBadges = badges.filter(b => isExpired(b.expiresAt)).length

        return (
          <>
            {/* Welcome Banner */}
            <div className={styles.welcomeBanner}>
              <div className={styles.bannerContent}>
                <h3>Welcome, {user?.name || 'Guide'}! 🌿</h3>
                <p>You're doing great! Keep up with your training to earn badges.</p>
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
                    <div className={styles.statLabel}>Valid Badges</div>
                    <div className={styles.statValue}>{validBadges}</div>
                    <div className={styles.statTrend}>🔹 Earn more!</div>
                  </div>
                </div>
              </div>
              <div className={styles.statCard} style={{ '--accent': '#e63946' }}>
                <div className={styles.statCardInner}>
                  <div className={styles.statIcon}>⚠️</div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Expired Badges</div>
                    <div className={styles.statValue}>{expiredBadges}</div>
                    <div className={styles.statTrend}>🔹 Renew soon</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Module List */}
            <div className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <h3>📚 Training Modules</h3>
                <span className={styles.badge}>{total} Enrolled</span>
              </div>
              {approvedEnrollments.length === 0  ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No modules enrolled yet. Go to Training to enroll in modules.
                </p>
              ) : (
                <div className={styles.moduleList}>
                  {approvedEnrollments.map((enrollment) => {
                    const module = getModuleInfo(enrollment.moduleId)
                    const progress = getEnrollmentProgress(enrollment)
                    const status = getStatusLabel(enrollment)
                    return (
                      <div key={enrollment.id} className={styles.moduleListItem}>
                        <div className={styles.moduleListItemLeft}>
                          <span className={styles.moduleEmoji}>{module ? getCategoryEmoji(module.category) : '📚'}</span>
                          <div>
                            <div className={styles.moduleName}>{module?.title || 'Unknown Module'}</div>
                            <div className={styles.moduleStatusBadge} style={{ color: status === 'Completed' ? '#06a77d' : status === 'Failed' ? '#e63946' : status === 'In Progress' ? '#f77f00' : '#666' }}>
                              {status}
                            </div>
                          </div>
                        </div>
                        <div className={styles.moduleListItemRight}>
                          <div className={styles.progressBarTiny}>
                            <div className={styles.progressFillTiny} style={{ width: `${progress}%` }} />
                          </div>
                          <span className={styles.progressPercent}>{progress}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className={styles.ctaCard}>
              <div className={styles.ctaContent}>
                <h3>🎯 Next Steps</h3>
                <p>Continue your training to earn badges and advance your skills.</p>
                <button className={styles.primaryBtn} style={{ marginTop: '15px' }} onClick={handleStartNextModule}>
                  Start Next Module →
                </button>
              </div>
            </div>
          </>
        )

      // ── MY TRAINING TAB ──
      case 'training':
        return <GuideCourseList userId={user?.uid} />

        case 'settings':
          return (
            <SettingsPanel
              user={auth.currentUser}
            />
          )

      // ── BADGES TAB ──
      case 'badge':
        return <BadgeManager userId={user?.uid} isAdmin={false} />

      // ── NOTIFICATIONS TAB ──
      case 'alerts':
        return (
          <>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Notifications</h2>
            </div>
            <div className={styles.section}>
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No notifications at this time.
              </p>
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
