import cv2
import time
import os
import json
import threading
import sys
from collections import deque
from ultralytics import YOLO

# ========== CONFIGURATION ==========
MODEL_PATH = "innovation_project/last.pt"
CAMERA_ID = 0
CONFIDENCE_THRESHOLD = 0.9          # minimum confidence to consider a detection
INFERENCE_EVERY_N_FRAMES = 2        # run classifier every N frames

ABNORMAL_CLASS_NAMES = {
    "Sphagnum_Cuspidatulum", "polyalthia longifolia", "pteridium aquilinum",
    "Rafflesia tuan-mudae", "phalaenopsis bellina", "phalaenopsis gigantea",
    "Phyllocladus_hypophyllus", "piper nigrum", "Palhinhaea_cernua",
    "paphiopedilum sanderianum", "nypa fruticans", "Oleandra_neriiformis",
    "nerium_oleander", "Nepenthes_tentaculata", "nepenthes rajah",
    "Nepenthes_molli", "ixora", "licuala orbicularis", "nepenthes lowii",
    "Impatiens_walleriana", "hymenocallis littoralis", "hibiscus rosa-sinensis",
    "heliconia rostrata", "dipteris conjugata", "elaeis guineensis",
    "eusideroxylon zwageri", "couroupita guianensis", "cycas revoluta",
    "dendrobium nobile", "cordyline fruticosa", "Coelogyne_Hirtella",
    "Burmannia_disticha", "Burmannia_Longifolia", "Calophyllum_soulattri",
    "coelogyne nitida", "bougainvillea spectabilis", "bulbophyllum beccarii",
    "asplenium nidus", "bambusa vulgaris", "acalypha hispida",
    "Orangutans", "Otters", "Pangolin", "Proboscis,Silveredlangur",
    "Hornbills", "MouseDeer",
    "plant_picking", "Cuttingtrees",
    "Animaltrap", "NetGun"
}

PRE_DETECT_BUFFER_SEC = 3
POST_DETECT_RECORD_SEC = 5
OUTPUT_DIR = "incident_clips"
SNAPSHOT_DIR = "incident_snapshots"
LOG_FILE = "incident_log.json"
ALERT_COOLDOWN = 10
HEARTBEAT_EVERY_N = 10

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
last_detection_time = 0
last_alert_time = 0
current_clip_path = None
incident_log = []
frame_count = 0
last_top1_name = "?"
last_top1_conf = 0.0
last_is_abnormal = False

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
    """Return (top1_name, top1_conf, is_abnormal)"""
    results = model(frame, verbose=False)
    if not results:
        return "?", 0.0, False

    probs = results[0].probs
    if probs is None:
        return "?", 0.0, False

    top1_id = int(probs.top1)
    top1_conf = float(probs.top1conf)
    top1_name = CLASS_NAMES.get(top1_id, f"ID_{top1_id}")

    is_abnormal = (top1_conf >= CONFIDENCE_THRESHOLD and top1_name in ABNORMAL_CLASS_NAMES)
    return top1_name, top1_conf, is_abnormal

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
            last_top1_name, last_top1_conf, last_is_abnormal = run_classification(frame)

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

        # Abnormal detection logic
        if last_is_abnormal:
            last_detection_time = now

            # Alert print & snapshot (with cooldown)
            if now - last_alert_time > ALERT_COOLDOWN:
                print("\n" + "="*50)
                print("🚨 REAL-TIME ALERT")
                print("Detected:", last_top1_name)
                print("Confidence:", f"{last_top1_conf:.2f}")
                print("Time:", ts)
                print("="*50)
                beep_alert()
                last_alert_time = now

                # 📸 Save annotated snapshot
                snapshot_name = f"alert_{int(now)}_{last_top1_name}.jpg"
                snapshot_path = os.path.join(SNAPSHOT_DIR, snapshot_name)
                cv2.imwrite(snapshot_path, display_frame)
                print(f"[SNAPSHOT] Saved: {snapshot_path}")

            # Start recording if not already
            if not recording:
                clip_name = f"incident_{int(now)}.avi"
                current_clip_path = os.path.join(OUTPUT_DIR, clip_name)
                writer = cv2.VideoWriter(
                    current_clip_path,
                    cv2.VideoWriter_fourcc(*'XVID'),
                    fps, (w, h)
                )
                recording = True
                # Write pre‑detection buffer (now annotated frames)
                for f in frame_buffer:
                    writer.write(f)
                print(f"[RECORDING] Started: {current_clip_path}")

            # Draw alert text on screen
            cv2.putText(display_frame, "⚠ ALERT DETECTED!", (50, 110),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

        # Always store annotated frame in buffer (so pre‑alert frames are also annotated)
        frame_buffer.append(display_frame.copy())

        # Recording logic
        if recording:
            writer.write(display_frame)   # record annotated frame
            if (not last_is_abnormal and
                    now - last_detection_time > POST_DETECT_RECORD_SEC):
                writer.release()
                recording = False
                print("[INFO] Clip saved:", current_clip_path)

        # Status bar
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