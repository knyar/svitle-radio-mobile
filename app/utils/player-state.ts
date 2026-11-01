import { State } from "react-native-track-player"

export function isStreamInfoStale(
  updatedAt: number,
  now: number,
  refreshInterval: number,
): boolean {
  return updatedAt === 0 || now - updatedAt > 2 * refreshInterval
}

// The track to show, or undefined when there is none or the stream info is stale. The Live screen
// and the lock screen share this rule so they never disagree about what is playing.
export function liveTrack(
  track: string | undefined,
  updatedAt: number,
  now: number,
  refreshInterval: number,
): string | undefined {
  return isStreamInfoStale(updatedAt, now, refreshInterval) ? undefined : track || undefined
}

export function buttonState(
  url: string | undefined,
  state: State | undefined,
): { enabled: boolean; variant: "play" | "pause"; labelKey: string } {
  let enabled = !!url
  let variant: "play" | "pause" = "play"
  let labelKey = "live_screen.button_label_play"

  switch (state) {
    case State.Playing:
      variant = "pause"
      labelKey = "live_screen.button_label_stop"
      break
    case State.Buffering:
    case State.Loading:
      enabled = false
      break
  }

  return { enabled, variant, labelKey }
}
