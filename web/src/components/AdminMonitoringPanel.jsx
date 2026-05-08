import React, { useCallback, useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'

import { auth, db } from '../firebase'
import styles from './Dashboard.module.css'

const API_BASE = 'http://localhost:3000'

function AdminMonitoringPanel() {
  const [status, setStatus] = useState({
    running: false,
    canControl: false,
    isLocked: false,
  })
  const [statusError, setStatusError] = useState('')
  const [incidents, setIncidents] = useState([])
  const [lockMessage, setLockMessage] = useState('')
  const [lockLoading, setLockLoading] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        throw new Error('Please log in again to review monitoring status.')
      }

      const res = await fetch(`${API_BASE}/detector/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load detector status.')
      }

      setStatus({
        running: Boolean(data.running),
        canControl: Boolean(data.canControl),
        isLocked: Boolean(data.isLocked),
      })
      setStatusError('')
    } catch (error) {
      console.error('Admin monitoring status error:', error)
      setStatusError(error.message || 'Unable to connect to the detector server.')
    }
  }, [])

  useEffect(() => {
    loadStatus()

    const id = setInterval(loadStatus, 5000)
    return () => clearInterval(id)
  }, [loadStatus])

  useEffect(() => {
    const incidentsQuery = query(
      collection(db, 'incidents'),
      orderBy('timestamp', 'desc'),
      limit(10)
    )

    const unsubscribe = onSnapshot(
      incidentsQuery,
      (snapshot) => {
        const nextIncidents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setIncidents(nextIncidents)
      },
      (error) => {
        console.error('Incident monitoring error:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  const alertIncidents = incidents.filter((incident) => typeof incident.confidence === 'number' && incident.confidence >= 0.95)

  const updateLock = useCallback(async (action) => {
    setLockLoading(true)

    try {
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        throw new Error('Please log in again to manage camera access.')
      }

      const res = await fetch(`${API_BASE}/detector/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Unable to ${action} camera.`)
      }

      setLockMessage(data.message || 'Camera access updated.')
      await loadStatus()
    } catch (error) {
      console.error(`Camera ${action} error:`, error)
      setLockMessage(error.message || 'Unable to update camera access.')
    } finally {
      setLockLoading(false)

      setTimeout(() => {
        setLockMessage('')
      }, 3000)
    }
  }, [loadStatus])

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Incident Monitoring</h2>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ '--accent': '#2d6a4f' }}>
          <div className={styles.statIcon}>📡</div>
          <div className={styles.statValue}>{status.running ? 'Live' : 'Idle'}</div>
          <div className={styles.statLabel}>Tour Monitoring Status</div>
          <div className={styles.statTrend}>{status.isLocked ? 'Guide access locked' : 'Guide access available'}</div>
        </div>

        <div className={styles.statCard} style={{ '--accent': '#e63946' }}>
          <div className={styles.statIcon}>🚨</div>
          <div className={styles.statValue}>{alertIncidents.length}</div>
          <div className={styles.statLabel}>Alert Review</div>
          <div className={styles.statTrend}>High-confidence recent detections</div>
        </div>

        <div className={styles.statCard} style={{ '--accent': '#3a86ff' }}>
          <div className={styles.statIcon}>🎥</div>
          <div className={styles.statValue}>{incidents.length}</div>
          <div className={styles.statLabel}>Evidence Review</div>
          <div className={styles.statTrend}>Snapshots and clips ready for review</div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Guide Camera Access</h3>
        <p className={styles.monitorNote}>
          Lock the camera if you want guides to remain on the monitor page without being able to start or stop monitoring.
        </p>

        <div className={styles.formRow}>
          <button
            className={styles.deleteBtn}
            disabled={lockLoading || status.isLocked}
            onClick={() => updateLock('lock')}
          >
            {lockLoading && !status.isLocked ? 'Locking...' : 'Lock Camera'}
          </button>

          <button
            className={styles.createBtn}
            disabled={lockLoading || !status.isLocked}
            onClick={() => updateLock('unlock')}
          >
            {lockLoading && status.isLocked ? 'Unlocking...' : 'Unlock Camera'}
          </button>
        </div>

        <p className={styles.monitorNote}>
          {status.isLocked
            ? 'Guides can still view the monitor page, but their monitoring controls are disabled.'
            : 'Guides currently have access to their monitoring controls.'}
        </p>

        {lockMessage && (
          <p className={styles.monitorMessage}>{lockMessage}</p>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.monitorHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Alert Review</h3>
            <p className={styles.monitorNote}>
              Review the most recent abnormal detections raised by the detector during tours.
            </p>
          </div>

          <span
            className={styles.monitorBadge}
            data-state={status.running ? 'running' : 'stopped'}
          >
            {status.running ? 'Detector Running' : 'Detector Stopped'}
          </span>
        </div>

        {statusError && (
          <p className={styles.monitorError}>{statusError}</p>
        )}

        {alertIncidents.length === 0 ? (
          <p className={styles.monitorNote}>No alert incidents have been recorded yet.</p>
        ) : (
          <div className={styles.monitorList}>
            {alertIncidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className={styles.monitorListItem}>
                <div>
                  <strong>{incident.type || 'Unknown activity'}</strong>
                  <div className={styles.monitorListMeta}>
                    {formatConfidence(incident.confidence)} confidence · {formatTimestamp(incident.timestamp)}
                  </div>
                </div>
                <span className={styles.monitorEvidenceTag}>
                  {getFileName(incident.snapshot)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Evidence Review</h3>
        <p className={styles.monitorNote}>
          Stored snapshots, clips, and hashes can be checked here for reporting and investigation.
        </p>

        {incidents.length === 0 ? (
          <p className={styles.monitorNote}>No stored evidence yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Snapshot</th>
                  <th>Video</th>
                  <th>Hash</th>
                  <th>Captured</th>
                </tr>
              </thead>

              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>{incident.type || 'Unknown'}</td>
                    <td>{getFileName(incident.snapshot)}</td>
                    <td>
                        {incident.snapshot ? (
                          <a
                            href={`http://localhost:3000/${incident.snapshot.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Snapshot
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                    <td>{shortHash(incident.snapshot_hash)}</td>
                    <td>{formatTimestamp(incident.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatConfidence(value) {
  if (typeof value !== 'number') {
    return '-'
  }

  return `${Math.round(value * 100)}%`
}

function formatTimestamp(timestamp) {
  if (!timestamp?.toDate) {
    return 'Pending'
  }

  return timestamp.toDate().toLocaleString()
}

function getFileName(filePath) {
  if (!filePath || filePath === 'Not recording yet') {
    return filePath || '-'
  }

  return String(filePath).split(/[\\/]/).pop()
}

function shortHash(value) {
  if (!value) {
    return '-'
  }

  return `${String(value).slice(0, 10)}...`
}

export default AdminMonitoringPanel
