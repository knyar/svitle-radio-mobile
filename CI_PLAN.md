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
