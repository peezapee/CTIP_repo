// src/screens/admin/AdminHomeScreen.js
// Admin overview — shows real stats from Firestore.

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { COLORS, SHADOW } from '../../components/shared'

const ALERTS = [
  { time: '09:12 AM', level: 'HIGH',   msg: 'Possible plant handling detected — Guide #3, Sector B' },
  { time: '08:47 AM', level: 'MEDIUM', msg: 'Wildlife disturbance flagged — near River Trail' },
  { time: 'Yesterday',level: 'LOW',    msg: 'Guide certification expiring — Ahmad Razif' },
]

const ALERT_COLORS = { HIGH: COLORS.danger, MEDIUM: COLORS.warning, LOW: COLORS.greenMid }

export default function AdminHomeScreen({ user }) {
  const [stats, setStats] = useState({ guides: 0, modules: 0, enrollments: 0, passed: 0 })

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      const [guidesSnap, modulesSnap, enrollSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'guide'))),
        getDocs(collection(db, 'trainingModules')),
        getDocs(collection(db, 'enrollments')),
      ])
      const enrollments = enrollSnap.docs.map(d => d.data())
      setStats({
        guides:      guidesSnap.size,
        modules:     modulesSnap.size,
        enrollments: enrollSnap.size,
        passed:      enrollments.filter(e => e.status === 'passed').length,
      })
    } catch (err) { console.error(err) }
  }

  const STAT_CARDS = [
    { label: 'Total Guides',   value: stats.guides,      icon: '👥', accent: COLORS.greenMid },
    { label: 'Modules',        value: stats.modules,     icon: '📚', accent: COLORS.blue },
    { label: 'Enrollments',    value: stats.enrollments, icon: '📋', accent: COLORS.warning },
    { label: 'Certified',      value: stats.passed,      icon: '🎖️', accent: COLORS.gold },
  ]

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Overview</Text>
      <Text style={styles.sub}>Sarawak Forestry Corporation Platform</Text>

      {/* Stat cards — 2 columns */}
      <View style={styles.statsGrid}>
        {STAT_CARDS.map((s, i) => (
          <View key={i} style={[styles.statCard, { borderTopColor: s.accent }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚨 Recent Alerts</Text>
        {ALERTS.map((alert, i) => (
          <View key={i} style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: ALERT_COLORS[alert.level] }]} />
            <View style={styles.alertBody}>
              <Text style={styles.alertMsg}>{alert.msg}</Text>
              <Text style={styles.alertMeta}>{alert.time} · {alert.level}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: COLORS.grayLight },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.greenDark, marginBottom: 4 },
  sub:   { fontSize: 13, color: COLORS.grayMid, marginBottom: 20 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 16,
    width: '47%', borderTopWidth: 4, ...SHADOW,
  },
  statIcon:  { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: '700', color: COLORS.greenDark, marginBottom: 4 },
  statLabel: { fontSize: 11, color: COLORS.grayMid, fontWeight: '600' },

  section: {
    backgroundColor: 'white', borderRadius: 14,
    padding: 18, ...SHADOW,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.greenDark, marginBottom: 14 },

  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  alertDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  alertBody: { flex: 1 },
  alertMsg:  { fontSize: 13, color: COLORS.textDark, fontWeight: '500', marginBottom: 3 },
  alertMeta: { fontSize: 11, color: COLORS.grayMid },
})
