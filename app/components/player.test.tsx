import React from "react"
import { AppState } from "react-native"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import TrackPlayer, { State, TrackType, usePlaybackState } from "react-native-track-player"
import { Player } from "./player"
import { RootStore, RootStoreProvider } from "../models/root-store"

const originalAppState = AppState.currentState
const { resetTrackPlayerMock } = require("react-native-track-player")
const root = {
  mainStore: {
    local: { station: "svitle" },
    current_station: { id: "svitle", name: "Svitle", logo: "svitle", lang: "ua" },
    current_track: "Song",
    next_track: "Next",
    updateStreamInfo: jest.fn(),
  },
} as unknown as RootStore

beforeEach(() => {
  jest.useFakeTimers()
  resetTrackPlayerMock()
  ;(root.mainStore.updateStreamInfo as unknown as jest.Mock).mockReset()
  ;(AppState.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() })
  ;(AppState as any).currentState = "active"
  jest.spyOn(console, "log").mockImplementation()
})

afterEach(() => {
  ;(AppState as any).currentState = originalAppState
  jest.useRealTimers()
})

async function mountPlayer({
  url,
  state,
  activeUrl,
}: {
  url: string
  state: State
  activeUrl?: string
}) {
  ;(usePlaybackState as jest.Mock).mockReturnValue({ state })
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue(
    activeUrl ? { url: activeUrl } : undefined,
  )
  // Fake timers only during render: mobx-react-lite 2.x useObserver schedules a real 10 s
  // reaction-cleanup setTimeout on first render that would otherwise keep Jest alive after the
  // suite finishes. Real timers are restored right after so RNTL's async render/waitFor work.
  await render(
    <RootStoreProvider value={root}>
      <Player url={url} current_track="Song" />
    </RootStoreProvider>,
  )
  jest.useRealTimers()
  await waitFor(() => expect(TrackPlayer.isServiceRunning).toHaveBeenCalled())
  ;(TrackPlayer.add as jest.Mock).mockClear()
  ;(TrackPlayer.play as jest.Mock).mockClear()
  ;(TrackPlayer.reset as jest.Mock).mockClear()
}

test("renders now-playing metadata and runs mount effects", async () => {
  await mountPlayer({ url: "https://radio", state: State.None })
  expect(screen.getByTestId("player.play")).toBeTruthy()
  expect(screen.getByText("Song")).toBeTruthy()
  expect(screen.getByText("Next")).toBeTruthy()
  expect(TrackPlayer.setupPlayer).toHaveBeenCalled()
  expect(AppState.addEventListener).toHaveBeenCalled()
  expect(root.mainStore.updateStreamInfo).toHaveBeenCalled()
})

test.each([
  ["https://radio", TrackType.Default],
  ["https://radio/stream.m3u8", TrackType.HLS],
])("pressing play adds %s with the expected type", async (url, type) => {
  await mountPlayer({ url, state: State.None })
  fireEvent.press(screen.getByLabelText(/button_label_play/))
  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalled())
  expect(TrackPlayer.add).toHaveBeenCalledWith(
    expect.objectContaining({ url, userAgent: expect.any(String), type }),
  )
})

test("pressing while playing resets playback", async () => {
  const url = "https://radio"
  await mountPlayer({ url, state: State.Playing, activeUrl: url })
  expect(screen.getByTestId("player.pause")).toBeTruthy()
  fireEvent.press(screen.getByLabelText(/button_label_stop/))
  await waitFor(() => expect(TrackPlayer.reset).toHaveBeenCalled())
  expect(TrackPlayer.play).not.toHaveBeenCalled()
})

test("buffering has no pressable control", async () => {
  await mountPlayer({ url: "https://radio", state: State.Buffering })
  expect(screen.getByTestId("player.disabled")).toBeTruthy()
  expect(screen.queryByLabelText(/button_label/)).toBeNull()
})
