// components/GuideCourseList.jsx
// Display available and enrolled courses for guides

import React, { useState, useEffect } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc
} from 'firebase/firestore'
import { db } from '../firebase.js'
import styles from './Dashboard.module.css'
import QuizComponent from './QuizComponent'

function GuideCourseList({ userId }) {
  const [modules, setModules] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [loading, setLoading] = useState(false)
  const [moduleRequests, setModuleRequests] = useState([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [paymentError, setPaymentError] = useState('')

useEffect(() => {
  fetchModules()
  if (userId) {
    fetchEnrollments()
    fetchRequests()
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

  const fetchRequests = async () => {

  try {

    const snapshot =
      await getDocs(
        collection(db, 'moduleRequests')
      )

    const requestList =
      snapshot.docs.map(doc => ({
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
    } catch (error) {
      console.error('Error completing quiz:', error)
    }
  }

  const handleRequestAccess = async (moduleId) => {

  try {

    await addDoc(
      collection(db, 'moduleRequests'),
      {

        guideId: userId,

        moduleId,

        status: 'pending',

        requestedAt:
          new Date().toISOString()
      }
    )

    alert(
      '✅ Request sent to admin'
    )

    fetchRequests()

  } catch (error) {

    console.error(error)

    alert(
      '❌ Failed to send request'
    )
  }
}

const submitPaymentRequest = async () => {

  if (!receiptFile) {

    setPaymentError(
    'Please upload receipt.'
  )
    return
  }

  try {

    const formData =
      new FormData();

    formData.append(
      "receipt",
      receiptFile
    );

    const uploadResponse =
      await fetch(

        "http://localhost:3000/upload-receipt",

        {
          method: "POST",
          body: formData
        }
    );

    const uploadData =
      await uploadResponse.json();

    const receiptURL =
      uploadData.receiptURL;

    await addDoc(
      collection(db, 'moduleRequests'),
      {

        guideId: userId,

        moduleId: selectedModule.id,

        moduleTitle: selectedModule.title,

        price: selectedModule.price,

        receiptName:
          receiptFile.name,
        receiptURL,

        status: 'pending',

        requestedAt:
          new Date().toISOString()
      }
    )

    alert(
      '✅ Payment request submitted'
    )

    setShowPaymentModal(false)

    setReceiptFile(null)

    fetchRequests()

  } catch (error) {

    console.error(error)

    alert(
      '❌ Failed to submit request'
    )
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

  const enrolledModules =
  modules.filter(module =>
    enrollments.some(
      e => e.moduleId === module.id
    )
  )

const lockedModules =
  modules.filter(module =>
    !enrollments.some(
      e => e.moduleId === module.id
    )
  )

  return (
    <div>
      {showPaymentModal && (
      <div className={styles.modalOverlay}>

        <div className={styles.paymentModal}>

          <h2>
            Unlock Module
          </h2>

          <p>
            {selectedModule?.title}
          </p>

          <h3>
            💰 RM {selectedModule?.price}
          </h3>

          <img
            src="/images/bankqr.png"
            alt="Payment QR"
            className={styles.qrImage}
          />

          <p
            style={{
              marginBottom: '15px'
            }}
          >
            Scan QR code and upload receipt.
          </p>

          {paymentError && (
            <p className={styles.errorText}>
              {paymentError}
            </p>
          )}

          <input
            type="file"
            onChange={(e) =>
              setReceiptFile(
                e.target.files[0]
              )
            }
          />

          <button
            className={styles.primaryBtn}
            onClick={submitPaymentRequest}
          >
            Submit Receipt
          </button>

          <button
            className={styles.secondaryBtn}
            onClick={() =>
              setShowPaymentModal(false)
            }
          >
            Cancel
          </button>

        </div>

      </div>
    )}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>📚 Training Courses</h2>
      </div>

      <h3 style={{ marginBottom: '15px' }}>
        Your Modules
      </h3>

      <div className={styles.coursesGrid}>
          {enrolledModules.map((module) => {

          const enrollment =
            enrollments.find(
              e => e.moduleId === module.id
            )

          const pendingRequest =
            moduleRequests.find(
              r =>
                r.moduleId === module.id &&
                r.guideId === userId &&
                r.status === 'pending'
            )
            
            return (
              <div
                key={module.id}
                className={
                  enrollment
                    ? styles.courseCard
                    : `${styles.courseCard} ${styles.lockedCard}`
                }
              >
                <div className={styles.courseHeader}>
                  <h3>
                    {categoryEmoji[module.category]} {module.title}
                  </h3>
                  <span className={styles.badge}>{module.category}</span>
                </div>

                <p className={styles.courseDesc}>{module.description}</p>
                <p style={{
                    fontWeight: 'bold',
                    color: '#e63946',
                    marginBottom: '15px',
                    fontSize: '18px'}}>💰 RM {module.price}
                </p>

                <div className={styles.courseStats}>
                  <span>⏱️ {module.duration} minutes</span>
                  <span>📊 Pass score: {module.passingScore}%</span>
                </div>

                <div className={styles.progressSection}>
                  <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                    Progress: {enrollment ? enrollment.progress : 0}%
                  </p>
                  <div className={styles.progressBarLarge}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${enrollment ? enrollment.progress : 0}%` }}
                    />
                  </div>
                </div>

                <div className={styles.statusSection}>
                  <span
                    className={styles.statusBadge}
                    style={{
                      backgroundColor:
                        enrollment?.status === 'completed'
                          ? '#06a77d'
                          : enrollment?.status === 'passed'
                            ? '#2d6a4f'
                            : '#3a86ff',
                    }}
                  >
                    {enrollment?.status}
                  </span>
                  {enrollment?.score != null && (
                  <span>
                    Score: {enrollment.score}%
                  </span>
                )}
                </div>

                {enrollment ? (

                  <button
                    className={styles.primaryBtn}
                    onClick={() =>
                      handleStartCourse(enrollment)
                    }
                    disabled={
                      enrollment?.status === 'passed'
                    }
                  >

                    {enrollment?.status === 'passed'
                      ? '✅ Completed'
                      : enrollment.progress > 0
                      ? 'Continue Course'
                      : 'Start Course'}

                  </button>

                ) : pendingRequest ? (

                  <button
                    className={styles.secondaryBtn}
                    disabled
                  >
                    ⏳ Pending Approval
                  </button>

                ) : (

                  <button
                    className={styles.primaryBtn}
                    onClick={async () => {

                      // FREE / compulsory module
                      if (
                        module.price === 0 ||
                        module.required === true
                      ) {

                        await addDoc(
                          collection(db, 'enrollments'),
                          {

                            guideId: userId,

                            moduleId: module.id,

                            progress: 0,

                            status: 'in-progress',

                            enrolledAt:
                              new Date().toISOString()
                          }
                        )

                        await fetchEnrollments()

                        alert(
                          '✅ General module unlocked'
                        )

                        return
                      }

                      // Paid modules
                      setSelectedModule(module)

                      setShowPaymentModal(true)

                    }}
                  >
                    🔒 Unlock Module
                  </button>

                )}

              </div>
            )
          })}
          </div>

          <h3 style={{
            marginTop: '40px',
            marginBottom: '15px'
          }}>
            Available Modules
          </h3>
          <h4>
            Purchase access to unlock these protected area training modules.
          </h4>
          <div className={styles.coursesGrid}>

            {lockedModules.map((module) => {

              const pendingRequest =
                moduleRequests.find(
                  r =>
                    r.moduleId === module.id &&
                    r.guideId === userId &&
                    r.status === 'pending'
                )

              return (

                <div
                  key={module.id}
                  className={`${styles.courseCard} ${styles.lockedCard}`}
                >

                  <div className={styles.courseHeader}>
                    <h3>{module.title}</h3>

                    <span className={styles.badge}>
                      {module.category}
                    </span>
                  </div>

                  <p className={styles.courseDesc}>
                    {module.description}
                  </p>

                  {pendingRequest ? (

                    <button
                      className={styles.secondaryBtn}
                      disabled
                    >
                      ⏳ Pending Approval
                    </button>

                  ) : (

                    <button
                      className={styles.primaryBtn}
                      onClick={async () => {

                      // FREE / compulsory module
                      if (
                        module.price === 0 ||
                        module.required === true
                      ) {

                        await addDoc(
                          collection(db, 'enrollments'),
                          {

                            guideId: userId,

                            moduleId: module.id,

                            progress: 0,

                            status: 'in-progress',

                            enrolledAt:
                              new Date().toISOString()
                          }
                        )

                        await fetchEnrollments()

                        alert('✅ General module unlocked')

                        return
                      }

                      // Paid module
                      setSelectedModule(module)

                      setShowPaymentModal(true)

                    }}
                    >
                      🔒 Request Access
                    </button>

                  )}

                </div>
              )
            })}

          </div>
          </div>
            )
          }

export default GuideCourseList
