// src/screens/guide/GuideHomeScreen.js
// Park guide's personal overview — shows their progress summary.

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { COLORS, SHADOW } from '../../components/shared'

export default function GuideHomeScreen({ user }) {
  const [enrollments, setEnrollments] = useState([])
  const [modules, setModules]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [enrollSnap, modulesSnap] = await Promise.all([
        getDocs(collection(db, 'enrollments')),
        getDocs(collection(db, 'trainingModules')),
      ])
      const myEnrolls = enrollSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.guideId === user.uid)
      setEnrollments(myEnrolls)
      setModules(modulesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
    setRefreshing(false)
  }

  const passed     = enrollments.filter(e => e.status === 'passed').length
  const total      = modules.length
  const overallPct = total > 0 ? Math.round((passed / total) * 100) : 0

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadData() }}
          tintColor={COLORS.gold}
        />
      }
    >
      {/* Welcome card */}
      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>Hello, {user?.name || 'Park Guide'} 👋</Text>
        <Text style={styles.greetingSub}>Keep up the great work!</Text>

        <Text style={styles.progressLabel}>Overall Training Progress</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${overallPct}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {passed} of {total} modules passed · {overallPct}%
        </Text>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Enrolled',  value: enrollments.length, icon: '📋' },
          { label: 'Passed',    value: passed,              icon: '✅' },
          { label: 'Available', value: total,               icon: '📚' },
        ].map((s, i) => (
          <View key={i} style={styles.miniCard}>
            <Text style={styles.miniIcon}>{s.icon}</Text>
            <Text style={styles.miniValue}>{s.value}</Text>
            <Text style={styles.miniLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent enrollments */}
      {enrollments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {enrollments.slice(0, 4).map((e, i) => {
            const mod = modules.find(m => m.id === e.moduleId)
            return (
              <View key={i} style={styles.activityRow}>
                <Text style={styles.activityModule} numberOfLines={1}>
                  {mod?.title || 'Module'}
                </Text>
                <View style={[styles.statusBadge,
                  { backgroundColor: e.status === 'passed' ? COLORS.greenPale : '#fff7ed' }
                ]}>
                  <Text style={[styles.statusText,
                    { color: e.status === 'passed' ? COLORS.greenMid : '#c2410c' }
                  ]}>
                    {e.status === 'passed' ? '✅ Passed' : e.status}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: COLORS.grayLight },
  container:  { padding: 20, paddingBottom: 40 },

  welcomeCard: {
    backgroundColor: COLORS.greenDark, borderRadius: 18,
    padding: 24, marginBottom: 16,
  },
  greeting:    { fontSize: 20, fontWeight: '700', color: 'white', marginBottom: 4 },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  progressTrack: {
    height: 10, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 5 },
  progressText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  miniCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 12,
    padding: 14, alignItems: 'center', ...SHADOW,
  },
  miniIcon:  { fontSize: 20, marginBottom: 6 },
  miniValue: { fontSize: 22, fontWeight: '700', color: COLORS.greenDark },
  miniLabel: { fontSize: 11, color: COLORS.grayMid, marginTop: 2 },

  section: { backgroundColor: 'white', borderRadius: 14, padding: 18, ...SHADOW },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.greenDark, marginBottom: 14 },

  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight,
  },
  activityModule: { flex: 1, fontSize: 13, color: COLORS.textDark, fontWeight: '500', marginRight: 8 },
  statusBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:     { fontSize: 11, fontWeight: '700' },
})
