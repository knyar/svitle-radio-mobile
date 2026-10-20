#!/usr/bin/env bash
set -euo pipefail

API_URL=${API_URL:-https://m.svitle.org/v2}
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT

request() {
  local url=$1 body=$2 headers=$3
  curl --silent --show-error --location --max-time 20 \
    --dump-header "$headers" --output "$body" --write-out '%{http_code}' "$url"
}

status_code=$(request "$API_URL/status?recent_tracks=0" "$work_dir/status.json" "$work_dir/status.headers")
preferences_code=$(request "$API_URL/preferences.svitle" "$work_dir/preferences.json" "$work_dir/preferences.headers")

if [[ "$status_code" != 200 || "$preferences_code" != 200 ]]; then
  echo "API request failed: status=$status_code preferences=$preferences_code" >&2
  exit 1
fi

python3 - "$work_dir/status.json" "$work_dir/preferences.json" "$work_dir/streams.tsv" <<'PY'
import json
import sys

status_path, preferences_path, output_path = sys.argv[1:]
with open(status_path, encoding="utf-8") as source:
    status = json.load(source)
with open(preferences_path, encoding="utf-8") as source:
    preferences = json.load(source)

stations = preferences.get("stations", [])
if not stations:
    raise SystemExit("preferences has no stations")
status_stations = status.get("stations", {})
with open(output_path, "w", encoding="utf-8") as output:
    for station in stations:
        station_id = station["id"]
        streams = status_stations.get(station_id, {}).get("streams", [])
        if not streams:
            raise SystemExit(f"status has no streams for {station_id}")
        for stream in streams:
            print(station_id, stream.get("name", "default"), stream["url"], sep="\t", file=output)
PY

printf '%-12s %-10s %-8s %s\n' STATION STREAM RESULT URL
failures=0
while IFS=$'\t' read -r station name playlist_url; do
  playlist_body="$work_dir/playlist"
  playlist_headers="$work_dir/playlist.headers"
  playlist_code=$(request "$playlist_url" "$playlist_body" "$playlist_headers")
  playlist_type=$(sed -nE 's/^[Cc]ontent-[Tt]ype:[[:space:]]*([^;[:space:]]+).*/\1/p' "$playlist_headers" | tail -1 | tr -d '\r')

  if [[ "$playlist_code" != 200 || "$playlist_type" != *mpegurl* ]] ||
    ! grep -q '^#EXTM3U' "$playlist_body"; then
    printf '%-12s %-10s %-8s %s\n' "$station" "$name" FAIL "$playlist_url"
    failures=$((failures + 1))
    continue
  fi

  media_url=$(python3 - "$playlist_url" "$playlist_body" <<'PY'
import sys
from urllib.parse import urljoin

url, path = sys.argv[1:]
with open(path, encoding="utf-8") as source:
    lines = [line.strip() for line in source if line.strip()]
entries = [line for line in lines if not line.startswith("#")]
print(urljoin(url, entries[0]) if entries else "")
PY
)
  if [[ -z "$media_url" ]]; then
    printf '%-12s %-10s %-8s %s\n' "$station" "$name" FAIL "$playlist_url"
    failures=$((failures + 1))
    continue
  fi

  # A master playlist points to a variant playlist; follow one level.
  if grep -q '^#EXT-X-STREAM-INF' "$playlist_body"; then
    variant_code=$(request "$media_url" "$playlist_body" "$playlist_headers")
    if [[ "$variant_code" != 200 ]] || ! grep -q '^#EXTM3U' "$playlist_body"; then
      printf '%-12s %-10s %-8s %s\n' "$station" "$name" FAIL "$media_url"
      failures=$((failures + 1))
      continue
    fi
    media_url=$(python3 - "$media_url" "$playlist_body" <<'PY'
import sys
from urllib.parse import urljoin

url, path = sys.argv[1:]
with open(path, encoding="utf-8") as source:
    entries = [line.strip() for line in source if line.strip() and not line.startswith("#")]
print(urljoin(url, entries[0]) if entries else "")
PY
)
  fi

  segment_headers="$work_dir/segment.headers"
  segment_body="$work_dir/segment"
  segment_code=$(curl --silent --show-error --location --range 0-65535 --max-time 15 \
    --dump-header "$segment_headers" --output "$segment_body" --write-out '%{http_code}' "$media_url")
  segment_type=$(sed -nE 's/^[Cc]ontent-[Tt]ype:[[:space:]]*([^;[:space:]]+).*/\1/p' "$segment_headers" | tail -1 | tr -d '\r')
  if [[ ( "$segment_code" == 200 || "$segment_code" == 206 ) && -s "$segment_body" &&
    "$segment_type" =~ ^(audio/|video/|application/octet-stream) ]]; then
    printf '%-12s %-10s %-8s %s\n' "$station" "$name" OK "$playlist_url"
  else
    printf '%-12s %-10s %-8s %s\n' "$station" "$name" FAIL "$playlist_url"
    failures=$((failures + 1))
  fi
done < "$work_dir/streams.tsv"

exit "$failures"
