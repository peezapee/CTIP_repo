// components/CertificateManager.jsx
// Manage and display certificates for guides

import React, { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { generateCertificatePDF } from '../utils/certificateUtils.js'
import styles from './Dashboard.module.css'

function CertificateManager({ userId, isAdmin = false }) {
  const [certificates, setCertificates] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [modules, setModules] = useState([])
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCertificates()
    fetchEnrollments()
    fetchModules()
    fetchGuides()
  }, [userId, isAdmin])

  const fetchCertificates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'certificates'))
      const allCerts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('All certificates in DB:', allCerts)
      console.log('Current userId:', userId)
      const certList = isAdmin ? allCerts : allCerts.filter(c => c.guideId === userId)
      console.log('Filtered certificates for user:', certList)
      setCertificates(certList)
    } catch (error) {
      console.error('Error fetching certificates:', error)
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

  const handleIssueCertificate = async (enrollment) => {
    if (certificates.some((c) => c.enrollmentId === enrollment.id)) {
      alert('⚠️ Certificate already issued for this enrollment')
      return
    }

    setLoading(true)
    try {
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 2) // 2-year validity

      await addDoc(collection(db, 'certificates'), {
        guideId: enrollment.guideId,
        moduleId: enrollment.moduleId,
        enrollmentId: enrollment.id,
        title: `${getModuleName(enrollment.moduleId)} Certification`,
        issuedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        certificateNumber: `CERT-${Date.now()}`,
        score: enrollment.score,
      })
      
      alert('✅ Certificate issued successfully')
      fetchCertificates()
    } catch (error) {
      console.error('Error issuing certificate:', error)
      alert('❌ Error issuing certificate')
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
        <h2 className={styles.pageTitle}>🎖️ Certificates</h2>
      </div>

      {/* Issued Certificates */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '20px' }}>
          {isAdmin ? 'Issued Certificates' : 'Your Certificates'}
        </h3>
        {certificates.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No certificates yet.
          </p>
        ) : (
          <div className={styles.certificatesGrid}>
            {certificates.map((cert) => {
              const expired = isExpired(cert.expiresAt)
              return (
                <div key={cert.id} className={styles.certificateCard}>
                  <div className={styles.certHeader}>
                    <h4>🎖️ {cert.title}</h4>
                    <span
                      className={styles.badge}
                      style={{
                        backgroundColor: expired ? '#e63946' : '#06a77d',
                      }}
                    >
                      {expired ? '❌ Expired' : '✅ Valid'}
                    </span>
                  </div>
                  <div className={styles.certDetails}>
                    <p>
                      <strong>Certificate #:</strong> {cert.certificateNumber}
                    </p>
                    <p>
                      <strong>Issued:</strong>{' '}
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Expires:</strong>{' '}
                      {new Date(cert.expiresAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Score:</strong> {cert.score}%
                    </p>
                  </div>
                  <button 
                    className={styles.primaryBtn}
                    onClick={() => {
                      const guideName = guides.find(g => g.uid === cert.guideId)?.name || 'Guide';
                      generateCertificatePDF(cert, guideName);
                    }}
                  >
                    📥 Download Certificate
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending Certificates (Admin only) */}
      {isAdmin && enrollments.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>
            Pending Certificates (Passed but Not Issued)
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
                        onClick={() => handleIssueCertificate(enrollment)}
                        disabled={loading}
                      >
                        {loading ? '⏳ Issuing...' : '✅ Issue Certificate'}
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

export default CertificateManager
