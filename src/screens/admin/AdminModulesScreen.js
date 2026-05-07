// src/screens/admin/AdminModulesScreen.js
// Admin views all training modules from Firestore.
// Note: Creating/editing modules is done on the web app (better for forms with long content).
// Mobile shows the list and lets admin delete modules.

import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl
} from 'react-native'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { COLORS, CATEGORY, SHADOW } from '../../components/shared'

export default function AdminModulesScreen() {
  const [modules, setModules]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadModules() }, [])

  const loadModules = async () => {
    try {
      const snap = await getDocs(collection(db, 'trainingModules'))
      setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
    setRefreshing(false)
  }

  const handleDelete = (id, title) => {
    Alert.alert(
      'Delete Module',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'trainingModules', id))
              setModules(modules.filter(m => m.id !== id))
            } catch (err) {
              Alert.alert('Error', 'Failed to delete module.')
            }
          }
        }
      ]
    )
  }

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.greenMid} />
      <Text style={styles.loadingText}>Loading modules...</Text>
    </View>
  )

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadModules() }}
          tintColor={COLORS.greenMid}
        />
      }
    >
      <Text style={styles.title}>📚 Training Modules</Text>
      <Text style={styles.sub}>
        {modules.length} modules · Pull down to refresh · Create new modules on the web app
      </Text>

      {modules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No modules yet. Create one from the web app.</Text>
        </View>
      ) : (
        modules.map(mod => {
          const cat = CATEGORY[mod.category] || { emoji: '📖', color: COLORS.greenMid }
          return (
            <View key={mod.id} style={styles.moduleCard}>
              {/* Header row */}
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleEmoji}>{cat.emoji}</Text>
                <View style={styles.moduleHeaderText}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <View style={[styles.catBadge, { backgroundColor: cat.color + '22' }]}>
                    <Text style={[styles.catText, { color: cat.color }]}>{mod.category}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.moduleDesc}>{mod.description}</Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <Text style={styles.stat}>⏱️ {mod.duration} min</Text>
                <Text style={styles.stat}>📊 Pass: {mod.passingScore}%</Text>
                {mod.videoUrl ? <Text style={styles.stat}>🎥 Video</Text> : null}
              </View>

              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(mod.id, mod.title)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteBtnText}>🗑️ Delete Module</Text>
              </TouchableOpacity>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: COLORS.grayLight },
  container:  { padding: 20, paddingBottom: 40 },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.grayLight },
  loadingText:{ marginTop: 12, color: COLORS.grayMid },

  title: { fontSize: 22, fontWeight: '700', color: COLORS.greenDark, marginBottom: 4 },
  sub:   { fontSize: 12, color: COLORS.grayMid, marginBottom: 20, lineHeight: 18 },

  empty:     { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.grayMid, textAlign: 'center' },

  moduleCard: {
    backgroundColor: 'white', borderRadius: 16,
    padding: 18, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: COLORS.greenLight,
    ...SHADOW,
  },
  moduleHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  moduleEmoji:      { fontSize: 26, marginTop: 2 },
  moduleHeaderText: { flex: 1 },
  moduleTitle:      { fontSize: 15, fontWeight: '700', color: COLORS.greenDark, marginBottom: 6 },
  catBadge:         { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  catText:          { fontSize: 11, fontWeight: '700' },
  moduleDesc:       { fontSize: 13, color: COLORS.grayMid, lineHeight: 19, marginBottom: 12 },

  statsRow:  { flexDirection: 'row', gap: 14, marginBottom: 14, flexWrap: 'wrap' },
  stat:      { fontSize: 12, color: COLORS.grayMid, fontWeight: '500' },

  deleteBtn: {
    backgroundColor: '#fee2e2', borderRadius: 8,
    padding: 10, alignItems: 'center',
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 13, fontWeight: '700' },
})
