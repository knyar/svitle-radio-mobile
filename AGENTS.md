# Contributor guide

## Install and verify

This project uses Yarn Classic (pinned via the `packageManager` field in package.json) and Node 22.13 or newer (Node 24 also works; see `engines`). Enable Corepack so the pinned Yarn is used, then install exactly from the lockfile:

```sh
corepack enable
yarn install --frozen-lockfile
```

Run the complete fast gate with `yarn verify`. It runs, in order:

- `yarn typecheck` — TypeScript without emitting files.
- `yarn lint` — ESLint with zero warnings allowed and no file rewriting.
- `yarn format:check` — Prettier validation.
- `yarn test:ci` — Jest in CI mode with bounded workers.

Use `yarn lint:fix` and `yarn format` when intentionally applying automatic fixes.

Run one test file with `yarn test app/utils/retry.test.ts`, or select a test by name with `yarn test -t "retries after a rejection"`.

## Build and run

- Metro: `yarn start`
- Svitle Android: `yarn run-svitle-android`
- Svetloe Android: `yarn run-svetloe-android`
- Svitle iOS: run `bundle install`, then `cd ios && bundle exec pod install && cd ..`, followed by `yarn run-svitle-ios`. `yarn install` no longer runs `pod install`; run `bundle exec pod install` yourself after installing or changing native dependencies.
- Android release bundles: `yarn release-svitle-android` or `yarn release-svetloe-android`.
- Svitle Android release APK: `yarn build-svitle-android`.
- Svitle e2e APK: `cd android && ./gradlew :app:assembleSvitleE2e`. This release-like, debug-signed build includes its JS bundle; CI uploads it and milestone 3 installs it.
- Svitle iOS simulator app: `xcodebuild -workspace ios/SvitleRadio.xcworkspace -scheme SvitleRadio -configuration Svitle.Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS=arm64 COMPILER_INDEX_STORE_ENABLE=NO build`.

## CI

The `quality` job runs the fast verification gate. The `android` job builds and verifies the `app-svitle-e2e` artifact, and the `ios` job builds and verifies the `SvitleRadio-simulator` artifact. Download artifacts from a run with `gh run download <run-id> -n app-svitle-e2e` or `gh run download <run-id> -n SvitleRadio-simulator`.

The iOS job pins both `macos-15` and Xcode 16.4, and the Linux jobs pin `ubuntu-24.04`. Move these deliberately; never use a moving `-latest` label (GitHub began migrating `ubuntu-latest` to Ubuntu 26 on 2026-10-19).

## Maestro

Maestro flows use stable IDs: `screen.*`, `nav.*`, `player.play|pause|disabled`, and
`streams.item.<id>`. Never match visible text because the app is localised. When adding a control a
flow needs, give it a stable `testID` and assert state rather than text.

For Android, install Maestro, build the e2e APK, start an emulator, then run:

```sh
scripts/e2e-android.sh android/app/build/outputs/apk/svitle/e2e/app-svitle-e2e.apk
```

For iOS, build the simulator app, install it with `xcrun simctl install`, then run
`maestro test -e APP_ID=org.svitle.app1 .maestro/`.

CI runs `scripts/e2e-android-ci.sh`, which wraps the script above with the one-retry policy. The `e2e-android-output` CI artifact contains `maestro-report.xml`, `media_session.log` and
`logcat.txt`; Maestro 2.11 has not produced debug screenshots or logs in CI even on failures. Android retries once in the same
emulator; a pass after retry is recorded as a warning and is not a clean pass. First lengthen state
waits when investigating flakes. Quarantine only with an owner, reason, and expiry recorded in the
flow. Add the `run-ios-e2e` PR label to run iOS on demand. Scheduled and manually dispatched
workflows become available only after the workflow exists on the default `master` branch.

## Agent loop

Build and install the app on a simulator or emulator with the commands above, then explore the change with the `maestro` MCP server (`inspect_screen`, `take_screenshot`, or `run` with inline YAML) or with `mobile-mcp`. Save the working steps as a flow under `.maestro/`, following the stable-ID conventions above. Run `scripts/e2e-android.sh` for Android or `maestro test -e APP_ID=org.svitle.app1 .maestro/` for iOS before pushing. If CI fails, download and inspect the `e2e-android-output` artifact.

The checked-in `.mcp.json` is Claude Code configuration for the Maestro and mobile-mcp servers; Codex configures MCP servers separately. The mobile-mcp version is pinned and should be bumped deliberately. Interactive Claude Code sessions ask once to approve project MCP servers. The `maestro` server requires the Maestro CLI and Java 17 or newer on `PATH`; where they are absent, including Linux CI boxes, it appears as a failed, unavailable server without affecting mobile-mcp. MobileBuildMCP is an optional macOS addition for Xcode build, run, and log access: `npx -y mobilebuildmcp@latest mcp`.

## Editor hook

For lint-target files, `.claude/settings.json` runs `yarn typecheck && yarn lint` after each successful Claude Code `Edit` or `Write` tool call and reports failures to the agent. The hook does not see changes made through Bash or external tools and adds about 8 seconds per edit, so `yarn verify` remains the authoritative gate. Agents without hooks, including Codex, run `yarn verify` before committing.

## Rules

- Never delete or skip tests, or update snapshots, merely to make CI pass.
- Every behavior change ships with a test.
- Do not change `newArchEnabled`, the react-native-track-player major version, or anything in `patches/` unless explicitly requested.
- Keep ESLint below 9 until the planned flat-config migration. React Native 0.81 provides only a legacy ESLint config.
- TypeScript `strict` is on. Do not weaken compiler options; fix the types.
- `test-renderer` must stay on the line that matches the installed React minor (1.1.x for React 19.1; see its docs/versioning.md). Bump it together with `react`, never alone.
- Native builds must stay secret-free. Sentry uploads happen only when `ios/sentry.properties` or `SENTRY_AUTH_TOKEN` exists; a token in `.xcode.env.local` must be paired with `SENTRY_DISABLE_AUTO_UPLOAD=false`. Never commit `sentry.properties`.
- Keep `Gemfile` and `Gemfile.lock` in sync; CI runs Bundler in deployment mode.
- Components that read MobX-State-Tree state during render are wrapped in `observer` from mobx-react-lite; never use `useObserver` (removed in v5). `test/setup.ts` calls `clearTimers()` in `afterEach` and fails any test that triggers a MobX warning; do not relax that with `configure()` or `isolateGlobalState`.
- `ios/Podfile.lock` must match `ios/Podfile`: after editing the Podfile, set its `PODFILE CHECKSUM` line to `sha1sum ios/Podfile` (or run `bundle exec pod install` on macOS). The `ios` CI job fails on any other lockfile drift.

## Known debt

- Player has no error UI and no buffering indicator distinct from the shared disabled control.
- Twenty stale Dependabot PRs from the React Native 0.63 era should be closed or recreated after CI is established.
