import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    modules: 0,
    guides: 0,
    certificates: 0,
    enrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch modules count
      const modulesSnapshot = await getDocs(collection(db, 'trainingModules'));
      const modulesCount = modulesSnapshot.docs.length;

      // Fetch guides count
      const guidesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'guide')
      );
      const guidesSnapshot = await getDocs(guidesQuery);
      const guidesCount = guidesSnapshot.docs.length;

      // Fetch enrollments count
      const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
      const enrollmentsCount = enrollmentsSnapshot.docs.length;

      // Fetch certificates count
      const certificatesSnapshot = await getDocs(collection(db, 'certificates'));
      const certificatesCount = certificatesSnapshot.docs.length;

      setStats({
        modules: modulesCount,
        guides: guidesCount,
        certificates: certificatesCount,
        enrollments: enrollmentsCount,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>System Overview</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📚</Text>
          <Text style={styles.statNumber}>{stats.modules}</Text>
          <Text style={styles.statLabel}>Modules</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={styles.statNumber}>{stats.guides}</Text>
          <Text style={styles.statLabel}>Guides</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📜</Text>
          <Text style={styles.statNumber}>{stats.certificates}</Text>
          <Text style={styles.statLabel}>Certificates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>✏️</Text>
          <Text style={styles.statNumber}>{stats.enrollments}</Text>
          <Text style={styles.statLabel}>Enrollments</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Quick Actions</Text>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Modules')}
        >
          <Text style={styles.actionEmoji}>📚</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Create Module</Text>
            <Text style={styles.actionSubtitle}>Add new training module</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Users')}
        >
          <Text style={styles.actionEmoji}>👥</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Guides</Text>
            <Text style={styles.actionSubtitle}>View guide progress</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Modules')}
        >
          <Text style={styles.actionEmoji}>✏️</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Edit Modules</Text>
            <Text style={styles.actionSubtitle}>Modify existing modules</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Users')}
        >
          <Text style={styles.actionEmoji}>📊</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Progress</Text>
            <Text style={styles.actionSubtitle}>Track guide performance</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ System Information</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Training Hours:</Text>
            <Text style={styles.infoValue}>{(stats.modules * 2).toString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Avg Guides per Module:</Text>
            <Text style={styles.infoValue}>
              {stats.modules > 0 ? (stats.enrollments / stats.modules).toFixed(1) : 0}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Certification Rate:</Text>
            <Text style={styles.infoValue}>
              {stats.enrollments > 0 ? ((stats.certificates / stats.enrollments) * 100).toFixed(0) : 0}%
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1565c0',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b3e5fc',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565c0',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 16,
    color: '#999',
  },
  infoBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1565c0',
  },
});

export default AdminDashboard;
