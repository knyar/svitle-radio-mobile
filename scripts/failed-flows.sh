#!/usr/bin/env bash
# Print the names of the flows that did not succeed in a Maestro JUnit report,
# comma-separated, or "unknown flow" when the report is missing or unparseable.
# Maestro 2.x writes one <testcase …> start tag per line carrying name="…" and
# status="SUCCESS|ERROR|…"; this never exits non-zero so callers can use it in
# a `set -e` script without guarding.
set -uo pipefail

report=${1:-}
names=
if [[ -n "$report" && -f "$report" ]]; then
  names=$(awk '
    /<testcase/ && /status="[^"]+"/ && $0 !~ /status="SUCCESS"/ {
      name = $0
      sub(/^.*[[:space:]]name="/, "", name)
      sub(/".*/, "", name)
      names = names (names ? ", " : "") name
    }
    END { print names }
  ' "$report" 2>/dev/null) || names=
fi
printf '%s\n' "${names:-unknown flow}"
exit 0
