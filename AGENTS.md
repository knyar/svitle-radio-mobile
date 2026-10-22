# Agent guide

Setup, run, build, release, and the CI overview are in [README.md](README.md). This file holds what
a coding agent needs beyond that: the gate to run, the rules, and how to debug CI.

## Gate

Install with `yarn install --frozen-lockfile` (Yarn Classic 1.22.22 is pinned via
`packageManager`). Run `yarn verify` before committing; it is the same check CI's `quality` job
runs and must be green. Run one test file with `yarn test <path>` or one test with
`yarn test -t "<name>"`.

For lint-target files, `.claude/settings.json` runs `yarn typecheck && yarn lint` after each
successful Claude Code `Edit` or `Write` tool call and reports failures. The hook does not see
changes made through Bash or external tools and adds about 8 seconds per edit, so `yarn verify`
remains the authoritative gate. Agents without hooks, including Codex, run `yarn verify` before
committing.

## Rules

- Never delete or skip tests, or update snapshots, merely to make CI pass.
- Every behavior change ships with a test.
- Do not change `newArchEnabled`, the react-native-track-player major version, or anything in
  `patches/` unless explicitly requested.
- Keep ESLint below 9 until the planned flat-config migration. React Native 0.81 provides only a
  legacy ESLint config.
- TypeScript `strict` is on. Do not weaken compiler options; fix the types.
- `test-renderer` must stay on the line that matches the installed React minor (1.1.x for React
  19.1; see its docs/versioning.md). Bump it together with `react`, never alone.
- Native builds must stay secret-free. Sentry uploads happen only when `ios/sentry.properties` or
  `SENTRY_AUTH_TOKEN` exists. Never commit `sentry.properties`.
- Keep `Gemfile` and `Gemfile.lock` in sync; CI runs Bundler in deployment mode.
- `ios/Podfile.lock` must match `ios/Podfile`: after editing the Podfile, set its
  `PODFILE CHECKSUM` line to `sha1sum ios/Podfile` (or run `bundle exec pod install` on macOS).
  The `ios` CI job fails on any other lockfile drift.
- CI runners are pinned: `ubuntu-24.04`, and the `xcode-27` image with Xcode 27.0 for the macOS
  jobs. Move these deliberately; never use a moving `-latest` label (GitHub began migrating
  `ubuntu-latest` to Ubuntu 26 on 2026-10-19).
- The Podfile's `post_install` carries Xcode 27 workarounds for React Native 0.81 (pod deployment
  targets, fmt consteval). Remove them only when upgrading to a React Native release that has the
  upstream fixes (0.83.5+ for fmt, react-native#58687 for resource bundles).
- Maestro flows match stable IDs only: `screen.*`, `nav.*`, `player.play|pause|disabled`,
  `streams.item.<id>`, and `logo.<logo>`. Never match visible text; the app is localised. When adding
  a control a flow needs, give it a stable `testID` and assert state rather than text.
- When a flow flakes, first lengthen its state wait. Quarantine only with an owner, reason, and
  expiry recorded in the flow.

## Debugging CI

Download artifacts with `gh run download <run-id> -n <name>`; the names are `app-svitle-e2e`,
`SvitleRadio-simulator`, and `e2e-android-output`.

`e2e-android` runs `scripts/e2e-android-ci.sh`, which wraps `scripts/e2e-android.sh` with a
one-retry policy. A pass after retry is recorded as a warning naming the failed flows
(`scripts/failed-flows.sh`) and is not a clean pass. The `e2e-android-output` artifact contains:

- `maestro-report.xml`, the JUnit report
- `api-server.log`, the local API request log
- `logcat.txt` and `media_session.log`, the device log and sampled playback evidence
- `device-ready.log`, how long adb took to report the emulator stably online (a warning annotation
  if it flapped; a transient "device offline" after snapshot restore has killed the first flow)
- `warmup.log` and `warmup/`, the throwaway launch that absorbs a first-use transport flap
- `maestro/`, written flat because the artifact upload skips dot-directories: the session
  `maestro.log` plus one folder per flow with `commands.json`, `logs/maestro.log`, the device log,
  and failure screenshots

`MAESTRO_DRIVER_STARTUP_TIMEOUT` is 60 s on Android (Maestro default 15 s) and 240 s on iOS
(default 120 s). Scheduled and manually dispatched workflows become available only after the
workflow exists on the default `master` branch.

The e2e suites use only the local server in `scripts/e2e-api` and never contact `m.svitle.org`.
Production stream monitoring remains in `scripts/stream-health.sh`.

## Agent loop

Build and install the app on a simulator or emulator (README, "End-to-end tests"), then explore the
change with the `maestro` MCP server (`inspect_screen`, `take_screenshot`, or `run` with inline
YAML) or with `mobile-mcp`. Save the working steps as a flow under `.maestro/`, following the
stable-ID rule above. Run `scripts/e2e-android.sh` for Android or
`maestro test -e APP_ID=org.svitle.app1 .maestro/` for iOS before pushing. If CI fails, download
and inspect the `e2e-android-output` artifact.

The checked-in `.mcp.json` is Claude Code configuration for the Maestro and mobile-mcp servers;
Codex configures MCP servers separately. The mobile-mcp version is pinned and should be bumped
deliberately. Interactive Claude Code sessions ask once to approve project MCP servers. The
`maestro` server requires the Maestro CLI and Java 17 or newer on `PATH`; where they are absent,
including Linux CI boxes, it appears as a failed, unavailable server without affecting mobile-mcp.
MobileBuildMCP is an optional macOS addition for Xcode build, run, and log access:
`npx -y mobilebuildmcp@latest mcp`.

## Known debt

- Player has no error UI and no buffering indicator distinct from the shared disabled control.
- Twenty stale Dependabot PRs from the React Native 0.63 era should be closed or recreated now
  that CI exists.
