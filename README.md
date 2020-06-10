# SvitleRadio

## Building instructions

```
$ yarn install
```

Create `ios/sentry.properties` to allow Sentry to upload debug symbols:

```
defaults.url=https://sentry.io/
defaults.org=your-org-name
defaults.project=your-project-name
auth.token=your-user's-auth-token
```

## TODO

* Use current station logo while configuring media track
* Cherry-pick metadata update event for iOS