#!/usr/bin/env bash
# Install the Maestro CLI at the version in MAESTRO_VERSION and prove it runs.
# The upstream installer is `curl | bash`; a download cut mid-transfer left a
# green step and no binary in CI once, so this retries and verifies.
set -euo pipefail

: "${MAESTRO_VERSION:?set MAESTRO_VERSION to the Maestro CLI version to install}"
BIN="$HOME/.maestro/bin/maestro"

for attempt in 1 2 3; do
  if curl -fsSL --retry 3 --retry-all-errors https://get.maestro.mobile.dev | bash && [[ -x "$BIN" ]]; then
    break
  fi
  echo "maestro install attempt $attempt failed" >&2
  rm -rf "$HOME/.maestro"
  sleep $((attempt * 10))
done

"$BIN" --version
if [[ -n "${GITHUB_PATH:-}" ]]; then
  echo "$HOME/.maestro/bin" >> "$GITHUB_PATH"
fi
