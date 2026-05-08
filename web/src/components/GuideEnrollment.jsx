// components/GuideEnrollment.jsx
// Admin panel to enroll guides into training modules

import React, { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import styles from './Dashboard.module.css'

function GuideEnrollment() {
  const [guides, setGuides] = useState([])
  const [modules, setModules] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [selectedGuide, setSelectedGuide] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchGuides()
    fetchModules()
    fetchEnrollments()
  }, [])

  const fetchGuides = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'))
      const guideList = querySnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() }))
        .filter(u => u.role === 'guide')
      setGuides(guideList)
    } catch (error) {
      console.error('Error fetching guides:', error)
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

  const fetchEnrollments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'enrollments'))
      const enrollmentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setEnrollments(enrollmentList)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    }
  }

  const handleEnroll = async (e) => {
    e.preventDefault()
    if (!selectedGuide || !selectedModule) {
      alert('❌ Please select both a guide and module')
      return
    }

    // Check if already enrolled
    const alreadyEnrolled = enrollments.some(
      (e) => e.guideId === selectedGuide && e.moduleId === selectedModule
    )
    if (alreadyEnrolled) {
      alert('⚠️ Guide is already enrolled in this module')
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'enrollments'), {
        guideId: selectedGuide,
        moduleId: selectedModule,
        enrolledAt: new Date().toISOString(),
        progress: 0,
        status: 'in-progress',
        score: null,
        completedAt: null,
      })
      
      alert('✅ Guide enrolled successfully')
      setSelectedGuide('')
      setSelectedModule('')
      fetchEnrollments()
    } catch (error) {
      console.error('Error enrolling guide:', error)
      alert('❌ Error enrolling guide')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveEnrollment = async (enrollmentId) => {
    if (!window.confirm('Remove this enrollment?')) return

    try {
      await deleteDoc(doc(db, 'enrollments', enrollmentId))
      alert('✅ Enrollment removed')
      fetchEnrollments()
    } catch (error) {
      console.error('Error removing enrollment:', error)
      alert('❌ Error removing enrollment')
    }
  }

  const getGuideName = (guideId) => {
    return guides.find((g) => g.uid === guideId)?.name || 'Unknown'
  }

  const getModuleName = (moduleId) => {
    return modules.find((m) => m.id === moduleId)?.title || 'Unknown'
  }

  const statusColors = {
    'in-progress': '#3a86ff',
    completed: '#2d6a4f',
    passed: '#06a77d',
    failed: '#e63946',
  }

  function formatName(name) {

  if (!name) return 'Unknown'

  return name
    .split(' ')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(' ')
}

const groupedByModule =
  modules.map((module) => ({

    ...module,

    enrollments:
      enrollments.filter(
        (enrollment) =>
          enrollment.moduleId === module.id
      )
  }))

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>👥 Guide Enrollment</h2>
      </div>

      {/* Enrollment Form */}
      <div className={styles.formCard}>
        <h3>Enroll Guide in Module</h3>
        <form onSubmit={handleEnroll}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Select Guide *</label>
              <select
                value={selectedGuide}
                onChange={(e) => setSelectedGuide(e.target.value)}
                required
              >
                <option value="">-- Choose a guide --</option>
                {guides.map((guide) => (
                  <option key={guide.uid} value={guide.uid}>
                    {guide.name} ({guide.email})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Select Module *</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                required
              >
                <option value="">-- Choose a module --</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className={styles.primaryBtn}>
            {loading ? '⏳ Enrolling...' : '✅ Enroll Guide'}
          </button>
        </form>
      </div>

      {/* Active Enrollments */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ marginBottom: '20px' }}>Active Enrollments</h3>
        {enrollments.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No active enrollments yet.
          </p>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.moduleCards}>

          {groupedByModule.map((module) => (

            <div
              key={module.id}
              className={styles.moduleEnrollmentCard}
              style={{
                borderLeft:
                  module.title.includes('Biodiversity')
                    ? '6px solid #2d6a4f'
                    : module.title.includes('Wildlife')
                    ? '6px solid #3a86ff'
                    : '6px solid #e9c46a'
              }}
            >

              <h3
                style={{
                  color:
                    module.title.includes('Biodiversity')
                      ? '#2d6a4f'
                      : module.title.includes('Wildlife')
                      ? '#3a86ff'
                      : '#d4a017'
                }}
              >
                {module.title}
              </h3>

              {module.enrollments.length === 0 ? (

                <p>No guides enrolled.</p>

              ) : (

                <div className={styles.enrolledGuideList}>

                  {module.enrollments.map((enrollment) => (

                    <div
                      key={enrollment.id}
                      className={styles.enrolledGuideCard}
                    >

                      <div>
                        <strong>
                          {formatName(
                            getGuideName(
                              enrollment.guideId
                            )
                          )}
                        </strong>
                      </div>

                      <div>
                        Progress:
                        {enrollment.progress}%
                      </div>

                      <div>
                        Status:
                        {enrollment.status}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GuideEnrollment
