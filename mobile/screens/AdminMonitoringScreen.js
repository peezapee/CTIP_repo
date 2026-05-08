import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { auth } from '../firebase';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { API_BASE } from '../config/api';

const COLORS = {
  greenDark: '#2d6a4f',
  greenLight: '#40916c',
  blue: '#3a86ff',
  red: '#e63946',
  grayDark: '#333',
  grayMid: '#666',
  grayLight: '#ccc',
  white: '#fff',
  bgLight: '#f5f5f5',
};

export default function AdminMonitoringScreen() {
  const [status, setStatus] = useState({
    running: false,
    canControl: false,
    isLocked: false,
  });
  const [incidents, setIncidents] = useState([]);
  const [statusError, setStatusError] = useState('');
  const [lockMessage, setLockMessage] = useState('');
  const [lockLoading, setLockLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Load detector status
  const loadStatus = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error('Please log in again to review monitoring status.');
      }

      const res = await fetch(`${API_BASE}/detector/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load detector status.');
      }

      setStatus({
        running: Boolean(data.running),
        canControl: Boolean(data.canControl),
        isLocked: Boolean(data.isLocked),
      });
      setStatusError('');
    } catch (error) {
      console.error('Admin monitoring status error:', error);
      setStatusError(error.message || 'Unable to connect to detector server.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, 5000);
    return () => clearInterval(id);
  }, [loadStatus]);

  // Listen to incidents
  useEffect(() => {
    const incidentsQuery = query(
      collection(db, 'incidents'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      incidentsQuery,
      (snapshot) => {
        const nextIncidents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setIncidents(nextIncidents);
      },
      (error) => {
        console.error('Incident monitoring error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter alert incidents
  const alertIncidents = incidents.filter(
    (incident) =>
      [
        'plant_picking',
        'cuttingtrees',
        'animaltrap',
        'netgun',
        'touching_animal',
      ].includes(incident.type)
  );

  // Update lock status
  const updateLock = useCallback(async (action) => {
    setLockLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error('Please log in again to manage camera access.');
      }

      const res = await fetch(`${API_BASE}/detector/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Unable to ${action} camera.`);
      }

      setLockMessage(data.message || 'Camera access updated.');
      await loadStatus();
    } catch (error) {
      console.error(`Camera ${action} error:`, error);
      setLockMessage(error.message || 'Unable to update camera access.');
    } finally {
      setLockLoading(false);

      setTimeout(() => {
        setLockMessage('');
      }, 3000);
    }
  }, [loadStatus]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) {
      return 'Pending';
    }
    return timestamp.toDate().toLocaleString();
  };

  const getFileName = (filePath) => {
    if (!filePath || filePath === 'Not recording yet') {
      return filePath || '-';
    }
    return String(filePath).split(/[\\/]/).pop();
  };

  const shortHash = (value) => {
    if (!value) return '-';
    return `${String(value).slice(0, 10)}...`;
  };

  const formatConfidence = (value) => {
    if (typeof value !== 'number') return '-';
    return `${Math.round(value * 100)}%`;
  };

  if (loadingStatus) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.greenDark} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Monitoring</Text>
        <Text style={styles.headerSubtitle}>
          Review detections and manage guide camera access
        </Text>
      </View>

      {/* Status Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.greenDark }]}>
          <Text style={styles.statIcon}>📡</Text>
          <Text style={styles.statValue}>{status.running ? 'Live' : 'Idle'}</Text>
          <Text style={styles.statLabel}>Tour Monitoring</Text>
          <Text style={styles.statTrend}>
            {status.isLocked ? 'Guide access locked' : 'Guide access available'}
          </Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: COLORS.red }]}>
          <Text style={styles.statIcon}>🚨</Text>
          <Text style={styles.statValue}>{alertIncidents.length}</Text>
          <Text style={styles.statLabel}>Alert Review</Text>
          <Text style={styles.statTrend}>High-confidence recent detections</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: COLORS.blue }]}>
          <Text style={styles.statIcon}>🎥</Text>
          <Text style={styles.statValue}>{incidents.length}</Text>
          <Text style={styles.statLabel}>Evidence Review</Text>
          <Text style={styles.statTrend}>Snapshots and clips ready</Text>
        </View>
      </View>

      {/* Guide Camera Access Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guide Camera Access</Text>
        <Text style={styles.sectionNote}>
          Lock the camera if you want guides to remain on the monitor page without being able to start or stop monitoring.
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.lockButton,
              (lockLoading || status.isLocked) && styles.buttonDisabled,
            ]}
            disabled={lockLoading || status.isLocked}
            onPress={() => updateLock('lock')}
          >
            {lockLoading && !status.isLocked ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>🔒 Lock Camera</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.unlockButton,
              (lockLoading || !status.isLocked) && styles.buttonDisabled,
            ]}
            disabled={lockLoading || !status.isLocked}
            onPress={() => updateLock('unlock')}
          >
            {lockLoading && status.isLocked ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>🔓 Unlock Camera</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionNote}>
          {status.isLocked
            ? 'Guides can still view the monitor page, but their monitoring controls are disabled.'
            : 'Guides currently have access to their monitoring controls.'}
        </Text>

        {lockMessage && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{lockMessage}</Text>
          </View>
        )}
      </View>

      {/* Alert Review Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alert Review</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: status.running ? COLORS.greenLight : '#999' },
            ]}
          >
            <Text style={styles.badgeText}>
              {status.running ? 'Detector Running' : 'Detector Stopped'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionNote}>
          Review the most recent abnormal detections raised by the detector during tours.
        </Text>

        {statusError && (
          <Text style={styles.errorText}>{statusError}</Text>
        )}

        {alertIncidents.length === 0 ? (
          <Text style={styles.sectionNote}>No alert incidents have been recorded yet.</Text>
        ) : (
          <View style={styles.listContainer}>
            {alertIncidents.slice(0, 5).map((incident) => (
              <View key={incident.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>
                    {incident.type || 'Unknown activity'}
                  </Text>
                  <Text style={styles.listItemMeta}>
                    {formatConfidence(incident.confidence)} confidence · {formatTimestamp(incident.timestamp)}
                  </Text>
                </View>
                <Text style={styles.listItemTag}>
                  {getFileName(incident.snapshot)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Evidence Review Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evidence Review</Text>
        <Text style={styles.sectionNote}>
          Stored snapshots, clips, and hashes can be checked here for reporting and investigation.
        </Text>

        {incidents.length === 0 ? (
          <Text style={styles.sectionNote}>No stored evidence yet.</Text>
        ) : (
          <View style={styles.evidenceContainer}>
            {incidents.map((incident) => (
              <View key={incident.id} style={styles.evidenceItem}>
                <View style={styles.evidenceRow}>
                  <Text style={styles.evidenceLabel}>Type:</Text>
                  <Text style={styles.evidenceValue}>{incident.type || 'Unknown'}</Text>
                </View>
                <View style={styles.evidenceRow}>
                  <Text style={styles.evidenceLabel}>Snapshot:</Text>
                  <Text style={styles.evidenceValue}>{getFileName(incident.snapshot)}</Text>
                </View>
                <View style={styles.evidenceRow}>
                  <Text style={styles.evidenceLabel}>Hash:</Text>
                  <Text style={[styles.evidenceValue, styles.hashText]}>
                    {shortHash(incident.snapshot_hash)}
                  </Text>
                </View>
                <View style={styles.evidenceRow}>
                  <Text style={styles.evidenceLabel}>Captured:</Text>
                  <Text style={styles.evidenceValue}>{formatTimestamp(incident.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.greenDark,
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.grayDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grayDark,
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 12,
    color: COLORS.grayMid,
  },
  section: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.grayDark,
    marginBottom: 8,
  },
  sectionNote: {
    fontSize: 13,
    color: COLORS.grayMid,
    marginBottom: 12,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockButton: {
    backgroundColor: COLORS.red,
  },
  unlockButton: {
    backgroundColor: COLORS.greenLight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  messageBox: {
    backgroundColor: COLORS.bgLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.greenLight,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.grayDark,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.red,
    marginBottom: 12,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    backgroundColor: COLORS.bgLight,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grayDark,
    marginBottom: 4,
  },
  listItemMeta: {
    fontSize: 12,
    color: COLORS.grayMid,
  },
  listItemTag: {
    fontSize: 11,
    backgroundColor: COLORS.blue,
    color: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  evidenceContainer: {
    gap: 12,
  },
  evidenceItem: {
    backgroundColor: COLORS.bgLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.grayMid,
  },
  evidenceValue: {
    fontSize: 12,
    color: COLORS.grayDark,
    flex: 1,
    textAlign: 'right',
  },
  hashText: {
    fontFamily: 'Courier',
    fontSize: 11,
  },
});
