import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AdminProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState({
    email: '',
    name: '',
  });

  useEffect(() => {
    if (auth.currentUser) {
      fetchAdminData();
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      const adminDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (adminDoc.exists()) {
        setAdminData({
          email: auth.currentUser.email,
          name: adminDoc.data().name || 'Administrator',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
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
        <Text style={styles.headerTitle}>⚙️ Admin Settings</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🔑</Text>
        </View>
        <Text style={styles.adminName}>{adminData.name}</Text>
        <Text style={styles.adminEmail}>{adminData.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>👨‍💼 Administrator</Text>
        </View>
      </View>

      {/* System Access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 System Access</Text>
        
        <View style={styles.accessCard}>
          <Text style={styles.accessTitle}>Dashboard</Text>
          <Text style={styles.accessDesc}>View system statistics and overview</Text>
          <Text style={styles.accessIcon}>✅ Enabled</Text>
        </View>

        <View style={styles.accessCard}>
          <Text style={styles.accessTitle}>Module Management</Text>
          <Text style={styles.accessDesc}>Create, edit, and delete training modules</Text>
          <Text style={styles.accessIcon}>✅ Enabled</Text>
        </View>

        <View style={styles.accessCard}>
          <Text style={styles.accessTitle}>User Management</Text>
          <Text style={styles.accessDesc}>View and manage guide accounts and progress</Text>
          <Text style={styles.accessIcon}>✅ Enabled</Text>
        </View>

        <View style={styles.accessCard}>
          <Text style={styles.accessTitle}>Certificate Management</Text>
          <Text style={styles.accessDesc}>Manage issued certificates and validations</Text>
          <Text style={styles.accessIcon}>✅ Enabled</Text>
        </View>
      </View>

      {/* Admin Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Admin Features</Text>
        
        <View style={styles.featureRow}>
          <Text style={styles.featureName}>📊 Real-time Analytics</Text>
          <Text style={styles.featureStatus}>Active</Text>
        </View>

        <View style={styles.featureRow}>
          <Text style={styles.featureName}>👥 Bulk User Management</Text>
          <Text style={styles.featureStatus}>Available</Text>
        </View>

        <View style={styles.featureRow}>
          <Text style={styles.featureName}>📧 Email Notifications</Text>
          <Text style={styles.featureStatus}>Available</Text>
        </View>

        <View style={styles.featureRow}>
          <Text style={styles.featureName}>📋 Audit Logs</Text>
          <Text style={styles.featureStatus}>Available</Text>
        </View>
      </View>

      {/* System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ System Information</Text>
        
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>Digital Park Guide</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Environment:</Text>
            <Text style={styles.infoValue}>Production</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database:</Text>
            <Text style={styles.infoValue}>Firestore</Text>
          </View>
        </View>
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
  profileCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
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
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  adminEmail: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565c0',
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
  accessCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1565c0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  accessTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  accessDesc: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  accessIcon: {
    fontSize: 12,
    color: '#06a77d',
    marginTop: 6,
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  featureName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  featureStatus: {
    fontSize: 11,
    color: '#06a77d',
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#1565c0',
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
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdminProfileScreen;
