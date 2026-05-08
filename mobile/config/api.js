/**
 * API Configuration for Mobile App
 * 
 * IMPORTANT: Update SERVER_IP to your machine's IP address
 * Run this command to find your IP:
 *   ifconfig | grep "inet " | grep -v 127.0.0.1
 * 
 * Or use: 192.168.1.X (check your local network)
 */

// ==================== CHANGE THIS TO YOUR MACHINE'S IP ====================
const SERVER_IP = '192.168.1.105';
// ============================================================================

export const API_BASE = `http://${SERVER_IP}:3000`;
export const VIDEO_FEED_URL = `http://${SERVER_IP}:5000/video-feed`;

// For localhost testing (web only)
export const API_BASE_LOCAL = 'http://localhost:3000';
export const VIDEO_FEED_URL_LOCAL = 'http://127.0.0.1:5000/video-feed';
