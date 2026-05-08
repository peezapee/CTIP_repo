import React, { useCallback, useEffect, useState } from 'react'
import { auth } from '../firebase'
import styles from './Dashboard.module.css'

const API_BASE = 'http://localhost:3000'
const FALLBACK_FEED_URL = 'http://127.0.0.1:5000/video-feed'

function MonitorPanel() {
  const [status, setStatus] = useState({
    running: false,
    feedUrl: FALLBACK_FEED_URL,
    canControl: false,
    isLocked: false,
    role: 'guide',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [adminOnlyMessage, setAdminOnlyMessage] = useState('')
  const [statusError, setStatusError] = useState('')
  const [feedReloadKey, setFeedReloadKey] = useState(0)

  const getToken = useCallback(async () => {
    const user = auth.currentUser

    if (!user) {
      throw new Error('Please log in again to use the monitor.')
    }

    return user.getIdToken()
  }, [])

  const loadStatus = useCallback(async () => {
    try {
      const token = await getToken()
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
        feedUrl: data.feedUrl || FALLBACK_FEED_URL,
        canControl: Boolean(data.canControl),
        isLocked: Boolean(data.isLocked),
        role: data.role || 'guide',
      })
      setStatusError('')
    } catch (error) {
      console.error('Detector status error:', error)
      setStatusError(error.message || 'Unable to connect to the detector server.')
    }
  }, [getToken])

  useEffect(() => {
    loadStatus()

    const id = setInterval(loadStatus, 3000)
    return () => clearInterval(id)
  }, [loadStatus])

  const callDetector = useCallback(async (action) => {
    setLoading(true)

    try {
      const token = await getToken()
      const res = await fetch(`${API_BASE}/detector/${action}`, {
        method: action === 'start' ? 'POST' : 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Unable to ${action} detector.`)
      }

      setMessage(data.message || `Detector ${action}ed.`)
      await loadStatus()
    } catch (error) {
      console.error(`Detector ${action} error:`, error)
      setMessage(error.message || `Unable to ${action} detector.`)
    } finally {
      setLoading(false)

      setTimeout(() => {
        setMessage('')
      }, 3000)
    }
  }, [getToken, loadStatus])

  const isGuide = status.role === 'guide'
  const isLockedForGuide = isGuide && status.isLocked

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Tour Monitoring</h2>
        <p className={styles.pageSub}>
          Start or stop the detector and view the tour camera directly inside the website.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.monitorHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Camera Feed</h3>
            <p className={styles.monitorNote}>
              {status.running
                ? 'The detector is active and streaming the current camera view inside the page.'
                : isLockedForGuide
                  ? 'The detector is offline and the camera is currently locked by admin.'
                  : 'The detector is currently offline. Start monitoring to place the live camera inside this page.'}
            </p>
          </div>

          <span
            className={styles.monitorBadge}
            data-state={status.running ? 'running' : 'stopped'}
          >
            {status.running ? 'Running' : 'Stopped'}
          </span>
        </div>

        {isLockedForGuide && (
          <p className={styles.monitorLockNotice}>
            Admin has locked the camera. You can remain on this page and view the feed when it is active, but you cannot start or stop monitoring.
          </p>
        )}

        <div className={styles.monitorFrame}>
          
          {status.running && !isLockedForGuide ? (
            <img
              key={feedReloadKey}
              src={`${status.feedUrl}?feed=${feedReloadKey}`}
              alt="Live detector feed"
              className={styles.monitorImage}
              onLoad={() => setStatusError('')}
              onError={() => {
                setStatusError('The detector is running, but the live camera stream is not available yet. Retrying...')

                setTimeout(() => {
                  setFeedReloadKey((current) => current + 1)
                }, 1500)
              }}
            />
          ) : (
            <div className={styles.monitorPlaceholder}>
              Camera feed will appear here when monitoring starts.
            </div>
          )}
        </div>

        {statusError && (
          <p className={styles.monitorError}>{statusError}</p>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Tour Monitoring Status
        </h3>

        <div className={styles.formRow}>
          <button
            className={styles.createBtn}
            disabled={loading || status.running || !status.canControl}
            onClick={() => callDetector('start')}
          >
            {loading && !status.running ? 'Starting...' : 'Start Monitoring'}
          </button>

          <button
            className={styles.deleteBtn}
            disabled={loading || !status.running || !status.canControl}
            onClick={() => callDetector('stop')}
          >
            {loading && status.running ? 'Stopping...' : 'Stop Monitoring'}
          </button>
        </div>

        <p className={styles.monitorNote}>
          {isLockedForGuide
            ? 'The camera is locked by admin, so your controls are disabled until it is unlocked.'
            : status.canControl
              ? 'Use these controls to begin or end the guided-tour monitoring session from the website.'
              : 'You do not currently have permission to control monitoring. Please log in again or check your account role.'}
        </p>

        {message && (
          <p className={styles.monitorMessage}>{message}</p>
        )}
        
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Restricted Administrative Features
          </h3>

          <p className={styles.monitorNote}>
            These features exist in the system but require administrator privileges.
          </p>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Status</th>
                  <th>Access</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Incident Evidence</td>
                  <td>🔒 Protected</td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      title="Admin only"
                      style={{ cursor: 'not-allowed' }}
                      onClick={() => {
                        setAdminOnlyMessage(
                          'Access Denied — Administrator privileges required.'
                        )

                        setTimeout(() => {
                          setAdminOnlyMessage('')
                        }, 3000)
                      }}
                    >
                        View Evidence
                      </button>
                  </td>
                </tr>

                <tr>
                  <td>Activity Logs</td>
                  <td>🔒 Protected</td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      title="Admin only"
                      style={{ cursor: 'not-allowed' }}
                      onClick={() => {
                        setAdminOnlyMessage(
                          'Access Denied — Administrator privileges required.'
                        )

                        setTimeout(() => {
                          setAdminOnlyMessage('')
                        }, 3000)
                      }}
                    >
                      View Logs
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>User Management</td>
                  <td>🔒 Protected</td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      title="Admin only"
                      style={{ cursor: 'not-allowed' }}
                      onClick={() => {
                        setAdminOnlyMessage(
                          'Access Denied — Administrator privileges required.'
                        )

                        setTimeout(() => {
                          setAdminOnlyMessage('')
                        }, 3000)
                      }}
                    >
                      Manage Users
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {adminOnlyMessage && (
          <p
            className={styles.monitorError}
            style={{ marginTop: '12px' }}
          >
            {adminOnlyMessage}
          </p>
        )}
        </div>
      </div>
    </div>
  )
}

export default MonitorPanel
