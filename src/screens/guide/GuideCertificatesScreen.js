// src/screens/guide/GuideCertificatesScreen.js
// Shows all passed enrollments as certificates for the guide.
// Uses the enrollments collection — status === 'passed' = certificate earned.

import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { COLORS, CATEGORY, SHADOW } from '../../components/shared'

export default function GuideCertificatesScreen({ user }) {
  const [certs, setCerts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadCerts() }, [])

  const loadCerts = async () => {
    try {
      const [enrollSnap, modulesSnap] = await Promise.all([
        getDocs(collection(db, 'enrollments')),
        getDocs(collection(db, 'trainingModules')),
      ])
      const modules = modulesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      // A certificate = an enrollment with status 'passed'
      const myCerts = enrollSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.guideId === user.uid && e.status === 'passed')
        .map(e => ({
          ...e,
          module: modules.find(m => m.id === e.moduleId)
        }))

      setCerts(myCerts)
    } catch (err) { console.error(err) }
    setLoading(false)
    setRefreshing(false)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.greenMid} />
    </View>
  )

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadCerts() }}
          tintColor={COLORS.greenMid}
        />
      }
    >
      <Text style={styles.title}>🎖️ My Certificates</Text>
      <Text style={styles.sub}>
        {certs.length} certificate{certs.length !== 1 ? 's' : ''} earned
      </Text>

      {certs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎖️</Text>
          <Text style={styles.emptyTitle}>No certificates yet</Text>
          <Text style={styles.emptyText}>
            Complete a training course and pass the quiz to earn your first certificate!
          </Text>
        </View>
      ) : (
        certs.map((cert, i) => {
          const cat = CATEGORY[cert.module?.category] || { emoji: '📖', color: COLORS.greenMid }
          return (
            <View key={cert.id} style={styles.certCard}>
              {/* Gold ribbon */}
              <View style={styles.ribbon}>
                <Text style={styles.ribbonText}>CERTIFIED</Text>
              </View>

              <View style={styles.certTop}>
                <Text style={styles.certEmoji}>{cat.emoji}</Text>
                <View style={styles.certInfo}>
                  <Text style={styles.certTitle}>
                    {cert.module?.title || 'Training Module'}
                  </Text>
                  <View style={[styles.catBadge, { backgroundColor: cat.color + '22' }]}>
                    <Text style={[styles.catText, { color: cat.color }]}>
                      {cert.module?.category || 'training'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.certDetails}>
                <View style={styles.certRow}>
                  <Text style={styles.certRowLabel}>Issued</Text>
                  <Text style={styles.certRowValue}>{formatDate(cert.completedAt)}</Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={styles.certRowLabel}>Score</Text>
                  <Text style={[styles.certRowValue, { color: COLORS.greenMid, fontWeight: '700' }]}>
                    {cert.score}%
                  </Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={styles.certRowLabel}>Duration</Text>
                  <Text style={styles.certRowValue}>{cert.module?.duration || '—'} min</Text>
                </View>
              </View>

              <View style={styles.validTag}>
                <Text style={styles.validText}>✅ Valid Certificate</Text>
              </View>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: COLORS.grayLight },
  container: { padding: 20, paddingBottom: 40 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.grayLight },

  title: { fontSize: 22, fontWeight: '700', color: COLORS.greenDark, marginBottom: 4 },
  sub:   { fontSize: 13, color: COLORS.grayMid, marginBottom: 20 },

  empty:      { alignItems: 'center', padding: 48 },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.greenDark, marginBottom: 8 },
  emptyText:  { color: COLORS.grayMid, textAlign: 'center', lineHeight: 22 },

  certCard: {
    backgroundColor: 'white', borderRadius: 18,
    padding: 20, marginBottom: 16,
    borderTopWidth: 4, borderTopColor: COLORS.gold,
    ...SHADOW, position: 'relative', overflow: 'hidden',
  },
  ribbon: {
    position: 'absolute', top: 16, right: -20,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 28, paddingVertical: 4,
    transform: [{ rotate: '0deg' }],
  },
  ribbonText: { fontSize: 9, fontWeight: '800', color: COLORS.greenDark, letterSpacing: 1.5 },

  certTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  certEmoji:  { fontSize: 32 },
  certInfo:   { flex: 1, paddingRight: 60 },
  certTitle:  { fontSize: 16, fontWeight: '700', color: COLORS.greenDark, marginBottom: 8, lineHeight: 22 },
  catBadge:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  catText:    { fontSize: 11, fontWeight: '700' },

  certDetails:   { borderTopWidth: 1, borderTopColor: COLORS.grayLight, paddingTop: 14, marginBottom: 14 },
  certRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  certRowLabel:  { fontSize: 13, color: COLORS.grayMid },
  certRowValue:  { fontSize: 13, color: COLORS.textDark },

  validTag:  { backgroundColor: COLORS.greenPale, borderRadius: 8, padding: 10, alignItems: 'center' },
  validText: { fontSize: 13, fontWeight: '700', color: COLORS.greenMid },
})
