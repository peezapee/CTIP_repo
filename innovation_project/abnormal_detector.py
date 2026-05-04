import cv2
import time
import os
import json
import threading
import sys
from collections import deque
from ultralytics import YOLO

# ========== CONFIGURATION ==========
MODEL_PATH = "innovation_project/best.pt"
CAMERA_ID = 0
CONFIDENCE_THRESHOLD = 0.95          # minimum confidence for audio alert (only alert classes)
RECORD_CONFIDENCE_THRESHOLD = 0.99  # minimum confidence to start recording (any class)
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
    "netgun"
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
print(f"[CAMERA] Opening camera ID {CAMERA_ID}...")
cap = cv2.VideoCapture(CAMERA_ID)
if not cap.isOpened():
    print("[ERROR] Cannot open webcam.")
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
print("[INFO] Running... press Q to quit")
cv2.namedWindow("AI Monitoring System", cv2.WINDOW_NORMAL)
cv2.resizeWindow("AI Monitoring System", 960, 540)

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
        is_alert = (last_top1_conf >= CONFIDENCE_THRESHOLD and last_top1_name in ALERT_CLASSES)

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
                print(f"[SNAPSHOT] Alert saved: {snapshot_path}")

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

        cv2.imshow("AI Monitoring System", display_frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            print("[INFO] 'q' pressed, exiting...")
            break
        # Detect window close
        if cv2.getWindowProperty("AI Monitoring System", cv2.WND_PROP_VISIBLE) < 1:
            print("[INFO] Window closed, exiting...")
            break

finally:
    print("[INFO] Shutting down...")
    if writer:
        writer.release()
    cap.release()
    cv2.destroyAllWindows()

    with open(LOG_FILE, "w") as f:
        json.dump(incident_log, f, indent=2)
    print("[INFO] Log saved:", LOG_FILE)