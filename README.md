# SvitleRadio

## Building instructions

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
yarn android-svitle  # run android simulator
yarn android-svetloe  # run android simulator
yarn ios-svitle  # run ios simulator
yarn ios-svetloe  # run ios simulator
```

To start Xcode: `open ios/SvitleRadio.xcworkspace`

## TODO

* Changing the stream should start playback and switch to the 'live' screen.
* First launch of the app should default to the 'streams' screen.
* Review navigation code and "exit allowed" routes.
