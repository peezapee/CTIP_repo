// components/ProgressTracking.jsx
// Admin dashboard to track guide progress and completion

import React, { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import styles from './Dashboard.module.css'

function ProgressTracking() {
  const [guides, setGuides] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [modules, setModules] = useState([])
  const [selectedGuide, setSelectedGuide] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch guides from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const guidesList = usersSnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() }))
        .filter(u => u.role === 'guide')
      setGuides(guidesList)

      // Fetch enrollments from Firestore
      const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'))
      const enrollmentsList = enrollmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setEnrollments(enrollmentsList)

      // Fetch modules from Firestore
      const modulesSnapshot = await getDocs(collection(db, 'trainingModules'))
      const modulesList = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setModules(modulesList)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const getGuideProgress = (guideId) => {
    const guideEnrollments = enrollments.filter((e) => e.guideId === guideId)
    if (guideEnrollments.length === 0) return 0

    const totalProgress = guideEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0)
    return Math.round(totalProgress / guideEnrollments.length)
  }

  const getGuideStats = (guideId) => {
    const guideEnrollments = enrollments.filter((e) => e.guideId === guideId)
    return {
      total: guideEnrollments.length,
      completed: guideEnrollments.filter((e) => e.status === 'completed').length,
      passed: guideEnrollments.filter((e) => e.status === 'passed').length,
      inProgress: guideEnrollments.filter((e) => e.status === 'in-progress').length,
    }
  }

  const getModuleName = (moduleId) => {
    return modules.find((m) => m.id === moduleId)?.title || 'Unknown'
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>📊 Progress Tracking</h2>
        <p className={styles.pageSub}>Monitor guide training progress and completion</p>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statValue}>{guides.length}</div>
          <div className={styles.statLabel}>Total Guides</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statValue}>{enrollments.length}</div>
          <div className={styles.statLabel}>Total Enrollments</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>
            {enrollments.filter((e) => e.status === 'passed').length}
          </div>
          <div className={styles.statLabel}>Completed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎖️</div>
          <div className={styles.statValue}>
            {enrollments.filter((e) => e.status === 'passed').length}
          </div>
          <div className={styles.statLabel}>Certified</div>
        </div>
      </div>

      {/* Guides Overview */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ marginBottom: '20px' }}>Guides Progress Overview</h3>

        {guides.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No guides found.
          </p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Guide Name</th>
                  <th>Avg Progress</th>
                  <th>Enrolled</th>
                  <th>Completed</th>
                  <th>Passed</th>
                  <th>In Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {guides.map((guide) => {
                  const stats = getGuideStats(guide.uid)
                  const avgProgress = getGuideProgress(guide.uid)

                  return (
                    <tr key={guide.uid}>
                      <td>
                        <strong>{guide.name}</strong>
                        <br />
                        <small style={{ color: '#666' }}>{guide.email}</small>
                      </td>
                      <td>
                        <div
                          className={styles.progressBarSmall}
                          style={{ marginBottom: '5px' }}
                        >
                          <div
                            className={styles.progressFillSmall}
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                        {avgProgress}%
                      </td>
                      <td>{stats.total}</td>
                      <td>{stats.completed}</td>
                      <td>
                        <span className={styles.badge} style={{ backgroundColor: '#06a77d' }}>
                          {stats.passed}
                        </span>
                      </td>
                      <td>
                        <span className={styles.badge} style={{ backgroundColor: '#3a86ff' }}>
                          {stats.inProgress}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.primaryBtn}
                          onClick={() =>
                            setSelectedGuide(
                              selectedGuide?.uid === guide.uid ? null : guide
                            )
                          }
                        >
                          {selectedGuide?.uid === guide.uid ? '▼ Hide' : '▶ Details'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed View */}
      {selectedGuide && (
        <div style={{ marginTop: '40px' }}>
          <h3>📋 Detailed Progress for {selectedGuide.name}</h3>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                {enrollments
                  .filter((e) => e.guideId === selectedGuide.uid)
                  .map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td>{getModuleName(enrollment.moduleId)}</td>
                      <td>
                        <div className={styles.progressBarSmall}>
                          <div
                            className={styles.progressFillSmall}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                        {enrollment.progress}%
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            backgroundColor:
                              enrollment.status === 'passed'
                                ? '#06a77d'
                                : enrollment.status === 'completed'
                                  ? '#2d6a4f'
                                  : '#3a86ff',
                          }}
                        >
                          {enrollment.status}
                        </span>
                      </td>
                      <td>{enrollment.score !== null ? `${enrollment.score}%` : '—'}</td>
                      <td>{new Date(enrollment.enrolledAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressTracking
