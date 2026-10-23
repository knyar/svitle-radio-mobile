# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

One shared React Native design language ships on both Android and iOS with no per-OS adaptation.
Android is the reference OS when conventions conflict, because it is where the project runs and
verifies today (emulator, Maestro suite, screenshot size sweep in CI). iOS ships the same screens
and respects only system affordances: safe areas, lock-screen and notification media controls.

## Users

Listeners of Svitle Radio, a Christian radio station in Kyiv, Ukraine. About 70% are Ukrainian
diaspora abroad who cannot receive the FM signal; about 30% listen from inside Ukraine. Most are
regulars who already know the station, open the app, press play, and leave it running in the
background while commuting, working, or at home. Newcomers who found the app in a store are a
minority but must not be met with hostility: the station list and contacts should make sense
without prior knowledge. A notable share of listeners are older; legibility, larger text, and
simple controls outrank density.

Languages: Ukrainian (default) and Russian, chosen from the device locale. The app has no
English copy today.

## Product Purpose

The official mobile app for listening to Svitle Radio's live streams. Success is a stream that
starts quickly, keeps playing in the background with correct lock-screen metadata, and lets the
listener switch between the station's channels and reach the station (support, archive, video,
contacts) in one tap. Discovery, playlists, and on-demand content are not goals; the archive and
YouTube links hand off to the web.

## Positioning

A remote control for one station, not a generic radio directory. It is the only app with Svitle's
own channel line-up (main station, testimonies channel, kids channel) and the live
"now playing / up next" programme data from the station's own API.

## Operating Context

- Three bottom tabs: Live (logo, large play/pause, now/next, support link, data-saver toggle),
  Streams (channel list with logo, name, and language; selecting a channel switches to Live and
  starts playback), Contacts (blocks of phone, messenger, web, and e-mail links from the API).
- Station metadata, channel list, stream URLs, and contacts come from the open-source JSON API at
  `https://m.svitle.org/v2`; the app renders whatever the API delivers and refreshes
  now/next every 30 s in production.
- Playback runs through react-native-track-player as a foreground media service with
  lock-screen and notification controls; HLS and plain streams.
- Listening often happens on metered or weak mobile connections, abroad and in Ukraine. The
  low-quality stream toggle ("save traffic") and a lean app are first-class, not an afterthought.
- Verification happens on an Android emulator: Maestro flows in `.maestro/`, a local stub API in
  `scripts/e2e-api`, and `scripts/screenshot-sizes.sh` for every screen at several display sizes.

## Capabilities and Constraints

- Anonymous by design: no account, no sign-in, no server-side favourites or personalisation, and
  no tracking beyond Sentry crash reporting. Only the chosen channel and the data-saver flag are
  stored locally.
- The build also carries a second flavor, Svetloe (`org.svetloe`, Russian-language, blue
  identity). Decision (2026-10-23): Svitle only going forward. Svetloe must keep building, but
  design work targets Svitle and does not have to keep Svetloe in step.
- All visible text is localised through i18n keys (uk, ru); copy changes go through
  `app/i18n/*.json`, never inline strings.
- Maestro flows match stable test IDs only (`screen.*`, `nav.*`, `player.*`, `streams.item.*`,
  `logo.*`); new controls that a flow needs get a stable `testID`.
- Known debt: the player has no error UI and no buffering indicator distinct from the shared
  disabled control.
- Undecided: whether English copy is ever needed for diaspora households.

## Brand Commitments

- Name: Svitle Radio (Світле Радіо). Operated by TRK "Emmanuel" (ТРК «Еммануїл»).
- The station logo set and the purple brand colour are binding and come from the station: do not
  reinterpret or restyle them. Assets: `app/images/svitle.svg` (main), `app/images/kids.svg`
  (kids channel), `app/images/header.svitle.svg`, `app/images/artwork.svitle.png` and
  `app/images/artwork.kids.png` (lock-screen artwork), `app/images/bg.svitle*.png`
  (player background). The testimonies channel (`svid`) reuses the main logo.
- Brand purple as currently coded: primary `#7c4f96`, active `#855b90`, selected background
  `#f5f0f3`, body text `#4E5966` (`app/theme.ts`).
- Voice (from existing copy): plain, warm, short imperative labels ("Слухати", "Підтримати
  радіо"); no marketing register.

## Evidence on Hand

- Real channel line-up and contact structure: `scripts/e2e-api/preferences.svitle.json` mirrors
  the production API shape with placeholder phone numbers and e-mail.
- Current-state screenshots of all three screens and the Streams screen at five display sizes:
  `~/svitle-screenshots/` (outside the repo).
- Public web presence: https://svitle.org, archive at https://media.svitle.org/podcasts, live
  video on YouTube. The API is open source: https://github.com/knyar/svitle-api.
- Absent: listener counts, store ratings, testimonials, or audience research. Do not fabricate
  any of these.

## Product Principles

1. **Play first.** Every screen exists to get the listener to a playing stream and keep it
   playing; nothing competes with the play control.
2. **Legible for older eyes.** Text sizes, contrast, and touch targets are sized for listeners
   who hold the phone at arm's length; density is never a goal.
3. **Cheap on data, honest about it.** Respect metered connections; keep the data-saver choice
   visible and the app small.
4. **The station's identity, not ours.** Logos and purple come from Svitle and are used as
   given; the app's own styling stays quiet around them.
5. **Works for a stranger.** A newcomer can tell what the channels are and how to reach the
   station without explanation, in Ukrainian or Russian.

## Accessibility & Inclusion

Older listeners are a confirmed audience: support the OS large-text settings without clipping,
keep touch targets generous, and make play/pause state visible without colour alone. Controls
already carry accessibility labels (play/stop); keep that for any new control. No formal
standard has been mandated.
