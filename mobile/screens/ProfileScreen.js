import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    enrollments: 0,
    completed: 0,
    certificates: 0,
  });

  useEffect(() => {
    if (auth.currentUser) {
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      // Get current user's email
      setUserData({
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName || 'Guide',
        uid: auth.currentUser.uid,
      });

      // Fetch stats
      const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
      const certificatesSnapshot = await getDocs(collection(db, 'certificates'));

      const userEnrollments = enrollmentsSnapshot.docs.filter(
        doc => doc.data().guideId === auth.currentUser.uid
      );
      const userCertificates = certificatesSnapshot.docs.filter(
        doc => doc.data().guideId === auth.currentUser.uid
      );

      const completed = userEnrollments.filter(
        e => e.data().status === 'passed'
      ).length;

      setStats({
        enrollments: userEnrollments.length,
        completed: completed,
        certificates: userCertificates.length,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Profile</Text>
      </View>

      {userData && (
        <>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.name}>{userData.displayName}</Text>
            <Text style={styles.email}>{userData.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Statistics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Enrollments</Text>
                <Text style={styles.statValue}>{stats.enrollments}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{stats.completed}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Certificates</Text>
                <Text style={styles.statValue}>{stats.certificates}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ About</Text>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>
                Welcome to the SFC Park Guide Training App. This application helps you complete training modules and earn certifications.
              </Text>
              <Text style={styles.aboutText}>
                Version 1.0.0
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  aboutCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
});

export default ProfileScreen;
