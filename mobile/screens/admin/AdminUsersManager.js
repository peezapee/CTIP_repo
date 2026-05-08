import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Modal, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminUsersManager = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [guideStats, setGuideStats] = useState({
    enrolled: 0,
    completed: 0,
    certificates: 0,
    progress: 0,
  });

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      // Fetch all guides
      const guidesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'guide')
      );
      const guidesSnapshot = await getDocs(guidesQuery);
      const guidesList = guidesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setGuides(guidesList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching guides:', error);
      setLoading(false);
    }
  };

  const fetchGuideDetails = async (guideId) => {
    try {
      // Fetch enrollments for this guide
      const enrollmentQuery = query(
        collection(db, 'enrollments'),
        where('guideId', '==', guideId)
      );
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      const enrollmentList = enrollmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch certificates for this guide
      const certQuery = query(
        collection(db, 'certificates'),
        where('guideId', '==', guideId)
      );
      const certSnapshot = await getDocs(certQuery);
      const certList = certSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const completed = enrollmentList.filter(e => e.status === 'passed').length;
      const progress = enrollmentList.length > 0 
        ? Math.round((completed / enrollmentList.length) * 100) 
        : 0;

      setGuideStats({
        enrolled: enrollmentList.length,
        completed,
        certificates: certList.length,
        progress,
      });
    } catch (error) {
      console.error('Error fetching guide details:', error);
    }
  };

  const handleSelectGuide = (guide) => {
    setSelectedGuide(guide);
    fetchGuideDetails(guide.id);
    setShowDetailModal(true);
  };

  const renderGuide = ({ item }) => (
    <TouchableOpacity 
      style={styles.guideCard}
      onPress={() => handleSelectGuide(item)}
    >
      <View style={styles.guideHeader}>
        <View style={styles.guideInfo}>
          <Text style={styles.guideName}>{item.name || item.email}</Text>
          <Text style={styles.guideEmail}>{item.email}</Text>
        </View>
        <View style={styles.guideBadge}>
          <Text style={styles.guideBadgeText}>👤</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Guides Management</Text>
        <Text style={styles.headerSubtitle}>{guides.length} guides registered</Text>
      </View>

      {guides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No guides registered yet</Text>
        </View>
      ) : (
        <FlatList
          data={guides}
          renderItem={renderGuide}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}

      {/* Guide Details Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Guide Profile
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedGuide && (
              <ScrollView style={styles.detailsContainer}>
                {/* Guide Info */}
                <View style={styles.profileCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>👤</Text>
                  </View>
                  <Text style={styles.profileName}>{selectedGuide.name || selectedGuide.email}</Text>
                  <Text style={styles.profileEmail}>{selectedGuide.email}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>🎓 Guide</Text>
                  </View>
                </View>

                {/* Stats */}
                <Text style={styles.sectionTitle}>📊 Progress Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statEmoji}>📚</Text>
                    <Text style={styles.statNumber}>{guideStats.enrolled}</Text>
                    <Text style={styles.statLabel}>Enrolled</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statEmoji}>✅</Text>
                    <Text style={styles.statNumber}>{guideStats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statEmoji}>📜</Text>
                    <Text style={styles.statNumber}>{guideStats.certificates}</Text>
                    <Text style={styles.statLabel}>Certificates</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statEmoji}>📈</Text>
                    <Text style={styles.statNumber}>{guideStats.progress}%</Text>
                    <Text style={styles.statLabel}>Progress</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${guideStats.progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {guideStats.completed} of {guideStats.enrolled} modules completed
                  </Text>
                </View>

                {/* Details */}
                <Text style={styles.sectionTitle}>ℹ️ Details</Text>
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Status:</Text>
                    <Text style={styles.detailValue}>✅ Active</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Completion Rate:</Text>
                    <Text style={styles.detailValue}>
                      {guideStats.enrolled > 0 
                        ? ((guideStats.completed / guideStats.enrolled) * 100).toFixed(0) 
                        : 0}%
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Certification Rate:</Text>
                    <Text style={styles.detailValue}>
                      {guideStats.completed > 0 
                        ? ((guideStats.certificates / guideStats.completed) * 100).toFixed(0) 
                        : 0}%
                    </Text>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
  listContent: {
    padding: 12,
  },
  guideCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideInfo: {
    flex: 1,
  },
  guideName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  guideEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  guideBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBadgeText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  detailsContainer: {
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565c0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565c0',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1565c0',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  detailsBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1565c0',
  },
});

export default AdminUsersManager;
