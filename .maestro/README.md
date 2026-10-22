# Maestro smoke tests

Five flows: launch, play and pause, navigation, backgrounding, and switching stations. How to build
the app and run them locally is in the root [README.md](../README.md) under "End-to-end tests"; the
stable-ID rule and the flake policy are in [AGENTS.md](../AGENTS.md).
The flows require the local stub in `scripts/e2e-api`; the Android and iOS e2e scripts start it.
