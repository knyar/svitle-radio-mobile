#!/usr/bin/env bash
set -euo pipefail

APK=${1:?usage: scripts/e2e-android.sh <apk> [output-dir]}
OUT=${2:-e2e-output}
APP_ID=com.svitleradio

adb wait-for-device
adb install -r "$APK"
adb shell am force-stop "$APP_ID"
adb logcat -c
mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd) # Maestro resolves --debug-output more reliably as an absolute path

sampler_pid=
cleanup() {
  status=$?
  if [[ -n "$sampler_pid" ]]; then
    kill "$sampler_pid" 2>/dev/null || true
    wait "$sampler_pid" 2>/dev/null || true
  fi
  adb logcat -d > "$OUT/logcat.txt" 2>&1 || true
  # Maestro also keeps per-run logs and failure screenshots under ~/.maestro/tests.
  if [[ -d "$HOME/.maestro/tests" ]]; then
    cp -R "$HOME/.maestro/tests" "$OUT/maestro-home-tests" 2>/dev/null || true
  fi
  exit "$status"
}
trap cleanup EXIT

# Sample throughout the suite because later flows intentionally stop playback.
(
  while true; do
    date -u +'%Y-%m-%dT%H:%M:%SZ'
    session=$(adb shell dumpsys media_session 2>&1 || true)
    printf '%s\n' "$session"
    if [[ "$session" == *"state=PLAYING"* ]]; then
      touch "$OUT/playing-observed"
    fi
    sleep 1
  done
) >> "$OUT/media_session.log" &
sampler_pid=$!

set +e
maestro test --format JUNIT --output "$OUT/maestro-report.xml" \
  --debug-output "$OUT/maestro" -e APP_ID="$APP_ID" .maestro/
maestro_status=$?
set -e

evidence_status=0
if [[ ! -f "$OUT/playing-observed" ]]; then
  echo "no media session reached PLAYING during this attempt; see media_session.log" >&2
  evidence_status=1
fi

if (( maestro_status != 0 )); then
  exit "$maestro_status"
fi
exit "$evidence_status"
