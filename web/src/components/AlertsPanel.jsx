import React, { useEffect, useRef, useState } from 'react'
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import styles from './Dashboard.module.css'

const ALERT_CLASSES = ['plant_picking', 'cuttingtrees', 'animaltrap', 'netgun', 'touching_animal']

const VIOLATION_LABELS = {
  plant_picking:   'Plant Picking',
  cuttingtrees:    'Cutting Trees',
  animaltrap:      'Animal Trap',
  netgun:          'Net Gun',
  touching_animal: 'Touching Animal',
}

const VIOLATION_ICONS = {
  plant_picking:   '🌿',
  cuttingtrees:    '🪓',
  animaltrap:      '🪤',
  netgun:          '🔫',
  touching_animal: '🐾',
}

function getSeverity(confidence) {
  if (confidence >= 0.80) return 'HIGH'
  if (confidence >= 0.60) return 'MEDIUM'
  return 'LOW'
}

function formatTimestamp(ts) {
  if (!ts?.toDate) return 'Pending'
  return ts.toDate().toLocaleString()
}

function isToday(ts) {
  if (!ts?.toDate) return false
  const d = ts.toDate()
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  )
}

export default function AlertsPanel() {
  const [alerts, setAlerts]     = useState([])
  const [filter, setFilter]     = useState('unresolved')
  const [markingId, setMarkingId] = useState(null)
  const [error, setError]       = useState('')

  useEffect(() => {
    // Simple query — no orderBy so no composite index needed.
    // We sort client-side after filtering.
    const q = query(
      collection(db, 'incidents'),
      where('type', 'in', ALERT_CLASSES)
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const tA = a.timestamp?.toDate?.()?.getTime() ?? 0
            const tB = b.timestamp?.toDate?.()?.getTime() ?? 0
            return tB - tA // newest first
          })
        setAlerts(docs)
        setError('')
      },
      (err) => {
        console.error('AlertsPanel listener error:', err)
        setError('Unable to load alerts. Please check Firestore rules.')
      }
    )

    return () => unsub()
  }, [])

  const markReviewed = async (id) => {
    setMarkingId(id)
    try {
      await updateDoc(doc(db, 'incidents', id), { reviewed: true })
    } catch (err) {
      console.error('Mark reviewed error:', err)
    } finally {
      setMarkingId(null)
    }
  }

  const unresolved  = alerts.filter((a) => !a.reviewed)
  const todayAlerts = alerts.filter((a) => isToday(a.timestamp))

  const displayed = alerts.filter((a) => {
    if (filter === 'unresolved') return !a.reviewed
    if (filter === 'reviewed')   return Boolean(a.reviewed)
    return true
  })

  return (
    <div>
      <h2 style={{ marginBottom: 6, color: '#1a3d3a' }}>Violation Alerts</h2>
      <p style={{ color: '#5f6c67', marginBottom: 24 }}>
        Real-time alerts from the AI monitoring system. Mark each alert as reviewed after taking action.
      </p>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ '--accent': '#e63946' }}>
          <div className={styles.statIcon}>🚨</div>
          <div className={styles.statValue}>{unresolved.length}</div>
          <div className={styles.statLabel}>Unresolved Alerts</div>
          <div className={styles.statTrend}>Require admin attention</div>
        </div>

        <div className={styles.statCard} style={{ '--accent': '#f4a261' }}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statValue}>{todayAlerts.length}</div>
          <div className={styles.statLabel}>Today's Violations</div>
          <div className={styles.statTrend}>Detections in the last 24 h</div>
        </div>

        <div className={styles.statCard} style={{ '--accent': '#2d6a4f' }}>
          <div className={styles.statIcon}>📋</div>
          <div className={styles.statValue}>{alerts.length}</div>
          <div className={styles.statLabel}>Total Violations</div>
          <div className={styles.statTrend}>All time detections</div>
        </div>
      </div>

      {error && <p className={styles.monitorError}>{error}</p>}

      {/* Filter tabs */}
      <div className={styles.section}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { key: 'unresolved', label: `Unresolved (${unresolved.length})` },
            { key: 'all',        label: `All (${alerts.length})` },
            { key: 'reviewed',   label: `Reviewed (${alerts.length - unresolved.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={filter === key ? styles.primaryBtn : styles.secondaryBtn}
              onClick={() => setFilter(key)}
              style={{ padding: '7px 18px' }}
            >
              {label}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>{filter === 'reviewed' ? '✅' : '📡'}</div>
            <h3>{filter === 'reviewed' ? 'No reviewed alerts' : 'No active violations'}</h3>
            <p>
              {filter === 'reviewed'
                ? 'No alerts have been marked as reviewed yet.'
                : 'The AI monitoring system has not detected any violations yet.'}
            </p>
          </div>
        ) : (
          <div className={styles.monitorList}>
            {displayed.map((alert) => {
              const severity = getSeverity(alert.confidence ?? 0)
              const label    = VIOLATION_LABELS[alert.type] ?? alert.type
              const icon     = VIOLATION_ICONS[alert.type] ?? '⚠️'

              const severityColor =
                severity === 'HIGH'   ? '#e63946' :
                severity === 'MEDIUM' ? '#f4a261' : '#e9c46a'

              const severityBg =
                severity === 'HIGH'   ? '#ffe0e6' :
                severity === 'MEDIUM' ? '#fff3e0' : '#fff9e6'

              const severityText =
                severity === 'HIGH'   ? '#d32f2f' :
                severity === 'MEDIUM' ? '#e65100' : '#b8a000'

              return (
                  <div
                    key={alert.id}
                    className={styles.monitorListItem}
                    style={{
                      borderLeft: `4px solid ${severityColor}`,
                      opacity: alert.reviewed ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                      display: 'flex',          // ← add
                      flexDirection: 'row',     // ← add
                      alignItems: 'center',     // ← add
                      gap: '12px',              // ← add
                    }}
                  >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: '1.15rem' }}>{icon}</span>
                      <strong style={{ color: '#1a3d3a', fontSize: '0.95rem' }}>{label}</strong>

                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: severityBg,
                        color: severityText,
                        letterSpacing: '0.5px',
                      }}>
                        {severity}
                      </span>

                      {alert.reviewed && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: '#e8f5e9',
                          color: '#2e7d32',
                        }}>
                          REVIEWED
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className={styles.monitorListMeta}>
                      {Math.round((alert.confidence ?? 0) * 100)}% confidence
                      &nbsp;·&nbsp; Camera 1
                      &nbsp;·&nbsp; {formatTimestamp(alert.timestamp)}
                    </div>

                    {/* Evidence link */}
                    {alert.snapshot && (
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={`http://localhost:3000/${alert.snapshot.replace(/\\/g, '/')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.82rem', color: '#245c9f', textDecoration: 'none' }}
                        >
                          📷 View Evidence Snapshot
                        </a>
                      </div>
                    )}
                  </div>

                  {!alert.reviewed && (
                    <button
                      className={styles.approveBtn} 
                      style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                      disabled={markingId === alert.id}
                      onClick={() => markReviewed(alert.id)}
                    >
                      {markingId === alert.id ? 'Saving…' : '✓ Mark Reviewed'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
