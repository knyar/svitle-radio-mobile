## Svitle Radio

This is a mobile app for [Svitle Radio](https://svitle.org/), a Christian radio
station in Kyiv, Ukraine.

Written in React Native, it supports both iOS and Android and uses a simple JSON
API to discover station metadata.

JSON API is also open source, available [here](https://github.com/knyar/svitle-api)

## Prerequisites

The commands below assume macOS with [Homebrew](https://brew.sh/). Linux works for the JavaScript
checks and the Android build; iOS needs a Mac.

```sh
brew install node watchman yarn
```

- Node 22.13 or newer (Node 24 and later also work). Homebrew's `node` no longer bundles Corepack,
  so `corepack enable` is not available out of the box; the `yarn` formula installs Yarn Classic
  1.22.22, which is the version this repository pins. If you prefer Corepack, run
  `brew install corepack && corepack enable` instead of installing `yarn` (the two formulas
  conflict).
- Ruby 3.4 with Bundler, for CocoaPods (iOS only). The lockfile was resolved with Ruby 3.4 and
  Bundler 2.7.2, which is what CI uses; the macOS system Ruby (2.6) is too old and fails with
  "Could not find 'bundler' (2.7.2)". Homebrew's plain `ruby` formula is already Ruby 4, so install
  the versioned formula and put it first on your `PATH`:

  ```sh
  brew install ruby@3.4
  echo 'export PATH="$(brew --prefix ruby@3.4)/bin:$PATH"' >> ~/.zshrc && exec zsh
  ruby --version   # ruby 3.4.x
  ```

  rbenv, rvm, or mise with a 3.4.x release work just as well. `bundle install` switches to Bundler
  2.7.2 on its own; if it does not, run `gem install bundler:2.7.2` first.

- Xcode 27 (iOS only). CI pins Xcode 27.0 and the project carries the workarounds React
  Native 0.81 needs for it: the Podfile raises every pod to iOS 15.1 and disables `consteval` in
  the bundled fmt 11 headers, and the app adopts the UIScene life cycle that the iOS 27 SDK
  requires at launch. Xcode 26.x should still work but is no longer what CI tests.
- Android Studio with the Android SDK, platform 36, and a JDK 17 (Android only). Gradle installs
  the pinned NDK itself.
- [Maestro](https://maestro.mobile.dev/) and Java 17 or newer, only if you want to run the
  end-to-end flows locally.

## Install

```sh
yarn install --frozen-lockfile
bundle install                       # iOS only
cd ios && bundle exec pod install && cd ..   # iOS only
```

`yarn install` does not run `pod install`. Run `bundle exec pod install` again after adding or
upgrading a native dependency.

## Run

```sh
yarn start                 # Metro, in one terminal
yarn run-svitle-ios        # Svitle on the iOS simulator
yarn run-svitle-android    # Svitle on an Android emulator
yarn run-svetloe-android   # Svetloe on an Android emulator
```

With no simulator booted, `run-ios` launches the first one Xcode lists, which may be an unusual
device; boot the one you want first or pass `--simulator "iPhone 17"`. Let `run-ios` start Metro,
or make sure yours is on port 8081, because the app is built for the port the CLI chose.

To work in Xcode: `open ios/SvitleRadio.xcworkspace`.

## Verify

`yarn verify` is the fast gate that CI runs on every pull request. It runs, in order:

- `yarn typecheck`, TypeScript without emitting files
- `yarn lint`, ESLint with zero warnings allowed and no file rewriting
- `yarn format:check`, Prettier validation
- `yarn test:ci`, Jest in CI mode

Use `yarn lint:fix` and `yarn format` to apply automatic fixes. Run one test file with
`yarn test app/utils/retry.test.ts`, or one test by name with
`yarn test -t "retries after a rejection"`.

## End-to-end tests

The Maestro flows in `.maestro/` launch the app, play and pause, navigate, background the app, and
switch stations. They use the hermetic API and HLS fixtures in `scripts/e2e-api`, which the platform
scripts start on fixed port 8484, and need a release-like build with the JavaScript bundle included.

Android, with an emulator running:

```sh
cd android && ./gradlew :app:assembleSvitleE2e && cd ..
scripts/e2e-android.sh android/app/build/outputs/apk/svitle/e2e/app-svitle-e2e.apk
```

The e2e APK has `http://10.0.2.2:8484/v2` baked in; `10.0.2.2` is the Android emulator's route to
the host loopback interface.

The script waits for the emulator to settle, installs the APK, runs a warm-up launch and then the
flows, and writes logs and screenshots to `e2e-output/`.

iOS, with a simulator booted:

```sh
xcodebuild -workspace ios/SvitleRadio.xcworkspace -scheme SvitleRadio -configuration Release \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/build \
  CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ARCHS=arm64 COMPILER_INDEX_STORE_ENABLE=NO \
  API_URL=http://127.0.0.1:8484/v2 build
xcrun simctl install booted ios/build/Build/Products/Release-iphonesimulator/SvitleRadio.app
scripts/e2e-ios.sh e2e-output
```

Port 8484 is fixed because each e2e artifact embeds its platform-specific URL. Changing the port
requires updating the native build configuration and rebuilding the app.

### Screenshots at several screen sizes

To check a layout across phone classes without a device per class, resize one emulator:

```sh
scripts/screenshot-sizes.sh android/app/build/outputs/apk/svitle/e2e/app-svitle-e2e.apk e2e-output/sizes
```

The script runs `.maestro/screenshots/screens.yaml` once per profile, setting the display with
`adb shell wm size` and `wm density`, and writes `<out>/<profile>/{streams,live,contacts}.png` plus
a `<out>/<screen>.png` contact sheet when ImageMagick is installed. The defaults cover a 360x640 dp
phone, the Pixel 6, a Pro Max class phone, a Surface Duo screen, and an 800x1280 dp tablet; pass
`name:WxH:dpi` arguments to choose others. Notches and safe-area insets are not emulated. CI runs
the same sweep at the end of `e2e-android`, so every pull request's `e2e-android-output` artifact
carries a `sizes/` gallery.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request:

- `quality` runs `yarn verify`.
- `android` builds the debug and e2e variants and uploads the `app-svitle-e2e` APK.
- `ios` builds the simulator app and uploads it as `SvitleRadio-simulator`.
- `e2e-android` runs the Maestro flows on an emulator against the uploaded APK and uploads
  `e2e-android-output` with the JUnit report, logcat, and Maestro's own logs and screenshots. A
  failed first attempt is retried once and shows up as a warning.
- `e2e-ios` runs the flows on a simulator nightly, on manual dispatch, or when a pull request
  carries the `run-ios-e2e` label.

`.github/workflows/stream-health.yml` checks the HLS streams and metadata every six hours.

Download an artifact with `gh run download <run-id> -n <artifact-name>`. The history of how this
pipeline was built, including the flakes seen so far, is in [CI_PLAN.md](CI_PLAN.md).

## Release

Android:

- Make sure `~/.gradle/gradle.properties` exists and defines the signing keystore (see
  `~/.private/android/`).
- `yarn release-svitle-android` or `yarn release-svetloe-android` builds the AAB into
  `android/app/build/outputs/bundle/<flavor>Release/`.
- `yarn build-svitle-android` builds a release APK instead.

iOS releases are archived from Xcode with the `SvitleRadio` scheme.

### Sentry

If `bundle install` fails compiling native extensions with "unknown architecture" linker errors,
your Command Line Tools and SDK are mismatched, usually a beta toolchain; select Xcode with
`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` and retry.

Builds work without Sentry credentials: the Xcode script phases skip symbol and source-map uploads
when neither `ios/sentry.properties` nor `SENTRY_AUTH_TOKEN` is present. To upload, copy
`ios/sentry.properties.tpl` to `ios/sentry.properties` (ignored by git) and fill in the
organisation, project, and token. A token exported from `.xcode.env.local` must be paired with
`export SENTRY_DISABLE_AUTO_UPLOAD=false`, because that file is sourced after the default is set.

## Upgrading React Native

- Follow the [upgrade helper](https://react-native-community.github.io/upgrade-helper/)
  recommendations.
- Before running `yarn install`, remove `ios/Pods` and `ios/Podfile.lock`.
- Run `bundle install` and `bundle exec pod install`.

## For coding agents

[AGENTS.md](AGENTS.md) holds the rules and the CI debugging notes that coding agents need. Humans
are welcome to read it, but setup lives here.
