## Svitle Radio

This is a mobile app for [Svitle Radio](https://svitle.org/), a Christian radio
station in Kyiv, Ukraine.

Written in React Native, it supports both iOS and Android and uses a simple JSON
API to discover station metadata.

JSON API is also open source, available [here](https://github.com/knyar/svitle-api)

## Development instructions

```
$ yarn install
```

Create `ios/sentry.properties` to allow Sentry to upload debug symbols:

```
defaults.url=https://sentry.io/
defaults.org=ikkit
defaults.project=svetloe
auth.token=your-user's-auth-token
```

## Running

```
yarn start  # in one terminal
yarn run-svitle-ios # run android simulator
yarn run-svitle-android # run ios simulator
```

To start Xcode: `open ios/SvitleRadio.xcworkspace`

## Building Android release

```
yarn release-svitle-android
```
