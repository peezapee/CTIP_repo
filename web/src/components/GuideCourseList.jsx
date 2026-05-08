// components/GuideCourseList.jsx
// Display available and enrolled courses for guides

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import styles from './Dashboard.module.css'
import QuizComponent from './QuizComponent'

function GuideCourseList({ userId }) {
  const [modules, setModules] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchModules()
    if (userId) {
      fetchEnrollments()
    }
  }, [userId])

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
    if (!userId) {
      console.warn('userId is undefined, cannot fetch enrollments')
      return
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'enrollments'))
      const enrollmentList = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.guideId === userId)
      console.log('Enrollments for user', userId, ':', enrollmentList)
      setEnrollments(enrollmentList)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    }
  }

  const getEnrollmentStatus = (moduleId) => {
    const enrollment = enrollments.find((e) => e.moduleId === moduleId)
    return enrollment
  }

  const handleStartCourse = (enrollment) => {
    setSelectedEnrollment(enrollment)
    setShowQuiz(true)
  }

  const handleQuizComplete = async (quizResults) => {
    try {
      // Update enrollment with quiz results
      const enrollmentRef = doc(db, 'enrollments', quizResults.enrollmentId)
      
      await updateDoc(enrollmentRef, {
        progress: quizResults.passed ? 100 : 50,
        status: quizResults.passed ? 'passed' : 'failed',
        score: quizResults.score,
        completedAt: new Date().toISOString()
      })

      console.log('Quiz completed:', quizResults)
      
      // Refresh enrollments after update
      await fetchEnrollments()

      setShowQuiz(false)
      alert(
        quizResults.passed
          ? '✅ Congratulations! You passed the quiz.'
          : '📚 Keep learning and try again.'
      )
    } catch (error) {
      console.error('Error completing quiz:', error)
    }
  }

  const categoryEmoji = {
    conservation: '🌍',
    biodiversity: '🦋',
    'eco-tourism': '🌿',
    legislation: '⚖️',
    safety: '🦺',
  }

  if (showQuiz && selectedEnrollment) {
    const module = modules.find((m) => m.id === selectedEnrollment.moduleId)
    return (
      <div>
        <button
          className={styles.backBtn}
          onClick={() => setShowQuiz(false)}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Courses
        </button>
        <QuizComponent
          enrollmentId={selectedEnrollment.id}
          moduleId={selectedEnrollment.moduleId}
          moduleTitle={module?.title || 'Module'}
          passingScore={module?.passingScore || 70}
          onComplete={handleQuizComplete}
        />
      </div>
    )
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>📚 Training Courses</h2>
      </div>

      {enrollments.length === 0 ? (
        <div className={styles.emptyState}>
          <p>📭 No courses assigned yet. Contact your admin to enroll in training modules.</p>
        </div>
      ) : (
        <div className={styles.coursesGrid}>
          {enrollments.map((enrollment) => {
            const module = modules.find((m) => m.id === enrollment.moduleId)
            if (!module) return null

            return (
              <div key={enrollment.id} className={styles.courseCard}>
                <div className={styles.courseHeader}>
                  <h3>
                    {categoryEmoji[module.category]} {module.title}
                  </h3>
                  <span className={styles.badge}>{module.category}</span>
                </div>

                <p className={styles.courseDesc}>{module.description}</p>

                <div className={styles.courseStats}>
                  <span>⏱️ {module.duration} minutes</span>
                  <span>📊 Pass score: {module.passingScore}%</span>
                </div>

                <div className={styles.progressSection}>
                  <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                    Progress: {enrollment.progress}%
                  </p>
                  <div className={styles.progressBarLarge}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>

                <div className={styles.statusSection}>
                  <span
                    className={styles.statusBadge}
                    style={{
                      backgroundColor:
                        enrollment.status === 'completed'
                          ? '#06a77d'
                          : enrollment.status === 'passed'
                            ? '#2d6a4f'
                            : '#3a86ff',
                    }}
                  >
                    {enrollment.status}
                  </span>
                  {enrollment.score !== null && <span>Score: {enrollment.score}%</span>}
                </div>

                <button
                  className={styles.primaryBtn}
                  onClick={() => handleStartCourse(enrollment)}
                  disabled={enrollment.status === 'passed'}
                >
                  {enrollment.status === 'passed'
                    ? '✅ Completed'
                    : enrollment.progress > 0
                      ? 'Continue Course'
                      : 'Start Course'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GuideCourseList
