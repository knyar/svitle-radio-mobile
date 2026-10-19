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
- Svitle iOS: run `bundle install`, then `cd ios && bundle exec pod install && cd ..`, followed by `yarn run-svitle-ios`.
- Android release bundles: `yarn release-svitle-android` or `yarn release-svetloe-android`.
- Svitle Android release APK: `yarn build-svitle-android`.

## Maestro

On-device Maestro flows are coming in milestone 3. Until then, do not invent or claim an E2E command.

## Rules

- Never delete or skip tests, or update snapshots, merely to make CI pass.
- Every behavior change ships with a test.
- Do not change `newArchEnabled`, the react-native-track-player major version, or anything in `patches/` unless explicitly requested.
- Keep ESLint below 9 until the planned flat-config migration. React Native 0.81 provides only a legacy ESLint config.
- TypeScript strict mode is a follow-up; enabling it currently exposes 29 errors.
- `test-renderer` must stay on the line that matches the installed React minor (1.1.x for React 19.1; see its docs/versioning.md). Bump it together with `react`, never alone.

## Known debt

- `Button`, `FooterLink`, and `FooterCheckbox` call `useObserver` after early returns; contact link helpers invoke hooks as ordinary functions.
- Player accessibility labels use missing top-level `button_label_play` and `button_label_stop` translation keys.
- React Navigation packages are mismatched: native and bottom-tabs are v7 while native-stack is v6.
- Twenty stale Dependabot PRs from the React Native 0.63 era should be closed or recreated after CI is established.
