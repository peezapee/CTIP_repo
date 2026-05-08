import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';

const CertificateScreen = () => {
  const [certificates, setCertificates] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.currentUser) {
      fetchCertificatesAndModules();
    }
  }, []);

  const fetchCertificatesAndModules = async () => {
    try {
      // Fetch certificates for current user
      const q = query(
        collection(db, 'certificates'),
        where('guideId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const certList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch all modules to get names
      const modulesSnapshot = await getDocs(collection(db, 'trainingModules'));
      const moduleList = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCertificates(certList);
      setModules(moduleList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getModuleName = (moduleId) => {
    return modules.find(m => m.id === moduleId)?.title || 'Unknown Module';
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCertificate = ({ item }) => {
    const expired = isExpired(item.expiresAt);
    const moduleName = getModuleName(item.moduleId);

    return (
      <View style={[styles.certCard, expired && styles.expiredCard]}>
        <View style={styles.certHeader}>
          <View style={styles.certInfo}>
            <Text style={styles.certTitle}>{moduleName}</Text>
            <Text style={styles.certNumber}>Cert #{item.certificateNumber}</Text>
          </View>
          <Text style={styles.statusBadge}>
            {expired ? '⏰ Expired' : '✅ Valid'}
          </Text>
        </View>

        <View style={styles.certDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📝 Title:</Text>
            <Text style={styles.detailValue}>{item.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📊 Score:</Text>
            <Text style={styles.detailValue}>{item.score}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Issued:</Text>
            <Text style={styles.detailValue}>{formatDate(item.issuedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏳ Expires:</Text>
            <Text style={[styles.detailValue, expired && { color: '#e63946' }]}>
              {formatDate(item.expiresAt)}
            </Text>
          </View>
        </View>
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

  const validCerts = certificates.filter(c => !isExpired(c.expiresAt));
  const expiredCerts = certificates.filter(c => isExpired(c.expiresAt));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Certificates</Text>
        <Text style={styles.headerSubtitle}>
          {validCerts.length} valid, {expiredCerts.length} expired
        </Text>
      </View>

      {certificates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📜</Text>
          <Text style={styles.emptyTitle}>No Certificates Yet</Text>
          <Text style={styles.emptyText}>Complete training modules to earn certificates!</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {validCerts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>✅ Active Certificates</Text>
              {validCerts.map(cert => (
                <View key={cert.id}>
                  {renderCertificate({ item: cert })}
                </View>
              ))}
            </>
          )}

          {expiredCerts.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, styles.expiredSection]}>⏰ Expired Certificates</Text>
              {expiredCerts.map(cert => (
                <View key={cert.id}>
                  {renderCertificate({ item: cert })}
                </View>
              ))}
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
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
    backgroundColor: '#2d6a4f',
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
    color: '#e8f5e9',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  expiredSection: {
    marginTop: 24,
  },
  certCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#06a77d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expiredCard: {
    borderLeftColor: '#e63946',
    opacity: 0.7,
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  certInfo: {
    flex: 1,
  },
  certTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  certNumber: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  certDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default CertificateScreen;
