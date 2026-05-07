// src/screens/admin/AdminProgressScreen.js
// Admin tracks all guide progress — mirrors the web ProgressTracking component.
// Uses the same Firestore collections: users, enrollments, trainingModules.

import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { COLORS, SHADOW } from '../../components/shared'

export default function AdminProgressScreen() {
  const [guides, setGuides]           = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [modules, setModules]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [expandedGuide, setExpandedGuide] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [usersSnap, enrollSnap, modulesSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'guide'))),
        getDocs(collection(db, 'enrollments')),
        getDocs(collection(db, 'trainingModules')),
      ])
      setGuides(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() })))
      setEnrollments(enrollSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setModules(modulesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
    setRefreshing(false)
  }

  const getGuideEnrollments = (uid) => enrollments.filter(e => e.guideId === uid)

  const getAvgProgress = (uid) => {
    const enrols = getGuideEnrollments(uid)
    if (!enrols.length) return 0
    return Math.round(enrols.reduce((s, e) => s + (e.progress || 0), 0) / enrols.length)
  }

  const getModuleName = (moduleId) =>
    modules.find(m => m.id === moduleId)?.title || 'Unknown Module'

  const STATUS_COLORS = {
    passed:      COLORS.greenMid,
    completed:   COLORS.greenLight,
    'in-progress': COLORS.blue,
    failed:      COLORS.danger,
    enrolled:    COLORS.grayMid,
  }

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.greenMid} />
      <Text style={styles.loadingText}>Loading progress data...</Text>
    </View>
  )

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadData() }}
          tintColor={COLORS.greenMid}
        />
      }
    >
      <Text style={styles.title}>📈 Progress Tracking</Text>
      <Text style={styles.sub}>Monitor guide training progress</Text>

      {/* Summary stats */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Guides',      value: guides.length },
          { label: 'Enrollments', value: enrollments.length },
          { label: 'Passed',      value: enrollments.filter(e => e.status === 'passed').length },
        ].map((s, i) => (
          <View key={i} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Guide cards */}
      {guides.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No guides found.</Text>
        </View>
      ) : (
        guides.map(guide => {
          const enrols   = getGuideEnrollments(guide.uid)
          const avgProg  = getAvgProgress(guide.uid)
          const passed   = enrols.filter(e => e.status === 'passed').length
          const isExpanded = expandedGuide === guide.uid

          return (
            <View key={guide.uid} style={styles.guideCard}>
              {/* Guide header */}
              <View style={styles.guideHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(guide.name || guide.email || 'G').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.guideInfo}>
                  <Text style={styles.guideName}>{guide.name || 'Unnamed Guide'}</Text>
                  <Text style={styles.guideEmail}>{guide.email}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressMeta}>
                  <Text style={styles.progressLabel}>{enrols.length} enrolled · {passed} passed</Text>
                  <Text style={styles.progressPct}>{avgProg}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${avgProg}%` }]} />
                </View>
              </View>

              {/* Expand/collapse button */}
              {enrols.length > 0 && (
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => setExpandedGuide(isExpanded ? null : guide.uid)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailsBtnText}>
                    {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Expanded module breakdown */}
              {isExpanded && enrols.map((enrol, i) => (
                <View key={i} style={styles.enrolRow}>
                  <Text style={styles.enrolModule} numberOfLines={1}>
                    {getModuleName(enrol.moduleId)}
                  </Text>
                  <View style={styles.enrolRight}>
                    <View style={[styles.statusDot,
                      { backgroundColor: STATUS_COLORS[enrol.status] || COLORS.grayMid }
                    ]} />
                    <Text style={styles.enrolStatus}>{enrol.status}</Text>
                    {enrol.score != null && (
                      <Text style={styles.enrolScore}>{enrol.score}%</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll:      { flex: 1, backgroundColor: COLORS.grayLight },
  container:   { padding: 20, paddingBottom: 40 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.grayLight },
  loadingText: { marginTop: 12, color: COLORS.grayMid },

  title: { fontSize: 22, fontWeight: '700', color: COLORS.greenDark, marginBottom: 4 },
  sub:   { fontSize: 13, color: COLORS.grayMid, marginBottom: 20 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 12,
    padding: 14, alignItems: 'center', ...SHADOW,
  },
  summaryValue: { fontSize: 22, fontWeight: '700', color: COLORS.greenDark },
  summaryLabel: { fontSize: 11, color: COLORS.grayMid, marginTop: 2 },

  empty:     { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.grayMid },

  guideCard: {
    backgroundColor: 'white', borderRadius: 16,
    padding: 18, marginBottom: 14, ...SHADOW,
  },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.greenPale,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.greenMid },
  guideInfo:  { flex: 1 },
  guideName:  { fontSize: 15, fontWeight: '700', color: COLORS.greenDark },
  guideEmail: { fontSize: 12, color: COLORS.grayMid, marginTop: 2 },

  progressSection: { marginBottom: 12 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:{ fontSize: 12, color: COLORS.grayMid },
  progressPct:  { fontSize: 12, fontWeight: '700', color: COLORS.greenMid },
  progressTrack:{ height: 8, backgroundColor: COLORS.greenPale, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.greenLight, borderRadius: 4 },

  detailsBtn: {
    backgroundColor: COLORS.grayLight, borderRadius: 8,
    padding: 8, alignItems: 'center', marginBottom: 4,
  },
  detailsBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.greenMid },

  enrolRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 4,
    borderTopWidth: 1, borderTopColor: COLORS.grayLight,
  },
  enrolModule: { flex: 1, fontSize: 13, color: COLORS.textDark, fontWeight: '500' },
  enrolRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  enrolStatus: { fontSize: 11, color: COLORS.grayMid, fontWeight: '600' },
  enrolScore:  { fontSize: 11, color: COLORS.greenMid, fontWeight: '700' },
})
