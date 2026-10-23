#!/usr/bin/env bash
# Screenshot every screen on one Android emulator at several display sizes.
#
#   scripts/screenshot-sizes.sh <apk> [output-dir] [name:WxH:dpi ...]
#
# Needs a booted emulator (or a device you are happy to resize), adb and maestro on PATH, and the
# e2e APK, which has the local API URL baked in. The display is resized with `wm size` and
# `wm density`, so one emulator stands in for every phone class; notches and safe-area insets are
# not emulated. Writes <output-dir>/<name>/{streams,live,contacts}.png and, when ImageMagick's
# `montage` is installed, <output-dir>/<screen>.png contact sheets with every size side by side.
set -euo pipefail

APK=${1:?usage: scripts/screenshot-sizes.sh <apk> [output-dir] [name:WxH:dpi ...]}
OUT=${2:-e2e-output/sizes}
shift $(( $# > 2 ? 2 : $# ))
APP_ID=com.svitleradio
FLOW=$(cd "$(dirname "$0")/.." && pwd)/.maestro/screenshots/screens.yaml
export MAESTRO_DRIVER_STARTUP_TIMEOUT=${MAESTRO_DRIVER_STARTUP_TIMEOUT:-60000}

# Physical pixels and density; the dp size is what the layout sees.
DEFAULT_PROFILES=(
  "phone-small:720x1280:320"  # 360x640 dp, budget phones
  "pixel-6:1080x2400:420"     # 412x915 dp, the CI emulator
  "phone-large:1290x2796:460" # 430x932 dp, Pro Max class
  "duo:1350x1800:400"         # 540x720 dp, Surface Duo single screen
  "tablet:1600x2560:320"      # 800x1280 dp
)
PROFILES=("$@")
if (( ${#PROFILES[@]} == 0 )); then
  PROFILES=("${DEFAULT_PROFILES[@]}")
fi

mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd)
readonly E2E_API_PORT=8484
api_pid=

cleanup() {
  status=$?
  adb shell wm size reset >/dev/null 2>&1 || true
  adb shell wm density reset >/dev/null 2>&1 || true
  if [[ -n "$api_pid" ]]; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
  exit "$status"
}
trap cleanup EXIT

if curl -sf "http://127.0.0.1:$E2E_API_PORT/v2/preferences.svitle" >/dev/null; then
  echo "using the local e2e API already listening on port $E2E_API_PORT"
else
  node "$(dirname "$FLOW")/../../scripts/e2e-api/server.js" --port "$E2E_API_PORT" > "$OUT/api-server.log" 2>&1 &
  api_pid=$!
  api_ready=0
  for _attempt in {1..20}; do
    if curl -sf "http://127.0.0.1:$E2E_API_PORT/v2/preferences.svitle" >/dev/null; then
      api_ready=1
      break
    fi
    sleep 0.5
  done
  if (( api_ready == 0 )); then
    echo "local e2e API did not become ready on port $E2E_API_PORT; see $OUT/api-server.log" >&2
    exit 1
  fi
fi

adb wait-for-device
adb install -r "$APK"

failed=()
for profile in "${PROFILES[@]}"; do
  IFS=: read -r name size density <<< "$profile"
  if [[ -z "$name" || ! "$size" =~ ^[0-9]+x[0-9]+$ || ! "$density" =~ ^[0-9]+$ ]]; then
    echo "bad profile '$profile'; expected name:WxH:dpi" >&2
    exit 2
  fi
  echo "== $name ($size @ ${density}dpi)"
  adb shell am force-stop "$APP_ID" || true
  adb shell wm size "$size"
  adb shell wm density "$density"
  sleep 2 # let the window manager apply the new configuration before the app launches
  dir="$OUT/$name"
  rm -rf "$dir"
  mkdir -p "$dir"
  if ! (cd "$dir" && maestro test --debug-output "$dir/maestro" --test-output-dir "$dir/maestro" \
    --flatten-debug-output -e APP_ID="$APP_ID" "$FLOW" > "$dir/maestro.log" 2>&1); then
    echo "   maestro failed; see $dir/maestro.log" >&2
    failed+=("$name")
  fi
done

if command -v montage >/dev/null; then
  for screen in streams live contacts; do
    shots=()
    for profile in "${PROFILES[@]}"; do
      name=${profile%%:*}
      [[ -f "$OUT/$name/$screen.png" ]] && shots+=("$OUT/$name/$screen.png")
    done
    if (( ${#shots[@]} > 0 )); then
      montage -label '%d' "${shots[@]}" -tile "${#shots[@]}x1" -geometry 'x900+12+12' \
        -background '#dddddd' "$OUT/$screen.png"
    fi
  done
fi

if (( ${#failed[@]} > 0 )); then
  echo "failed profiles: ${failed[*]}" >&2
  exit 1
fi
echo "screenshots in $OUT"
