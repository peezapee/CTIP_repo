// components/BadgeManager.jsx
// Manage and display badges for guides

import React, { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { generateBadgePDF } from '../utils/BadgeUtils.js'
import styles from './Dashboard.module.css'

function BadgeManager({ userId, isAdmin = false }) {
  const [badges, setBadges] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [modules, setModules] = useState([])
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBadges()
    fetchEnrollments()
    fetchModules()
    fetchGuides()
  }, [userId, isAdmin])

  const fetchBadges = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'badges'))
      const allBadges = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('All badges in DB:', allBadges)
      console.log('Current userId:', userId)
      const badgeList = isAdmin ? allBadges : allBadges.filter(b => b.guideId === userId)
      console.log('Filtered badges for user:', badgeList)
      setBadges(badgeList)
    } catch (error) {
      console.error('Error fetching badges:', error)
    }
  }

  const fetchEnrollments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'enrollments'))
      const allEnrollments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const enrollmentList = isAdmin
        ? allEnrollments.filter(e => e.status === 'passed')
        : allEnrollments.filter(e => e.guideId === userId && e.status === 'passed')
      setEnrollments(enrollmentList)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    }
  }

  const fetchModules = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'trainingModules'))
      const moduleList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setModules(moduleList)
    } catch (error) {
      console.error('Error fetching modules:', error)
    }
  }

  const fetchGuides = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'))
      const users = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      const guideList = users.filter(u => u.role === 'guide')
      setGuides(guideList)
    } catch (error) {
      console.error('Error fetching guides:', error)
    }
  }

  const handleIssueBadge = async (enrollment) => {
    if (badges.some((b) => b.enrollmentId === enrollment.id)) {
      alert('⚠️ Badge already issued for this enrollment')
      return
    }

    setLoading(true)
    try {
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 2) // 2-year validity

      await addDoc(collection(db, 'badges'), {
        guideId: enrollment.guideId,
        moduleId: enrollment.moduleId,
        enrollmentId: enrollment.id,
        title:
        getModuleName(enrollment.moduleId)
          .replace('Guiding', '')
          .replace('Eco-Tourism', '')
          .trim() + ' Guide Badge',
        issuedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        BadgeNumber: `BADGE-${Date.now()}`,
        score: enrollment.score,
      })
      
      alert('✅ Badge issued successfully')
      fetchBadges()
    } catch (error) {
      console.error('Error issuing Badge:', error)
      alert('❌ Error issuing Badge')
    } finally {
      setLoading(false)
    }
  }

  const getModuleName = (moduleId) => {
    return modules.find((m) => m.id === moduleId)?.title || 'Unknown Module'
  }

  const getGuideName = (guideId) => {
    return guides.find((g) => g.uid === guideId)?.name || 'Unknown Guide'
  }

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date()
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>🎖️ Badges</h2>
      </div>

      {/* Issued Badges */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '20px' }}>
          {isAdmin ? 'Issued Badges' : 'Your Badges'}
        </h3>
        {badges.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No badges yet.
          </p>
        ) : (
          <div className={styles.badgesGrid}>
            {badges.map((badge) => {
              const expired = isExpired(badge.expiresAt)
              return (
                <div key={badge.id} className={styles.badgeCard}>
                  <div className={styles.badgeHeader}>
                    <h4>🎖️ {badge.title}</h4>
                    <span
                      className={styles.badge}
                      style={{
                        backgroundColor: expired ? '#e63946' : '#06a77d',
                      }}
                    >
                      {expired ? '❌ Expired' : '✅ Valid'}
                    </span>
                  </div>
                  <div className={styles.badgeDetails}>
                    <p>
                      <strong>Badge #:</strong> {badge.BadgeNumber}
                    </p>
                    <p>
                      <strong>Issued:</strong>{' '}
                      {new Date(badge.issuedAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Expires:</strong>{' '}
                      {new Date(badge.expiresAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Score:</strong> {badge.score}%
                    </p>
                  </div>
                  <button 
                    className={styles.primaryBtn}
                    onClick={() => {
                      const guideName = guides.find(g => g.uid === badge.guideId)?.name || 'Guide';
                      generateBadgePDF(badge, guideName);
                    }}
                  >
                    📥 Download Badge
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending Badges (Admin only) */}
      {isAdmin && enrollments.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>
            Pending Badges (Passed but Not Issued)
          </h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Guide Name</th>
                  <th>Module</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>{getGuideName(enrollment.guideId)}</td>
                    <td>{getModuleName(enrollment.moduleId)}</td>
                    <td>{enrollment.score}%</td>
                    <td>
                      <button
                        className={styles.primaryBtn}
                        onClick={() => handleIssueBadge(enrollment)}
                        disabled={loading}
                      >
                        {loading ? '⏳ Issuing...' : '✅ Issue Badge'}
                      </button>
                    </td>
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

export default BadgeManager
