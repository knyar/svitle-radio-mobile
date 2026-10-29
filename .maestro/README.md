# Maestro smoke tests

Six flows: launch, play and pause, navigation, backgrounding, switching stations, and selecting a
station before the Live screen mounts to verify autoplay. How to build the app and run them locally
is in the root [README.md](../README.md) under "End-to-end tests"; the stable-ID rule and the flake
policy are in [AGENTS.md](../AGENTS.md).
The flows require the local stub in `scripts/e2e-api`; the Android and iOS e2e scripts start it.
`screenshots/screens.yaml` is not a test: `scripts/screenshot-sizes.sh` runs it per display size to
capture each screen, and Maestro skips subfolders when running the suite.
