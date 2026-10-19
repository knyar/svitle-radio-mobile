import { State } from "react-native-track-player"
import { buttonState } from "./player-state"

test.each([
  [undefined, State.None, { enabled: false, variant: "play", labelKey: "button_label_play" }],
  ["url", State.None, { enabled: true, variant: "play", labelKey: "button_label_play" }],
  ["url", State.Playing, { enabled: true, variant: "pause", labelKey: "button_label_stop" }],
  ["url", State.Buffering, { enabled: false, variant: "play", labelKey: "button_label_play" }],
  ["url", State.Loading, { enabled: false, variant: "play", labelKey: "button_label_play" }],
])("maps url %s and state %s", (url, state, expected) => {
  expect(buttonState(url as string | undefined, state as State)).toEqual(expected)
})
