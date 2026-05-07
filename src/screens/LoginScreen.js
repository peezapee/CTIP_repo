// src/screens/LoginScreen.js
// Login screen — uses Firebase Auth exactly like the web version.

import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, StatusBar
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import { COLORS } from '../components/shared'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user data from Firestore (same as web)
      const docRef  = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const userData = docSnap.data()
        onLogin({ uid: user.uid, email: user.email, name: userData.name, role: userData.role })
      } else {
        setError('User data not found.')
      }
    } catch (err) {
      setError('Invalid email or password.')
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Green top header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🌿</Text>
            <Text style={styles.appName}>SFC Park Guide</Text>
            <Text style={styles.appSub}>Digital Training Platform</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Sarawak Forestry Corporation</Text>
            </View>
          </View>

          {/* White login card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your account to continue</Text>

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="yourname@sfc.gov.my"
              placeholderTextColor={COLORS.grayMid}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.grayMid}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.loginBtnText}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.greenDark },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: COLORS.greenDark,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logo:    { fontSize: 60, marginBottom: 12 },
  appName: { fontSize: 26, fontWeight: '700', color: 'white', marginBottom: 6 },
  appSub:  { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 20, textAlign: 'center' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '600' },

  card: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingTop: 36,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.greenDark, marginBottom: 6 },
  cardSub:   { fontSize: 14, color: COLORS.grayMid, marginBottom: 28 },

  label: { fontSize: 13, fontWeight: '600', color: COLORS.greenDark, marginBottom: 8 },
  input: {
    borderWidth: 2,
    borderColor: COLORS.greenPale,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: 'white',
    marginBottom: 18,
  },

  errorBox: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: COLORS.danger, fontSize: 13 },

  loginBtn: {
    backgroundColor: COLORS.greenMid,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
})
