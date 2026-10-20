# Automated build & verification plan — svitle-radio-mobile

Goal: give both humans and LLM coding agents a fast, trustworthy feedback loop
before making functional changes to the app. Four milestones, each with an
exit criterion that must be met before the next starts.

Stack: GitHub Actions · TypeScript/ESLint/Prettier · Jest 30 + React Native
Testing Library · Maestro (Android emulator on PRs, iOS simulator nightly) ·
Maestro MCP + mobile-mcp for local agent use.

Out of scope for now (revisit only when a concrete need appears): Detox, Appium,
real-device clouds, native Espresso/XCUITest suites, release-signing
automation, mutation testing, New Architecture migration, audio-library
upgrade.

Repository facts this plan relies on (verify in M1, step 0):
React Native ^0.81, React 19.1, Node >=20, Yarn; TypeScript; Android flavours
`svitle` (com.svitleradio) and `svetloe` (org.svetloe), compileSdk/targetSdk 36,
minSdk 24; iOS workspace `ios/SvitleRadio.xcworkspace`, scheme `SvitleRadio`,
configurations `Svitle.Debug/Release`, `Svetloe.Debug/Release`, New Architecture
disabled in the Podfile; react-native-track-player v4 with `patches/`; Sentry
dSYM upload via `ios/sentry.properties`; Jest config split between
`package.json` and `jest.config.js`; `yarn lint` runs with `--fix`; two existing
tests (`api-problem.test.ts`, `storage.test.ts`); no `.github/workflows`.

---

## Milestone 1 — Fast local gate (≈ 1–2 days)

Everything an agent can run in under a minute, plus a Linux CI job that runs
the same thing. No native toolchains yet.

### Tasks

0. **Verify assumptions.** Record in this file: exact RN, ESLint, Jest and
   track-player versions from `package.json`; what `patches/` contains;
   whether `test/setup.ts` exists; what the 20 open PRs are (dependency bumps
   can be closed or re-run once CI exists).
1. **Consolidate Jest config.** Move the `jest` block from `package.json`
   into `jest.config.js` (preset `react-native`, `setupFiles`,
   `transformIgnorePatterns` for RN/track-player/navigation packages). Fix or
   delete the missing `test/setup.ts` reference. Confirm `yarn test` passes.
2. **Split lint scripts.** `lint` must not rewrite the checkout.
   ```json
   "typecheck": "tsc --noEmit -p .",
   "lint": "eslint index.js app",
   "lint:fix": "eslint index.js app --fix",
   "format:check": "prettier --check .",
   "format": "prettier --write .",
   "test": "jest",
   "test:ci": "jest --ci --maxWorkers=50%",
   "verify": "yarn typecheck && yarn lint && yarn format:check && yarn test:ci"
   ```
3. **ESLint flat config.** Replace `.eslintrc.js` with `eslint.config.js`
   using `@react-native/eslint-config/flat` and `eslint-config-prettier`.
   Fix or explicitly disable existing violations so the baseline is green.
   (If ESLint is pinned to 8.x and the migration is painful, defer to M4 but
   pin ESLint `<9` in `package.json` so an agent can't bump it blindly.)
4. **Testing library.** Add `@testing-library/react-native` (v14), remove
   `react-test-renderer`. Add manual mocks under `__mocks__/` for
   `react-native-track-player` (export `setupPlayer`, `add`, `play`, `pause`,
   `reset`, `getState`, `addEventListener`, `usePlaybackState`, and the
   `State`/`Event`/`Capability` enums as controllable `jest.fn()`s) and for
   any other native modules that fail to load under Jest (async-storage,
   navigation, Sentry).
5. **Extract pure logic.** Where stream selection, API response parsing and
   player state transitions live inside components, move them into plain
   TypeScript modules under `app/services` or `app/utils` so they can be
   tested without rendering.
6. **Write the first tests** (target 10–20):
   - `app/utils/retry.ts` — backoff and give-up behaviour with fake timers
   - API parsing / `api-problem` — malformed and empty responses
   - preferences / `main-store` — persisted state round-trips
   - `player.tsx` — pressing Play calls `TrackPlayer.play`; playback error
     state renders the retry UI; metadata is rendered from mocked API data
   - `timer.tsx` — sleep-timer countdown and expiry with fake timers
7. **`AGENTS.md`** at the repo root (and a one-line `CLAUDE.md` pointing to
   it) containing: how to install, `yarn verify`, how to run a single test,
   how to build each platform, how to run Maestro, and rules:
   - never delete or skip tests, or update snapshots, to make CI pass
   - every behaviour change ships with a test
   - do not change `newArchEnabled`, the track-player major version, or
     anything in `patches/` unless the task explicitly asks for it
8. **CI: `.github/workflows/ci.yml`, job `quality`** on `ubuntu-latest`:
   checkout → `actions/setup-node` (Node 22, `cache: yarn`) →
   `yarn install --frozen-lockfile` → `yarn verify`. Add top-level
   `concurrency` with `cancel-in-progress: true` and `permissions:
   contents: read`. Pin third-party actions to a major tag at minimum.
9. **Branch protection** on `master`: require `quality`.

### Exit criterion
`yarn verify` is green locally and in CI in under 60 s, a PR from a fork runs
it with no secrets, and an agent given `AGENTS.md` can run it unprompted.

---

## Milestone 2 — Native builds in CI (≈ 1–2 days)

Prove both platforms compile on every PR, producing the exact binaries M3
will test. Still no secrets.

### Tasks

1. **Android `e2e` build type** in `android/app/build.gradle`: `initWith
   release`, `signingConfig signingConfigs.debug`, `matchingFallbacks =
   ["release"]`, so JS is bundled and no Metro is needed. Set
   `react { debuggableVariants = ["svitleDebug", "svetloeDebug"] }` so the RN
   Gradle plugin bundles JS for the `e2e` variants.
2. **Job `android`** on `ubuntu-latest`: setup-node (yarn cache) →
   `actions/setup-java` (Temurin 17) → `gradle/actions/setup-gradle` →
   `yarn install --frozen-lockfile` → `./gradlew :app:assembleSvitleDebug
   :app:assembleSvetloeDebug :app:assembleSvitleE2e --build-cache` →
   upload `app-svitle-e2e.apk` as an artifact (14-day retention).
3. **iOS: make the build secret-free.** Guard the Sentry upload build phase
   so it is skipped when `SENTRY_AUTH_TOKEN` is unset (e.g. wrap the script
   in `if [ -n "$SENTRY_AUTH_TOKEN" ]`), or set `SENTRY_DISABLE_AUTO_UPLOAD=true`
   in CI. Confirm `bundle exec pod install` succeeds from a clean clone.
4. **Job `ios`** on `macos-latest` (pin to a named image, e.g. `macos-26`,
   once it is known to work; never let `-latest` move the Xcode version
   silently): setup-node → `ruby/setup-ruby` with `bundler-cache: true` →
   cache `ios/Pods` keyed on `Podfile.lock` → `bundle exec pod install` →
   ```bash
   xcodebuild -workspace ios/SvitleRadio.xcworkspace \
     -scheme SvitleRadio -configuration Svitle.Release \
     -sdk iphonesimulator -derivedDataPath ios/build \
     CODE_SIGNING_ALLOWED=NO build
   ```
   → upload `SvitleRadio.app` (zipped) as an artifact. Optionally add a
   second, non-blocking step that compiles `Svetloe.Release`.
5. Add `android` and `ios` to branch protection. Measure wall-clock time;
   add DerivedData caching only if the iOS job dominates.

### Exit criterion
Every PR produces an installable `svitle` e2e APK and a simulator `.app`
without any secrets, with the iOS job reliably under ~20 minutes.

---

## Milestone 3 — On-device smoke tests with Maestro (≈ 2–3 days)

Catch "it builds but doesn't work" — the failure mode static checks and unit
tests cannot see.

### Tasks

1. **Stable identifiers.** Add `testID`s (which Maestro matches on both
   platforms) to the controls the flows need: `player.play`, `player.pause`,
   `player.buffering`, `player.error`, `nav.live`, `nav.streams`,
   `nav.contacts`, `streams.item.<id>`, `timer.open`, `timer.set`. Do not
   match on visible text — the app is localised (uk/ru).
2. **Flows in `.maestro/`**, each starting from `launchApp` with
   `clearState: true`, each < 60 s, each asserting UI state only (never
   live metadata text):
   - `01-launch.yaml` — app launches, Live screen and play control visible
   - `02-play-pause.yaml` — tap play → pause control appears within 30 s
     (`extendedWaitUntil`) → tap pause → play control returns
   - `03-navigation.yaml` — Live → Streams → Contacts → Live
   - `04-background.yaml` — start playback, `pressKey: Home`, relaunch
     without clearing state, player still shows playing/pause state
   - `05-timer.yaml` — set the sleep timer, assert it displays
   Example:
   ```yaml
   appId: com.svitleradio
   ---
   - launchApp:
       clearState: true
   - assertVisible:
       id: "player.play"
   - tapOn:
       id: "player.play"
   - extendedWaitUntil:
       visible:
         id: "player.pause"
       timeout: 30000
   - tapOn:
       id: "player.pause"
   - assertVisible:
       id: "player.play"
   ```
3. **Job `e2e-android`** on `ubuntu-latest`, `needs: android`, downloads the
   e2e APK artifact, installs Maestro (`curl -fsSL
   https://get.maestro.mobile.dev | bash`, Java 17), enables KVM (the udev
   rule step from the android-emulator-runner README), then
   `reactivecircus/android-emulator-runner@v2` with API 36 (fall back to 35
   if boot is unreliable), `google_apis`, x86_64,
   `emulator-options: -no-window -gpu swiftshader_indirect -noaudio
   -no-boot-anim`, AVD snapshot cached on `~/.android/avd/*`, and `script:`
   ```bash
   adb install app-svitle-e2e.apk
   maestro test --format junit --output maestro-report.xml .maestro/
   adb shell dumpsys media_session > media_session.txt
   ```
   Upload `~/.maestro/tests`, `maestro-report.xml`, `media_session.txt` and
   `adb logcat -d` on failure. Allow exactly one job-level retry and label
   it as such; do not silently absorb flakes.
4. **Playback evidence.** After `02-play-pause`, grep `media_session.txt`
   for `state=PLAYING` (or the equivalent `dumpsys audio` output) and fail
   the job if absent — this proves audio actually started even with
   `-noaudio`.
5. **Job `e2e-ios`** on `macos-latest`, `needs: ios`: download the `.app`,
   `xcrun simctl boot "iPhone 16"`, `xcrun simctl install booted
   SvitleRadio.app`, run the same flows (`appId` must match the iOS bundle
   id — use a Maestro `env` or a second `appId` file). Trigger on
   `schedule` (nightly) and on the PR label `run-ios-e2e`, not on every
   PR, until it has run clean for two weeks.
6. **Stream health, `.github/workflows/stream-health.yml`** on a schedule
   (e.g. every 6 h): `curl -sI` each stream URL and the metadata API,
   assert HTTP 200 and an `audio/*` content-type on streams. Separates
   "server is down" from "app is broken" when E2E fails.
7. Add `e2e-android` to branch protection once it has passed on ~10
   consecutive PRs. If it flakes, first lengthen `extendedWaitUntil`, then
   consider an `E2E=1` launch argument that points the app at a local
   `mock-stream.mp3` served from the test job — only then.

### Exit criterion
Every PR runs five Maestro flows on an Android emulator in ≈ 10–15 minutes
with a flake rate low enough to be a required check; iOS flows pass nightly;
a deliberate breakage (e.g. wrong stream URL) fails `02-play-pause`.

---

## Milestone 4 — Agent loop and hardening (≈ 1 day, then ongoing)

Make the agent fast locally and the CI robust enough to trust unattended.

### Tasks

1. **Local agent tooling (macOS).**
   - `claude mcp add maestro -- maestro mcp` (Maestro CLI ≥ the version
     that ships `mcp`)
   - `claude mcp add mobile-mcp -- npx -y @mobilenext/mobile-mcp@latest`
   - optionally XcodeBuildMCP for build/run/log access on the simulator
   Document in `AGENTS.md` the workflow: explore the change on a simulator
   via MCP → save the working steps as a flow under `.maestro/` → run
   `maestro test` locally → push → read CI artifacts on failure.
2. **Claude Code hook** (`.claude/settings.json`): run `yarn typecheck &&
   yarn lint` after edits to `app/**`, so type/lint errors surface before
   the agent even commits.
3. **Dependency guardrails.** Dependabot or Renovate limited to patch/minor
   with CI required; pin `react-native-track-player` and `react-native` to
   exact versions with a comment pointing at the upgrade decision below.
   Final state: not done by decision; the existing action versions remain unchanged.
4. **Flake telemetry.** Upload JUnit reports from Jest and Maestro to a
   test-reporter action; review weekly; quarantine only with an owner,
   reason and expiry date recorded in the flow file.
5. **Optional, only if wanted:**
   - nightly Firebase Test Lab Robo crawl of the e2e APK (free quota)
   - signed release workflow on `v*` tags using a protected `production`
     environment (Android upload keystore as a base64 secret → Gradle
     `-PSVITLE_RELEASE_*`; iOS ephemeral keychain) — verify existing Play
     signing fingerprints and Apple provisioning first; never touch keys
     as part of CI setup
   - StrykerJS mutation run, nightly, scoped to `app/utils` and
     `app/services`

### Exit criterion
An agent can take a task from `AGENTS.md`, verify locally in < 1 minute,
check its own UI change on a simulator, open a PR, and read a failing
Maestro artifact and fix it — without a human running anything by hand.

---

## After the plan: the first real change

With M1–M3 green, the first agent-driven functional task should be the
decision this CI exists to de-risk: **React Native upgrade + audio library**.
Options to evaluate in a spike PR each, judged by the full pipeline:
(a) stay on RN 0.81 with patched track-player 4.1.2, (b) RN 0.87 + New
Architecture + `@rntp/player` v5 (check licence applicability for the
station), (c) RN 0.87 + `expo-audio` via Expo modules. Do not let an agent
attempt this before `e2e-android` is a required check.

---

## M1 step 0 findings

- Resolved versions are React Native 0.81.5, React 19.1.0, Jest 29.7.x, Babel Jest 29.x, ESLint 8.57.1, TypeScript 5.8.x, Prettier 2.8.8, and react-native-track-player 4.1.2. Node 22.13 or newer is required (RNTL 14 engines); CI uses Node 22. Yarn Classic is pinned with `packageManager`.
- `patches/` contains only `react-native-track-player+4.1.2.patch`, adding Android null-safety around `getTrack` and `getActiveTrack`.
- Before M1 there was no `test/setup.ts`, `test/`, or `storybook/`, although the old scripts referenced them.
- All 20 open PRs are stale Dependabot updates against `master` from the React Native 0.63 era (2021–2023). They should be closed or recreated after CI exists.
- The baseline had conflicting Jest and Prettier configuration, missing React Native TypeScript and ESLint configs, 7 non-strict TypeScript errors, 19 ESLint errors and 32 warnings, and 35 files outside the selected Prettier style.
- React Navigation remains mismatched: native and bottom-tabs are v7, while native-stack is v6.
- `@react-native/eslint-config@0.81.5` has no flat config and peers with ESLint 8, so M1 uses the legacy config and pins ESLint below 9.
- React Native Testing Library 14 requires awaited `render()` and `screen.rerender()` calls. Track-player must be mocked for Jest.
- Known application debt includes hooks called after early returns or from ordinary helpers, and missing top-level player accessibility-label translation keys.
- Repository Actions settings and branch protection could not be changed with the available token (HTTP 403). Require the `quality` check on both `main` and `master`; the user must configure this in GitHub.

## Milestone 1 status

Implemented the fast local gate: consolidated configuration, pinned and reconciled tooling dependencies, regenerated the lockfile once, made TypeScript/ESLint/Prettier green, added native-module mocks and behavior-focused tests, documented contributor rules, and added the Linux `quality` workflow. The navigator type workaround includes behavior-neutral `id={undefined}` because TypeScript with `strict: false` otherwise treats the `undefined` navigator ID as requiring the property.

ESLint remains on 8.x with legacy configuration because the React Native 0.81 package has no flat export. Jest remains on 29 because that is the React Native 0.81 preset's supported major. TypeScript strict mode is deferred; it currently exposes 29 errors.

## Deviations from the M1 test examples

The application has no playback-error retry UI and no sleep timer: `timer.tsx` schedules stream-information refreshes. Those two example tests were replaced with tests for the behavior that exists. Adding either feature would change runtime behavior and is outside M1.

The plan's type-only bottom-tab generic does not by itself compile with `strict: false`, because `undefined extends string` evaluates as true in that mode. The behavior-neutral `id={undefined}` prop is therefore included. The lockfile was regenerated exactly once by the coordinator after the implementation environment could not reach the package registry.

## M2 step 0 findings

- Android uses React Native 0.81.5 with Android Gradle Plugin 8.11.0, Kotlin 2.1.20, Gradle 8.14.3, JDK 17, SDK 36, NDK 28.0.12433566, Hermes enabled, and the New Architecture disabled. Its `svitle` and `svetloe` flavours previously failed to match the React Native Gradle plugin's default debuggable variant names, so debug builds unnecessarily bundled JS.
- Android release signing is conditional on `SVITLE_RELEASE_*` properties, while the committed debug keystore can safely sign the release-like e2e variant. No Sentry Gradle plugin is applied.
- The iOS workspace has one native target and the shared `SvitleRadio` scheme, with only `Svitle.Debug` and `Svitle.Release` configurations. The Podfile's named Svetloe configurations do not exist. The `SvitleRadio-tvOS` scheme and the `SvitleRadioTests` scheme reference are stale.
- React Native 0.81.5 requires Xcode 16.1 or newer. The project targets iOS 15.1, uses bundle identifier `org.svitle.app1`, and has two Sentry script phases that honour `SENTRY_DISABLE_AUTO_UPLOAD`.
- A clean clone has no `ios/sentry.properties`. Because `.xcode.env` and then `.xcode.env.local` are sourced by the Sentry wrapper, the versioned environment file can disable uploads when neither a properties file nor token exists while still allowing an explicit local override.
- `Gemfile.lock` resolves CocoaPods 1.15.2, Ruby 3.4.7, Bundler 2.7.2, and `nkf` 0.2.0, but `Gemfile` did not declare `nkf`; Bundler deployment mode therefore rejected the locked bundle. `Podfile.lock` records CocoaPods 1.16.2 because the old postinstall hook ran an unpinned system `pod install` on macOS.
- The pinned CI environment is `macos-15` on Apple silicon with Xcode 16.4. The image includes xcbeautify, and an arm64-only simulator build avoids compiling an unused x86_64 slice.
- Repository Actions settings and branch protection could not be changed with the available token (HTTP 403). The user must require `android` and `ios` on both `main` and `master`.
- The local VM has no JDK, Android SDK, Ruby, or Xcode, so native build validation awaits CI.

## Milestone 2 status

Implemented the release-like, debug-signed Android e2e build and the independent Android and iOS native-build jobs. The jobs verify the installable artifacts and upload `app-svitle-e2e` and `SvitleRadio-simulator` with 14-day retention. The iOS build is secret-free for clean clones, uses the locked Ruby toolchain, and checks Podfile.lock drift. Native compilation and the artifact exit criteria were verified by the first green CI run recorded below.

Measured durations on the first green PR run (2026-10-19, run 39328212556): `quality` 44 s; `android` 8 min 27 s wall-clock, of which Gradle 7 min 30 s with a cold dependency cache and the pinned NDK install 22 s; `ios` 11 min 54 s wall-clock, of which `xcodebuild` 9 min 58 s with the Pods cache warm (`bundle exec pod install` 20 s). Artifacts: `app-svitle-e2e` 28.4 MB, `SvitleRadio-simulator` 7.8 MB. iOS is under the ~20 min target, so DerivedData caching stays deferred. The Podfile.lock drift hypothesis held: after `bundle exec pod install` with the locked CocoaPods 1.15.2 only the `COCOAPODS:` line differed.

## Deviations from M2

1. The optional `Svetloe.Release` iOS compile was dropped because the Xcode project has no Svetloe build configurations; adding them is out of scope.
2. Setting `debuggableVariants` changes local flavoured debug builds so they no longer bundle JS and instead use Metro, which is the React Native plugin's intended debug behaviour.
3. iOS is pinned to `macos-15` and Xcode 16.4 rather than macOS 26 because React Native 0.81 requires Xcode 16.1 or newer and is being kept on the established 16.x toolchain; the image and Xcode version must move deliberately.
4. The implementation also removed the implicit, unpinned macOS `pod install` from `bin/postInstall` and declared the already-locked `nkf` dependency in `Gemfile` so Bundler deployment mode is reproducible.
5. Requiring the `android` and `ios` checks on `main` and `master` remains a user action because the available token receives HTTP 403 for branch-protection settings.
6. Two facts surfaced only in CI and are now handled in the workflow and build file: the ubuntu image ships NDK 27.3, so the job installs the NDK version pinned in `android/build.gradle`; and the React Native Gradle plugin fills the `usesCleartextTraffic` manifest placeholder for `debug` and `release` only (in a `finalizeDsl` hook that runs after `initWith`), so the `e2e` build type sets it explicitly. DerivedData caching remains deferred; iOS is under the target.

## M3 step 0 findings

- The initial tab is Streams and navigation state is persisted. Clearing app state reliably starts on Streams, so every flow waits for the selected `svitle` station before mounting Live.
- The player has one enabled control whose state is play or pause, and one disabled rendering shared by missing URL, buffering, and loading. Error renders an enabled play control; there is no separate error UI.
- Streams are HLS playlists rather than direct `audio/*` responses. Playback evidence must sample the Android media session during the run because the flows stop playback before completing.
- Android uses app ID `com.svitleradio`; iOS uses `org.svitle.app1`. The shared flows therefore receive `APP_ID` through Maestro environment substitution.
- Scheduled and manually dispatched workflows are unavailable until their workflow files reach the repository default branch, `master`.
- The local VM has no Android emulator or Xcode, so on-device and native workflow validation awaits CI.

## Milestone 3 status

Implemented stable UI IDs, five shared Maestro flows, Android and iOS E2E jobs, sampled Android
playback evidence, and scheduled HLS stream-health checks. Android runs on every PR with one visible
retry; iOS runs nightly, by manual dispatch, or for PRs labeled `run-ios-e2e`. On-device validation
and the exit criteria were verified on the first green CI run and the deliberate-breakage run recorded below.

Measured durations on the first green PR run (2026-10-20, run 39388089627): `e2e-android` 4 min 20 s wall-clock, of which AVD snapshot creation 1 min 48 s (cache miss; a later run restored the snapshot from cache in 20 s and booted in about 10 s) and the Maestro step 2 min 6 s. Per-flow times from the JUnit report: `01-launch` 7.7 s, `02-play-pause` 16.0 s, `03-navigation` 14.8 s, `04-background` 13.8 s, `05-switch-station` 27.0 s; suite 79.4 s. No retry was needed. The media-session sampler recorded `state=PLAYING(3)` in 11 samples. Emulator: API 36, google_apis, x86_64, `pixel_6` profile on `ubuntu-latest` with KVM. End to end, a PR gets its Android smoke result about 9 minutes after push (android build with warm cache ~3 min 20 s, then e2e-android). A second green run (39391307451, snapshot restored from cache) took 4 min 28 s with per-flow times 10.0 / 21.0 / 15.9 / 16.7 / 35.9 s.

`e2e-ios` on the first labelled run (39391307451): 8 min 12 s wall-clock after the 12 min `ios` job; simulator create, boot and install 3 min 23 s; Maestro step 4 min 15 s. Per-flow times: `01-launch` 21.6 s, `02-play-pause` 16.6 s, `03-navigation` 33.7 s, `04-background` 60.7 s, `05-switch-station` 22.7 s; suite 155 s. All five passed on the first attempt; the iOS simulator is slower than the Android emulator and the background flow sits at the 60 s target, so that is the first flow to watch for flakes.

Deliberate-breakage run: a throwaway commit (470230c, never merged) appended `.broken` to every stream URL in `convertStreamInfo`. Run 39389764784 (https://github.com/knyar/svitle-radio-mobile/actions/runs/39389764784): `01-launch` and `03-navigation` still passed, while `02-play-pause`, `04-background` and `05-switch-station` failed with "id: player.pause is visible" on both attempts; the retry fired once with its warning annotation; the sampler saw no PLAYING state in either attempt and the evidence check failed as well. `quality` also failed, because the API unit test pins the parsed URLs. The commit was then removed from the branch by force-push.

## Deviations from M3

1. The timer flow was replaced by a switch-station flow because the app has no sleep timer; `timer.tsx` refreshes stream information.
2. The proposed `player.buffering` and `player.error` IDs are folded into `player.disabled` because the app has one disabled presentation and Error renders the Play control.
3. `screen.*` IDs were added so navigation flows can assert destinations without matching localised text.
4. Stream health validates each HLS playlist and a bounded media-segment response because stream URLs return playlists, not `audio/*` bodies.
5. Android playback evidence is sampled throughout the run instead of captured afterward because the flows intentionally stop playback.
6. Schedule and `workflow_dispatch` triggers require the workflows on default branch `master`; changing the default branch remains a user decision.
7. iOS has no M3 playback-evidence check equivalent to Android `dumpsys`; the visible pause state is its playback assertion.
8. Making `e2e-android` a required check remains a user action after about 10 consecutive clean PRs; passes after retry do not count as clean.
9. The deliberate-breakage run is recorded above under "Milestone 3 status".
10. Linux jobs are pinned to `ubuntu-24.04`: the first M3 runs carried GitHub's notice that `ubuntu-latest` migrates to Ubuntu 26 from 2026-10-19, which would silently change the JDK, Android SDK and emulator stack under the jobs.
11. Maestro's `--debug-output` directory came back empty in every run until round 2 (PR #41, 2026-10-20) found the cause: Maestro writes to `<dir>/.maestro/tests/<timestamp>/`, a dot-directory, and `actions/upload-artifact` skips dot-directories by default. The runners now pass `--flatten-debug-output` and `--test-output-dir`, and the artifact carries `maestro/maestro.log` plus one folder per flow with `commands.json`, `logs/maestro.log`, the device log (`device-logcat.txt` on Android; `device-simulator.log` and `device-xctest.log` on iOS) and failure screenshots.

## M4 step 0 findings

- Maestro provides a stdio MCP server through `maestro mcp`, with device inspection, screenshots, and inline or file-based flow execution. It requires the Maestro CLI and Java 17 or newer on `PATH`.
- `@mobilenext/mobile-mcp` 1.0.12 drives simulators, emulators, and physical devices. The checked-in executable configuration pins that version so upgrades are deliberate.
- Claude Code project MCP servers belong in `.mcp.json`; interactive sessions ask for approval once. A missing server command makes only that server unavailable.
- Claude Code `PostToolUse` hooks receive JSON on stdin and can return exit 2 to surface a blocking error after an edit. Node is available in this repository, while `jq` is not guaranteed on macOS.
- The local typecheck and lint take about 8 seconds together. Codex has no equivalent editor hook, so the full verification gate remains required.
- PR #38 is merged, but the workflows are not yet on the default `master` branch, so schedules and manual dispatch are not active there.

## Milestone 4 status

Points 1 and 2 are implemented. The checked-in `.mcp.json` gives Claude Code sessions consistent Maestro and pinned mobile-mcp server definitions, while `AGENTS.md` documents the simulator-to-flow-to-CI agent loop and the optional MobileBuildMCP command. `.claude/settings.json` and `scripts/claude-post-edit.sh` run typecheck and lint after Claude Code edits to lint targets, report failures with exit 2, ignore unrelated and out-of-worktree paths, and remain silent on success.

The hook was verified with synthetic `PostToolUse` payloads: a valid `app/` edit ran both checks silently and passed, a README edit returned immediately, and an intentionally invalid temporary TypeScript file produced the expected compiler error and exit 2 before being removed. The settings file is picked up by Claude Code sessions started after it exists; live firing remains for the user's next session to observe.

## Not done, by decision

3. **Dependency guardrails.** This would add Dependabot or Renovate configuration limited to patch/minor updates with required CI, plus exact React Native and react-native-track-player pins.
4. **Flake telemetry.** This would upload Jest and Maestro JUnit output through a test-reporter action for weekly review.
5. **Optional, only if wanted.** Firebase Test Lab crawling, signed release automation, and a scoped Stryker mutation run remain optional future work.

## CI effort: final state (2026-10-20)

| Check           | When it runs                                        | Artifact or evidence                                                              | Measured duration                                          |
| --------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `quality`       | Every PR                                            | Typecheck, lint, formatting, and Jest result                                      | 44 s                                                       |
| `android`       | Every PR                                            | `app-svitle-e2e` (14 days)                                                        | 8 min 27 s cold; about 3 min 20 s warm                     |
| `ios`           | Every PR                                            | `SvitleRadio-simulator` (14 days)                                                 | 11 min 54 s                                                |
| `e2e-android`   | Every PR, after `android`                           | `e2e-android-output`: JUnit report, logcat, sampled media-session evidence, Maestro debug output (flattened)                 | 4 min 20–28 s; Android smoke result about 9 min after push |
| `e2e-ios`       | PR label `run-ios-e2e`, nightly, or manual dispatch | Maestro result for the simulator app                                              | 8 min 12 s after `ios`                                     |
| `stream-health` | Every six hours and manual dispatch                 | HLS playlist, segment, and metadata health result                                 | Not measured                                               |

Milestone 1's exit criterion is met: the fast local and Linux CI gate is green and completes in under a minute. Milestone 2's exit criterion is met: both native builds compile, verify, and publish installable artifacts within their targets. Milestone 3 is technically complete: all five flows, Android playback evidence, iOS execution, artifacts, retry behavior, and deliberate-breakage validation are proven. Its operational exit criterion—making `e2e-android` required after enough clean runs and running iOS nightly—remains pending the user actions below. Milestone 4 points 1 and 2 are done; points 3–5 are not done by decision. The implementation effort is closed.

Open user actions:

1. Configure branch protection to require `quality`, `android`, and `ios` now, then require `e2e-android` after about 10 consecutive clean PR runs.
2. Get the workflow files onto the default `master` branch so schedules and manual dispatch work.
3. Close or recreate the 20 stale Dependabot PRs from the React Native 0.63 era.
4. Approve the checked-in project MCP servers once in an interactive Claude Code session.
5. After the plan, evaluate the React Native and audio-library options in spike PRs, but do not begin until `e2e-android` is a required check.

Post-close-out finding (2026-10-20, run 39439776888): the Maestro installer download was cut mid-transfer ("Connection reset by peer") and the `curl | bash` step still passed, so both e2e attempts failed with `maestro: command not found`. `scripts/install-maestro.sh` now retries the download and fails the step unless `maestro --version` runs. This is the first flake on record and it was infrastructure, not the flows; it counts as a non-clean run.

Second non-clean run (2026-10-20, run 39442207269): the first Maestro attempt failed on the first flow executed after the emulator boot (`05-switch-station`, 9 s, Maestro reported "Unknown error"); the other four flows passed and logcat shows no app crash, which is consistent with a Maestro/emulator start-up race rather than the app (not confirmed; no Maestro log was captured at the time). The retry passed all five flows. At the time it looked as if Maestro 2.11 wrote nothing to `--debug-output` even on a failure (round 2 found the real cause, see deviation 11), so the artifact consists of the JUnit report, logcat and the media-session samples; a Maestro warm-up step or `maestro --verbose` are the next things to try if this recurs. Flake tally for the "10 consecutive clean PRs" rule: PR #38 clean on all runs; PR #39 two non-clean runs.

## Round 2: e2e flakes and diagnostics (2026-10-20, PR #41)

Third non-clean `e2e-android` run (PR #40, run 39467156384): `01-launch`, the first flow after the emulator boot, failed in 6 s with "Unknown error"; the other four flows passed, playback was observed, logcat shows no app crash, the retry passed. Same pattern as the second non-clean run. `e2e-ios` failed once before any flow (PR #40 fix commit, run 39471300088 attempt 1) with Maestro's `IOSDriverTimeoutException` at the 120 s default budget; the re-run passed.

PR #41 sets `MAESTRO_DRIVER_STARTUP_TIMEOUT` to 60 s on Android (default 15 s) and 240 s on iOS (default 120 s), makes Maestro's own output reach the artifacts (deviation 11), and names the failed flows in the retry warning. A driver warm-up or emulator settle step was deliberately deferred: Maestro reinstalls its driver on every invocation, so a separate warm-up cannot pre-start the driver the suite uses, and the Android cause is still inference until a first-flow failure happens with the new logs. First run with the change (run 39485356100): all five jobs green, `e2e-android` clean (no retry, 5 min 19 s), `e2e-ios` 10 min 53 s.

Fourth non-clean run (PR #42, run 39488591116, branch without this PR): first flow `05-switch-station`, 9.9 s, "Unknown error", no crash, retry passed. Fifth non-clean run (this PR, run 39489256984) is the first with Maestro's own log, and it names the cause: `CommandFailed: Command failed (host:transport:emulator-5554): device offline` followed by `DeviceServerDiedException … StatusRuntimeException: UNAVAILABLE` 17.4 s into the driver connection, during the first flow's `launchApp`. The emulator-runner's own boot check had already logged a transient `adb: device offline` right after the snapshot load in earlier runs. So the first-flow failure is an adb transport flap after snapshot restore, not the app and not the driver startup budget. `scripts/e2e-android.sh` now waits until adb reports the device online for 20 consecutive seconds before installing (logged to `device-ready.log`, with a warning annotation when a flap was observed) and then runs a throwaway warm-up launch through the same launchApp path before the suite (`warmup.log`, `warmup/`; its outcome is annotated but never fatal). In that run the drop happened about a minute after boot, during the first flow's `pm clear`, so the warm-up is what absorbs a first-use flap; the stability wait documents the transport's state before the suite. Flake tally for the "ten consecutive clean PR runs" criterion: non-clean runs on PR #39 (2), PR #40 (1), PR #42 (1), PR #41 (1); the count restarts after the stability wait lands.

