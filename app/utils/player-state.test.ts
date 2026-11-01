import { State } from "react-native-track-player"
import { buttonState, isStreamInfoStale, liveTrack } from "./player-state"

test.each([
  ["fresh", 90, 100, 10, false],
  ["exactly at the boundary", 80, 100, 10, false],
  ["past the boundary", 79, 100, 10, true],
  ["never fetched", 0, 100, 10, true],
])("stream info is %s", (_case, updatedAt, now, refreshInterval, expected) => {
  expect(isStreamInfoStale(updatedAt, now, refreshInterval)).toBe(expected)
})

test.each([
  ["a fresh track", "Song", 90, "Song"],
  ["a stale track", "Song", 79, undefined],
  ["no track", undefined, 90, undefined],
  ["an empty track", "", 90, undefined],
])("liveTrack returns %s as expected", (_case, track, updatedAt, expected) => {
  expect(liveTrack(track, updatedAt, 100, 10)).toBe(expected)
})

test.each([
  [
    undefined,
    State.None,
    { enabled: false, variant: "play", labelKey: "live_screen.button_label_play" },
  ],
  [
    "url",
    State.None,
    { enabled: true, variant: "play", labelKey: "live_screen.button_label_play" },
  ],
  ["url", undefined, { enabled: true, variant: "play", labelKey: "live_screen.button_label_play" }],
  [
    "url",
    State.Playing,
    { enabled: true, variant: "pause", labelKey: "live_screen.button_label_stop" },
  ],
  [
    "url",
    State.Buffering,
    { enabled: false, variant: "play", labelKey: "live_screen.button_label_play" },
  ],
  [
    "url",
    State.Loading,
    { enabled: false, variant: "play", labelKey: "live_screen.button_label_play" },
  ],
])("maps url %s and state %s", (url, state, expected) => {
  expect(buttonState(url as string | undefined, state as State)).toEqual(expected)
})
