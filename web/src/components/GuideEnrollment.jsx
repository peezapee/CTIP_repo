// components/GuideEnrollment.jsx
// Admin panel to enroll guides into training modules

import React, { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc
} from 'firebase/firestore'
import { db } from '../firebase.js'
import styles from './Dashboard.module.css'

function GuideEnrollment() {
  const [guides, setGuides] = useState([])
  const [modules, setModules] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [moduleRequests, setModuleRequests] = useState([])

  useEffect(() => {
    fetchGuides()
    fetchModules()
    fetchEnrollments()
    fetchRequests()
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

  const fetchRequests = async () => {

  try {

    const querySnapshot =
      await getDocs(
        collection(db, 'moduleRequests')
      )

    const requestList =
      querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

    setModuleRequests(requestList)

  } catch (error) {

    console.error(
      'Error fetching requests:',
      error
    )
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

  const handleApproveRequest =
  async (request) => {

    try {

      await addDoc(
        collection(db, 'enrollments'),
        {

          guideId: request.guideId,

          moduleId: request.moduleId,

          progress: 0,

          status: 'in-progress',

          enrolledAt:
            new Date().toISOString()
        }
      )

      await updateDoc(
        doc(
          db,
          'moduleRequests',
          request.id
        ),
        {
          status: 'approved'
        }
      )

      alert(
        '✅ Access approved'
      )

      fetchEnrollments()
      fetchRequests()

    } catch (error) {

      console.error(error)
    }
}

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>📚 Active Enrollments</h2>
      </div>

      <div style={{ marginTop: '40px' }}>

  <h2 className={styles.pageTitle}>
    🔓 Module Access Requests
  </h2>

  {moduleRequests.filter(
    r => r.status === 'pending'
  ).length === 0 ? (

    <p>No pending requests.</p>

  ) : (

    <div className={styles.tableContainer}>

      <table className={styles.dataTable}>

        <thead>
          <tr>
            <th>Guide</th>
            <th>Requested Module</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {moduleRequests
            .filter(
              r => r.status === 'pending'
            )
            .map((request) => (

          <tr key={request.id}>
            <td>{formatName(getGuideName(request.guideId))}</td>
            <td>{getModuleName(request.moduleId)}</td>
            <td>
              <div className={styles.receiptActions}>
                <a className={styles.eyeBtn} href={request.receiptURL} target="_blank" rel="noreferrer">
                  👁
                </a>
                <button className={styles.approveBtn} onClick={() => handleApproveRequest(request)}>
                  ✅ Approve
                </button>
              </div>
            </td>
          </tr>
          ))}

        </tbody>

      </table>

    </div>
  )}

</div>

      {/* Active Enrollments */}
      <div style={{ marginTop: '40px' }}>
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
                  module.title.includes('Miri Coastal & Marine Conservation Guiding')
                    ? '6px solid #2d6a4f'
                    : module.title.includes('Semenggoh Nature Reserve Guiding')
                    ? '6px solid #3a86ff'
                    : module.title.includes('Gua Niah Conservation Guiding')
                    ? '6px solid #e9c46a'
                    : module.title.includes('Bako National Park Eco-Tourism')
                    ? '6px solid #ef74bc'
                    : module.title.includes('Kubah National Park Conservation Guiding')
                    ? '6px solid #714ce2'
                    : module.title.includes('General Park Guide Orientation')
                    ? '6px solid #832525'
                    : '6px solid #ccc'
              }}
            >

              <h3
                style={{
                  color:
                    module.title.includes('Miri Coastal & Marine Conservation Guiding')
                      ? '#2d6a4f'
                      : module.title.includes('Semenggoh Nature Reserve Guiding')
                      ? '#3a86ff'
                      : module.title.includes('Gua Niah Conservation Guiding')
                      ? '#d4a017'
                      : module.title.includes('Bako National Park Eco-Tourism')
                      ? '#ef74bc'
                      : module.title.includes('Kubah National Park Conservation Guiding')
                      ? '#714ce2'
                      : module.title.includes('General Park Guide Orientation')
                      ? '#832525'
                      : '6px solid #ccc'
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
