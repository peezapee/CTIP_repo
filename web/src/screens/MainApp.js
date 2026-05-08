// src/screens/MainApp.js
// Main app after login. Uses bottom tabs.
// Admin sees: Home, Modules, Progress, Settings
// Guide sees: Home, My Courses, Certificates

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

// Admin screens
import AdminHomeScreen     from './admin/AdminHomeScreen'
import AdminModulesScreen  from './admin/AdminModulesScreen'
import AdminProgressScreen from './admin/AdminProgressScreen'

// Guide screens
import GuideHomeScreen       from './guide/GuideHomeScreen'
import GuideCoursesScreen    from './guide/GuideCoursesScreen'
import GuideCertificatesScreen from './guide/GuideCertificatesScreen'

import { COLORS } from '../components/shared'

const Tab = createBottomTabNavigator()

export default function MainApp({ user, onLogout }) {
  const isAdmin = user?.role === 'admin'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.greenDark} />

      {/* Top header bar */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarTitle}>🌿 SFC Platform</Text>
          <Text style={styles.topbarSub}>
            {isAdmin ? '🛡️ Administrator' : '🌿 Park Guide'} · {user?.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom tab navigation */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor:   COLORS.greenMid,
          tabBarInactiveTintColor: COLORS.grayMid,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: COLORS.greenPale,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 6,
            height: 62,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        {isAdmin ? (
          // ── ADMIN TABS ──
          <>
            <Tab.Screen
              name="Home"
              options={{ tabBarLabel: 'Overview', tabBarIcon: () => <Text style={styles.tabIcon}>📊</Text> }}
            >
              {() => <AdminHomeScreen user={user} />}
            </Tab.Screen>

            <Tab.Screen
              name="Modules"
              options={{ tabBarLabel: 'Modules', tabBarIcon: () => <Text style={styles.tabIcon}>📚</Text> }}
            >
              {() => <AdminModulesScreen user={user} />}
            </Tab.Screen>

            <Tab.Screen
              name="Progress"
              options={{ tabBarLabel: 'Progress', tabBarIcon: () => <Text style={styles.tabIcon}>📈</Text> }}
            >
              {() => <AdminProgressScreen user={user} />}
            </Tab.Screen>
          </>
        ) : (
          // ── GUIDE TABS ──
          <>
            <Tab.Screen
              name="Home"
              options={{ tabBarLabel: 'Dashboard', tabBarIcon: () => <Text style={styles.tabIcon}>🏠</Text> }}
            >
              {() => <GuideHomeScreen user={user} />}
            </Tab.Screen>

            <Tab.Screen
              name="Courses"
              options={{ tabBarLabel: 'My Courses', tabBarIcon: () => <Text style={styles.tabIcon}>📖</Text> }}
            >
              {() => <GuideCoursesScreen user={user} />}
            </Tab.Screen>

            <Tab.Screen
              name="Certificates"
              options={{ tabBarLabel: 'Certificates', tabBarIcon: () => <Text style={styles.tabIcon}>🎖️</Text> }}
            >
              {() => <GuideCertificatesScreen user={user} />}
            </Tab.Screen>
          </>
        )}
      </Tab.Navigator>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.greenDark },
  topbar: {
    backgroundColor: COLORS.greenDark,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  topbarSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  logoutText: { color: 'white', fontSize: 12, fontWeight: '600' },
  tabIcon: { fontSize: 18 },
})
