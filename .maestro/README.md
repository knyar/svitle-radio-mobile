# Maestro smoke tests

Flows use stable IDs only: `screen.*`, `nav.*`, `player.play|pause|disabled`, and
`streams.item.<id>`. Never match visible text because the app is localised.

With Maestro installed and an Android emulator running, build the e2e APK and run:

```sh
scripts/e2e-android.sh android/app/build/outputs/apk/svitle/e2e/app-svitle-e2e.apk
```

For iOS, install the simulator app and run:

```sh
maestro test -e APP_ID=org.svitle.app1 .maestro/
```

When a flow flakes, first lengthen its state wait. Quarantine only as a last resort and record an
owner, reason, and expiry in the flow.
