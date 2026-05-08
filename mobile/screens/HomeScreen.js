import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [modules, setModules] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.currentUser) {
      setUser(auth.currentUser);
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch enrollments for current user
      const enrollmentQuery = query(
        collection(db, 'enrollments'),
        where('guideId', '==', auth.currentUser.uid)
      );
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      const enrollmentList = enrollmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch all modules
      const modulesSnapshot = await getDocs(collection(db, 'trainingModules'));
      const moduleList = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch certificates for current user
      const certQuery = query(
        collection(db, 'certificates'),
        where('guideId', '==', auth.currentUser.uid)
      );
      const certSnapshot = await getDocs(certQuery);
      const certList = certSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setEnrollments(enrollmentList);
      setModules(moduleList);
      setCertificates(certList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const calculateStats = () => {
    const completed = enrollments.filter(e => e.status === 'passed').length;
    const total = enrollments.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const validCerts = certificates.filter(cert => {
      const expiry = new Date(cert.expiresAt);
      return expiry > new Date();
    }).length;

    const expiredCerts = certificates.length - validCerts;

    return { completed, total, progress, validCerts, expiredCerts };
  };

  const renderEnrolledModule = ({ item }) => {
    const module = modules.find(m => m.id === item.moduleId);
    if (!module) return null;

    return (
      <View style={styles.enrolledCard}>
        <View style={styles.enrolledHeader}>
          <Text style={styles.enrolledTitle}>{module.title}</Text>
          <Text style={styles.enrolledStatus}>
            {item.status === 'passed' ? '✅' : item.status === 'failed' ? '❌' : '⏳'}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress || 0}%` }]} />
        </View>
        <Text style={styles.progressText}>{item.progress || 0}% Complete</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  const stats = calculateStats();
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Guide';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Welcome back, {firstName}! 👋</Text>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercent}>{stats.progress}%</Text>
          <Text style={styles.progressLabel}>Overall Progress</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Modules Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📜</Text>
          <Text style={styles.statValue}>{stats.validCerts}</Text>
          <Text style={styles.statLabel}>Valid Certs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⏰</Text>
          <Text style={styles.statValue}>{stats.expiredCerts}</Text>
          <Text style={styles.statLabel}>Expired Certs</Text>
        </View>
      </View>

      {/* Enrolled Modules */}
      {enrollments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Your Modules</Text>
          {enrollments.slice(0, 3).map((enrollment) => (
            <View key={enrollment.id}>
              {renderEnrolledModule({ item: enrollment })}
            </View>
          ))}
          {enrollments.length > 3 && (
            <Text style={styles.seeMore}>And {enrollments.length - 3} more...</Text>
          )}
        </View>
      )}

      {/* Next Steps */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate('Training')}
        >
          <Text style={styles.nextButtonText}>Start Next Module →</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Training')}
        >
          <Text style={styles.actionEmoji}>📖</Text>
          <Text style={styles.actionLabel}>Browse Modules</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Certificates')}
        >
          <Text style={styles.actionEmoji}>📜</Text>
          <Text style={styles.actionLabel}>My Certificates</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionEmoji}>👤</Text>
          <Text style={styles.actionLabel}>My Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Logout</Text>
      </TouchableOpacity>

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
  banner: {
    backgroundColor: '#2d6a4f',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  progressLabel: {
    fontSize: 12,
    color: '#e8f5e9',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
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
  enrolledCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2d6a4f',
  },
  enrolledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  enrolledTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  enrolledStatus: {
    fontSize: 18,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#06a77d',
  },
  progressText: {
    fontSize: 11,
    color: '#999',
  },
  seeMore: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  nextButton: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#e63946',
    margin: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
