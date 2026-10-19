import { State } from "react-native-track-player"

export function buttonState(
  url: string | undefined,
  state: State,
): { enabled: boolean; variant: "play" | "pause"; labelKey: string } {
  let enabled = !!url
  let variant: "play" | "pause" = "play"
  let labelKey = "button_label_play"

  switch (state) {
    case State.Playing:
      variant = "pause"
      labelKey = "button_label_stop"
      break
    case State.Buffering:
    case State.Loading:
      enabled = false
      break
  }

  return { enabled, variant, labelKey }
}
