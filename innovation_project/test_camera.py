#!/usr/bin/env python3
"""
Camera Detection Utility
Helps identify available camera devices on your system
"""

import cv2
import sys

def test_cameras():
    print("🔍 Scanning for available camera devices...\n")
    
    found_any = False
    for camera_id in range(10):
        cap = cv2.VideoCapture(camera_id)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                
                print(f"✅ Camera {camera_id} is AVAILABLE")
                print(f"   Resolution: {w}x{h}")
                print(f"   FPS: {fps:.2f}")
                print()
                found_any = True
            cap.release()
    
    if not found_any:
        print("❌ No camera devices found!")
        print("\n📋 Troubleshooting steps:")
        print("   1. On macOS: System Settings > Privacy & Security > Camera")
        print("      → Ensure the terminal/Python app has camera permission")
        print("   2. Check that your camera is connected and not in use")
        print("   3. Try restarting the application")
        print("   4. On some Macs, camera permissions require app restart")
        sys.exit(1)
    else:
        print("🎉 Camera detection successful!")
        print("\nThe detector will automatically use the first available camera.")

if __name__ == "__main__":
    test_cameras()
