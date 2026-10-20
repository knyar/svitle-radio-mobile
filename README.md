## Svitle Radio

This is a mobile app for [Svitle Radio](https://svitle.org/), a Christian radio
station in Kyiv, Ukraine.

Written in React Native, it supports both iOS and Android and uses a simple JSON
API to discover station metadata.

JSON API is also open source, available [here](https://github.com/knyar/svitle-api)

## Development instructions

See [AGENTS.md](AGENTS.md) for the authoritative install, verification, build, and contribution
instructions.

Install system dependencies:

```
brew install node
brew install watchman
```

```
corepack enable
yarn install --frozen-lockfile
bundle install
cd ios && bundle exec pod install
```

Native builds must remain secret-free; see the Sentry rule in [AGENTS.md](AGENTS.md). If symbol
uploads are explicitly enabled, `ios/sentry.properties` uses this template:

```
defaults.url=https://sentry.io/
defaults.org=ikkit
defaults.project=svetloe
auth.token=your-user's-auth-token
```

## Running

```
yarn start  # in one terminal
yarn run-svitle-ios # run ios simulator
yarn run-svitle-android # run android simulator
```

To start Xcode: `open ios/SvitleRadio.xcworkspace`

## Building Android release

- Make sure `~/.gradle/gradle.properties` exists and has keychain
  defined (see ~/.private/android/)
- `yarn release-svitle-android`
- Upload AAB file from `android/app/build/outputs/bundle/svitleRelease`

## Upgrading react-native

- follow upgrade-helper recommendations
- before running `yarn install`, remove ios/Pods and ios/Podfile.lock
- run `bundle install` and `bundle exec pod install`
