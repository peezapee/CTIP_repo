import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { auth } from '../firebase';
import { API_BASE, VIDEO_FEED_URL } from '../config/api';
const COLORS = {
  greenDark: '#2d6a4f',
  greenLight: '#40916c',
  red: '#e63946',
  grayDark: '#333',
  grayMid: '#666',
  grayLight: '#ccc',
  white: '#fff',
  bgLight: '#f5f5f5',
};

export default function MonitoringScreen() {
  const [status, setStatus] = useState({
    running: false,
    feedUrl: VIDEO_FEED_URL,
    canControl: false,
    isLocked: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [feedReloadKey, setFeedReloadKey] = useState(0);

  // Get ID token for API calls
  const getToken = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Please log in again to use the monitor.');
    }
    return user.getIdToken();
  }, []);

  // Load detector status
  const loadStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/detector/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Unable to load detector status from ${API_BASE}.`);
      }

      setStatus({
        running: Boolean(data.running),
        feedUrl: data.feedUrl || VIDEO_FEED_URL,
        canControl: Boolean(data.canControl),
        isLocked: Boolean(data.isLocked),
      });
      setStatusError('');
    } catch (error) {
      console.error('Detector status error:', error);
      setStatusError(
        error.message ||
          `Unable to connect to the detector server at ${API_BASE}. Check your phone/emulator network and the SERVER_IP in mobile/config/api.js.`
      );
    }
  }, [getToken]);

  // Refresh status on mount and periodically
  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, 3000);
    return () => clearInterval(id);
  }, [loadStatus]);

  // Start or stop detector
  const callDetector = useCallback(
    async (action) => {
      setLoading(true);

      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/detector/${action}`, {
          method: action === 'start' ? 'POST' : 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || `Unable to ${action} detector.`);
        }

        setMessage(data.message || `Detector ${action}ed.`);
        await loadStatus();
      } catch (error) {
        console.error(`Detector ${action} error:`, error);
        setMessage(error.message || `Unable to ${action} detector.`);
      } finally {
        setLoading(false);

        setTimeout(() => {
          setMessage('');
        }, 3000);
      }
    },
    [getToken, loadStatus]
  );

  const isGuide = true;
  const isLockedForGuide = isGuide && status.isLocked;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tour Monitoring</Text>
        <Text style={styles.headerSubtitle}>
          Start or stop the detector and view the tour camera
        </Text>
      </View>

      {/* Camera Feed Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>📷 Camera Feed</Text>
            <Text style={styles.note}>
              {status.running
                ? 'The detector is active and streaming the camera view.'
                : isLockedForGuide
                  ? 'The detector is offline and the camera is currently locked by admin.'
                  : 'The detector is currently offline. Start monitoring to view the camera.'}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: status.running ? '#40916c' : '#999' },
            ]}
          >
            <Text style={styles.badgeText}>
              {status.running ? 'Running' : 'Stopped'}
            </Text>
          </View>
        </View>

        {isLockedForGuide && (
          <View style={styles.lockNotice}>
            <Text style={styles.lockNoticeText}>
              Admin has locked the camera. You can view the feed when it's active, but cannot control monitoring.
            </Text>
          </View>
        )}

        {/* Camera Feed Placeholder */}
        <View style={styles.cameraFrame}>
          {status.running && !isLockedForGuide ? (
            <Image
              key={feedReloadKey}
              source={{
                uri: `${status.feedUrl}?feed=${feedReloadKey}`,
              }}
              style={styles.cameraImage}
              onError={() => {
                setStatusError(
                  'The detector is running, but the live camera stream is not available yet. Retrying...'
                );

                setTimeout(() => {
                  setFeedReloadKey((current) => current + 1);
                }, 1500);
              }}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.placeholderText}>
                Camera feed will appear here when monitoring starts.
              </Text>
            </View>
          )}
        </View>

        {statusError && (
          <Text style={styles.errorText}>{statusError}</Text>
        )}
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Tour Monitoring Status</Text>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.startButton,
              (loading || status.running || !status.canControl) && styles.buttonDisabled,
            ]}
            disabled={loading || status.running || !status.canControl}
            onPress={() => callDetector('start')}
          >
            {loading && !status.running ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Start Monitoring</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.stopButton,
              (loading || !status.running || !status.canControl) && styles.buttonDisabled,
            ]}
            disabled={loading || !status.running || !status.canControl}
            onPress={() => callDetector('stop')}
          >
            {loading && status.running ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Stop Monitoring</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          {isLockedForGuide
            ? 'The camera is locked by admin, so your controls are disabled until it is unlocked.'
            : status.canControl
              ? 'Use these controls to begin or end the guided-tour monitoring session.'
              : 'You do not currently have permission to control monitoring. Please log in again or check your account role.'}
        </Text>

        {message && <Text style={styles.successText}>{message}</Text>}
      </View>

      {/* Guide Only Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About Monitoring</Text>
        <Text style={styles.infoText}>
          When you start monitoring, the detector will begin analyzing camera feeds for unusual activity during your guided tours. The admin can lock camera access if needed.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
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
  section: {
    backgroundColor: COLORS.white,
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.greenDark,
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    color: COLORS.grayMid,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  lockNotice: {
    backgroundColor: '#ffe0e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.red,
  },
  lockNoticeText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '500',
  },
  cameraFrame: {
    height: 280,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    marginTop: 8,
  },
  controlsContainer: {
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
  startButton: {
    backgroundColor: COLORS.greenDark,
  },
  stopButton: {
    backgroundColor: COLORS.red,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  successText: {
    color: COLORS.greenDark,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.grayMid,
    lineHeight: 18,
  },
});
