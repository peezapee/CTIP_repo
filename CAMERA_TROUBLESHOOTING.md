# Camera Access Troubleshooting Guide

## Problem
The AI monitor page doesn't show the camera feed when clicking "Start Monitoring" on your laptop, even though it works on your friend's laptop.

## Root Cause
The detector was hardcoded to use camera device ID 0, which may not be available on your system. On macOS, different machines may have different camera device IDs depending on:
- Built-in vs USB camera
- Other apps using the camera
- System camera configuration

## Solutions Applied

### 1. **Automatic Camera Detection** ✅
The detector now automatically scans for available cameras (IDs 0-9) instead of just trying ID 0.

### 2. **Better Error Messages** ✅
If no camera is found, you'll now get a clear error message explaining what's wrong:
- "Camera device not found or not accessible"
- "Check camera permissions and connections"

### 3. **Cross-Platform Path Fix** ✅
Fixed the Windows-specific path to use relative paths that work on macOS, Windows, and Linux.

## How to Fix Your Issue

### Step 1: Check Camera Permissions (macOS)
1. **System Settings → Privacy & Security → Camera**
2. Look for **Terminal** or **Python** in the list
3. If missing or marked ❌, you may need to:
   - Grant permission by adding it to the list
   - Quit and restart the terminal/server
   - Restart your Mac (sometimes required for new permissions)

### Step 2: Test Camera Detection
Run the diagnostic tool:
```bash
cd /Users/switch/Documents/GitHub/CTIP_repo/innovation_project
python3 test_camera.py
```

This will show you:
- ✅ Which camera devices are available
- ❌ If no cameras are found
- Camera resolution and FPS for each device

### Step 3: Restart Services
Once you've granted camera permissions:
1. **Restart the backend server**:
   ```bash
   # In /Users/switch/Documents/GitHub/CTIP_repo/server
   npm install  # if needed
   node server.js
   ```

2. **Restart the frontend** (if using Vite dev server):
   ```bash
   # In /Users/switch/Documents/GitHub/CTIP_repo/web
   npm run dev
   ```

### Step 4: Test the Monitor
1. Log in as a guide
2. Go to **AI Monitor** tab
3. Click **Start Monitoring**
4. You should now see the camera feed

## Common Issues

### "Video server did not respond" Error
- Camera permission is not granted (see Step 1)
- Another app is exclusively using the camera
- Flask server on port 5000 failed to start

### "Camera device not found" Error
- Your camera is disabled in system settings
- USB camera is disconnected
- No camera is connected to your device

### Camera Permission on macOS
Granting camera permission sometimes requires:
- **Restart the application** (not just the server)
- **Restart your Mac** (for new permission grants)
- **Check System Settings → General → Login Items** to ensure Terminal/IDE isn't being restricted

## Still Not Working?

Check the server logs for detailed error messages:
```
[PYTHON ERROR]: Cannot open webcam
[PYTHON ERROR]: No available camera device found
```

These logs show exactly which camera detection failed and will help diagnose the issue.

## What Changed
| Component | Before | After |
|-----------|--------|-------|
| Camera Detection | Hardcoded to ID 0 | Auto-scans IDs 0-9 |
| Error Handling | Silent failure | Clear error messages |
| Server Path | Windows-specific | Cross-platform |
| Health Check | None | Waits for Flask ready |

Your friend's laptop likely worked because their built-in camera was device ID 0, while yours might be ID 1 or have different permissions.
