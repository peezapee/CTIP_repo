import cv2
import time
import os
import json
import threading
import sys
import firebase_admin
import hashlib
from collections import deque
from ultralytics import YOLO
from firebase_admin import credentials, firestore

from flask import Flask, Response
flask_app = Flask(__name__)
latest_frame = None
flask_ready = False

@flask_app.route('/video-feed')
def video_feed():
    def generate():
        while True:
            if latest_frame is not None:
                _, buf = cv2.imencode('.jpg', latest_frame)
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'
                       + buf.tobytes() + b'\r\n')
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@flask_app.route('/health')
def health():
    """Health check endpoint"""
    return {"status": "ok", "flask_ready": flask_ready}

def start_flask():
    global flask_ready
    try:
        flask_app.run(port=5000, threaded=True, debug=False, use_reloader=False)
        flask_ready = True
    except Exception as e:
        print(f"[FLASK ERROR] Failed to start Flask: {e}")
        flask_ready = False

flask_thread = threading.Thread(target=start_flask, daemon=True)
flask_thread.start()

# Give Flask time to start
time.sleep(2)
print("[FLASK] Server started on port 5000")

# ========== CONFIGURATION ==========
cred = credentials.Certificate("firebase_admin-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

MODEL_PATH = "best.pt"
CAMERA_ID = 0
CONFIDENCE_THRESHOLD = 0.60          # minimum confidence for audio alert (only alert classes)
RECORD_CONFIDENCE_THRESHOLD = 0.70  # minimum confidence to start recording (any class)
INFERENCE_EVERY_N_FRAMES = 2        # run classifier every N frames

ABNORMAL_CLASS_NAMES = {
    "acalypha_hispida",
    "asplenium_nidus",
    "bambusa_vulgaris",
    "bougainvillea_spectabilis",
    "bulbophyllum_beccarii",
    "burmannia_disticha",
    "burmannia_longifolia",
    "calophyllum_soulattri",
    "coelogyne_hirtella",
    "coelogyne_nitida",
    "cordyline_fruticosa",
    "couroupita_guianensis",
    "cycas_revoluta",
    "dendrobium_nobile",
    "dipteris_conjugata",
    "elaeis_guineensis",
    "eusideroxylon_zwageri",
    "heliconia_rostrata",
    "hibiscus_rosa_sinensis",
    "hornbills",
    "hymenocallis_littoralis",
    "impatiens_walleriana",
    "ixora",
    "licuala_orbicularis",
    "mousedeer",
    "nepenthes_lowii",
    "nepenthes_mollis",
    "nepenthes_rajah",
    "nepenthes_tentaculata",
    "nerium_oleander",
    "nypa_fruticans",
    "oleandra_neriiformis",
    "orangutans",
    "otters",
    "palhinhaea_cernua",
    "pangolin",
    "paphiopedilum_sanderianum",
    "phalaenopsis_bellina",
    "phalaenopsis_gigantea",
    "phyllocladus_hypophyllus",
    "piper_nigrum",
    "polyalthia_longifolia",
    "proboscis",
    "pteridium_aquilinum",
    "rafflesia_tuan_mudae",
    "silveredlangur",
    "sphagnum_cuspidatulum",
}

ALERT_CLASSES = {                     # only these trigger the beep & red warning
    "plant_picking",
    "cuttingtrees",
    "animaltrap",
    "netgun",
    "touching_animal",
}

PRE_DETECT_BUFFER_SEC = 3
POST_DETECT_RECORD_SEC = 5
OUTPUT_DIR = "incident_clips"
SNAPSHOT_DIR = "incident_snapshots"
LOG_FILE = "incident_log.json"
ALERT_COOLDOWN = 5
HEARTBEAT_EVERY_N = 5

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

# ───── Model (Classification) ─────
print("[MODEL] Loading classification model...")
if not os.path.exists(MODEL_PATH):
    print(f"[ERROR] Model not found at {MODEL_PATH}")
    sys.exit(1)

model = YOLO(MODEL_PATH)
CLASS_NAMES = model.names

print("\n=== CLASSIFICATION MODEL CLASSES ===")
for idx, name in CLASS_NAMES.items():
    print(f"ID {idx:>3}: {name}")
print("======================================\n")

# ───── Camera ─────
# Try to find an available camera device
cap = None
used_camera_id = CAMERA_ID

print(f"[CAMERA] Searching for available camera device...")
for attempt_id in range(10):  # Try device IDs 0-9
    print(f"[CAMERA] Trying camera ID {attempt_id}...")
    test_cap = cv2.VideoCapture(attempt_id)
    if test_cap.isOpened():
        # Verify it actually returns frames
        ret, frame = test_cap.read()
        if ret and frame is not None:
            cap = test_cap
            used_camera_id = attempt_id
            print(f"[CAMERA] ✓ Successfully opened camera ID {attempt_id}")
            break
        test_cap.release()
    else:
        test_cap.release()

if cap is None or not cap.isOpened():
    print("[ERROR] No available camera device found.")
    print("[ERROR] Please check:")
    print("  1. Camera is connected and enabled")
    print("  2. Camera permissions are granted (macOS: System Settings > Privacy & Security > Camera)")
    print("  3. No other application is exclusively using the camera")
    sys.exit(1)

w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS) or 30
print(f"[CAMERA] Resolution: {w}x{h}, FPS: {fps:.2f}")

buffer_size = int(PRE_DETECT_BUFFER_SEC * fps)
frame_buffer = deque(maxlen=buffer_size)

# ───── State ─────
writer = None
recording = False
last_detection_time = 0          # last time a recording trigger was active
last_alert_time = 0              # last time the beep was sounded
current_clip_path = None
incident_log = []
frame_count = 0
last_top1_name = "?"
last_top1_conf = 0.0

# ───── Utilities ─────
def beep_alert():
    def _beep():
        try:
            import winsound
            winsound.Beep(1000, 300)
        except:
            print('\a', end='', flush=True)
    threading.Thread(target=_beep, daemon=True).start()

def run_classification(frame):
    """Return (top1_name, top1_conf)"""
    results = model(frame, verbose=False)
    if not results:
        return "?", 0.0

    probs = results[0].probs
    if probs is None:
        return "?", 0.0

    top1_id = int(probs.top1)
    top1_conf = float(probs.top1conf)
    top1_name = CLASS_NAMES.get(top1_id, f"ID_{top1_id}")
    return top1_name, top1_conf

# ───── Main Loop ─────
def generate_file_hash(file_path):

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as f:
        while chunk := f.read(4096):
            sha256.update(chunk)

    return sha256.hexdigest()

def save_incident_to_firestore(
    detection_type,
    confidence,
    snapshot_path,
    video_path,
    snapshot_hash
):

    incident_data = {
        "type": detection_type,
        "confidence": float(confidence),
        "snapshot": snapshot_path,
        "snapshot_hash": snapshot_hash,
        "video": video_path,
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    doc_ref = db.collection("incidents").add(incident_data)

    print("[FIREBASE] Incident saved:", doc_ref)

print("[INFO] Running detector for website stream...")

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] Frame read failed, retrying...")
            time.sleep(0.1)
            continue

        frame_count += 1

        # Heartbeat
        if frame_count % HEARTBEAT_EVERY_N == 0:
            print(f"[HEARTBEAT] Frame {frame_count}, current class: {last_top1_name} ({last_top1_conf:.2f})")

        # Run classifier every N frames
        if frame_count % INFERENCE_EVERY_N_FRAMES == 0:
            last_top1_name, last_top1_conf = run_classification(frame)

        # Prepare annotated display frame
        display_frame = frame.copy()

        # Draw classification result
        label = f"{last_top1_name} ({last_top1_conf:.2f})"
        cv2.putText(display_frame, label, (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

        # Timestamp
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(display_frame, ts, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        now = time.time()

        # ----- Two independent triggers -----
        # Illegal activity → alert + recording
        is_alert = (
        last_top1_name in ALERT_CLASSES and
        last_top1_conf >= (0.5 if last_top1_name == "touching_animal" else CONFIDENCE_THRESHOLD)
        )
        is_rare  = (last_top1_conf >= RECORD_CONFIDENCE_THRESHOLD and last_top1_name in ABNORMAL_CLASS_NAMES)

        # Combined: start/continue recording if either is true
        should_record = is_alert or is_rare

        # --- Audio alert (only for alert classes) ---
        if is_alert:
            if now - last_alert_time > ALERT_COOLDOWN:
                print("\n" + "="*50)
                print("🚨 REAL-TIME ALERT")
                print("Detected:", last_top1_name)
                print("Confidence:", f"{last_top1_conf:.2f}")
                print("Time:", ts)
                print("="*50)
                beep_alert()
                last_alert_time = now

                # Save alert snapshot
                snapshot_name = f"alert_{int(now)}_{last_top1_name}.jpg"
                snapshot_path = os.path.join(SNAPSHOT_DIR, snapshot_name)
                cv2.imwrite(snapshot_path, display_frame)
                snapshot_hash = generate_file_hash(snapshot_path)

                print("[HASH] Snapshot SHA256:", snapshot_hash)
                print(f"[SNAPSHOT] Alert saved: {snapshot_path}")

                save_incident_to_firestore(
                    last_top1_name,
                    last_top1_conf,
                    snapshot_path,
                    current_clip_path if recording else "Not recording yet",
                    snapshot_hash
                )

            # Red warning on screen
            cv2.putText(display_frame, "⚠ ALERT DETECTED!", (50, 110),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

        # --- Recording logic (for both alerts and rare species) ---
        if should_record:
            last_detection_time = now   # keep activity timer fresh

            # Start recording if not already active
            if not recording:
                clip_name = f"incident_{int(now)}.avi"
                current_clip_path = os.path.join(OUTPUT_DIR, clip_name)
                writer = cv2.VideoWriter(
                    current_clip_path,
                    cv2.VideoWriter_fourcc(*'XVID'),
                    fps, (w, h)
                )
                # Write pre‑detection buffer
                for f in frame_buffer:
                    writer.write(f)
                recording = True
                print(f"[RECORDING] Started: {current_clip_path}")

                # Take a general recording-start snapshot
                if is_alert:
                    snap_prefix = "alert_recording"
                else:
                    snap_prefix = "rare_recording"   # silent event
                rec_snapshot_name = f"{snap_prefix}_{int(now)}_{last_top1_name}.jpg"
                rec_snapshot_path = os.path.join(SNAPSHOT_DIR, rec_snapshot_name)
                cv2.imwrite(rec_snapshot_path, display_frame)
                print(f"[SNAPSHOT] Recording snapshot saved: {rec_snapshot_path}")

        # ----- Store frame in buffer (always annotated) -----
        frame_buffer.append(display_frame.copy())

        # ----- Recording write and stop logic -----
        if recording:
            writer.write(display_frame)
            # Stop if no trigger active for POST_DETECT_RECORD_SEC
            if not should_record and now - last_detection_time > POST_DETECT_RECORD_SEC:
                writer.release()
                recording = False
                print("[INFO] Clip saved:", current_clip_path)

        # ----- Status bar -----
        status = "RECORDING" if recording else "MONITORING"
        status_color = (0, 0, 255) if recording else (0, 255, 0)
        cv2.putText(display_frame, status, (10, h - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
        latest_frame = display_frame.copy()

finally:
    print("[INFO] Shutting down...")
    if writer:
        writer.release()
    cap.release()

    with open(LOG_FILE, "w") as f:
        json.dump(incident_log, f, indent=2)
    print("[INFO] Log saved:", LOG_FILE)
