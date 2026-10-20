#!/usr/bin/env bash
set -euo pipefail

APK=${1:?usage: scripts/e2e-android.sh <apk> [output-dir]}
OUT=${2:-e2e-output}
APP_ID=com.svitleradio
# Maestro's Android driver default is 15 s for the instrumentation start and the gRPC handshake.
export MAESTRO_DRIVER_STARTUP_TIMEOUT=${MAESTRO_DRIVER_STARTUP_TIMEOUT:-60000}

mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd) # Maestro resolves --debug-output more reliably as an absolute path

# After a snapshot restore adb has reported the emulator "device offline" for a moment well
# after boot completed; Maestro's first flow then died with a gRPC UNAVAILABLE on that transport
# (PR #41, run 39489256984). Require the device to stay online for a continuous window first.
wait_for_stable_device() {
  local required=${DEVICE_STABLE_SECONDS:-20} stable=0 waited=0 flaps=0 state
  while (( waited < 180 )); do
    state=$(adb get-state 2>/dev/null || echo "unknown")
    if [[ "$state" == "device" ]] && adb shell true >/dev/null 2>&1; then
      stable=$((stable + 1))
    else
      if (( stable > 0 )); then flaps=$((flaps + 1)); fi
      echo "$(date -u +%FT%TZ) device not ready: state=$state (stable for ${stable}s so far)" >> "$OUT/device-ready.log"
      stable=0
    fi
    if (( stable >= required )); then
      echo "$(date -u +%FT%TZ) device online for ${required}s after ${waited}s (flaps seen: $flaps)" | tee -a "$OUT/device-ready.log"
      if (( flaps > 0 )); then
        echo "::warning title=e2e-android device flapped::adb reported the emulator offline $flaps time(s) before the suite started; see device-ready.log"
      fi
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  echo "device did not stay online for ${required}s within 180s; see $OUT/device-ready.log" >&2
  return 1
}

adb wait-for-device
rm -f "$OUT/device-ready.log"
wait_for_stable_device
adb install -r "$APK"
adb shell am force-stop "$APP_ID"

# Every first-flow failure so far died in launchApp (clear state + start) on an adb transport
# that dropped during the first minute of use, while later flows passed. Exercise that same
# path once with a throwaway flow before the suite. Its outcome is logged and annotated but
# never fails the run, so the signal stays visible without hiding a real flake in the suite.
warmup_dir=$(mktemp -d)
cat > "$warmup_dir/00-warmup.yaml" <<YAML
appId: \${APP_ID}
---
- launchApp:
    clearState: true
- extendedWaitUntil:
    visible: { id: "screen.streams" }
    timeout: 20000
YAML
rm -rf "$OUT/warmup" "$OUT/warmup.log"
mkdir -p "$OUT/warmup"
warmup_attempts=0
warmup_ok=0
for attempt in 1 2; do
  warmup_attempts=$attempt
  echo "$(date -u +%FT%TZ) warm-up attempt $attempt" >> "$OUT/warmup.log"
  if maestro test --debug-output "$OUT/warmup/attempt-$attempt" --test-output-dir "$OUT/warmup/attempt-$attempt" \
    --flatten-debug-output -e APP_ID="$APP_ID" "$warmup_dir/00-warmup.yaml" >> "$OUT/warmup.log" 2>&1; then
    warmup_ok=1
    echo "$(date -u +%FT%TZ) warm-up attempt $attempt passed" >> "$OUT/warmup.log"
    break
  else
    warmup_status=$?
    echo "$(date -u +%FT%TZ) warm-up attempt $attempt failed (maestro exit $warmup_status)" >> "$OUT/warmup.log"
  fi
  sleep 5
done
if (( warmup_ok == 0 )); then
  echo "::warning title=e2e-android warm-up failed::Both warm-up launches failed before the suite; see warmup.log and warmup/ in the artifact."
elif (( warmup_attempts > 1 )); then
  echo "::warning title=e2e-android warm-up retried::The first warm-up launch failed; see warmup.log and warmup/ in the artifact."
fi
rm -rf "$warmup_dir"
# The warm-up may have failed on the very transport flap it exists to absorb; wait for adb to be
# stable again (logged to the same device-ready.log) and tolerate a failing force-stop so the suite
# still runs and reports its own result.
wait_for_stable_device
adb shell am force-stop "$APP_ID" || true
adb logcat -c
# Evidence must come from this attempt only, even when a local run reuses the directory:
# the flattened Maestro output has no per-run folder, so stale files would otherwise mix in.
rm -rf "$OUT/maestro"
rm -f "$OUT/playing-observed" "$OUT/media_session.log" "$OUT/maestro-report.xml" "$OUT/logcat.txt"
mkdir -p "$OUT/maestro"

sampler_pid=
cleanup() {
  status=$?
  if [[ -n "$sampler_pid" ]]; then
    kill "$sampler_pid" 2>/dev/null || true
    wait "$sampler_pid" 2>/dev/null || true
  fi
  adb logcat -d > "$OUT/logcat.txt" 2>&1 || true
  exit "$status"
}
trap cleanup EXIT

# True when the dump on stdin shows this app's own media session in PLAYING.
# Each session block in `dumpsys media_session` carries a `package=` line
# followed by its `state=PlaybackState {state=PLAYING(3), ...}` line.
app_is_playing() {
  awk -v app="$APP_ID" '
    /package=/ { pkg = $0; sub(/.*package=/, "", pkg) }
    /state=PlaybackState \{state=PLAYING/ && pkg == app { found = 1 }
    END { exit found ? 0 : 1 }'
}

# Sample throughout the suite because later flows intentionally stop playback.
(
  while true; do
    date -u +'%Y-%m-%dT%H:%M:%SZ'
    session=$(adb shell dumpsys media_session 2>&1 || true)
    printf '%s\n' "$session"
    if printf '%s\n' "$session" | app_is_playing; then
      touch "$OUT/playing-observed"
    fi
    sleep 1
  done
) >> "$OUT/media_session.log" &
sampler_pid=$!

set +e
maestro test --format JUNIT --output "$OUT/maestro-report.xml" \
  --debug-output "$OUT/maestro" --test-output-dir "$OUT/maestro" --flatten-debug-output \
  -e APP_ID="$APP_ID" .maestro/
maestro_status=$?
set -e

evidence_status=0
if [[ ! -f "$OUT/playing-observed" ]]; then
  echo "no $APP_ID media session reached PLAYING during this attempt; see media_session.log" >&2
  evidence_status=1
fi

if (( maestro_status != 0 )); then
  exit "$maestro_status"
fi
exit "$evidence_status"
