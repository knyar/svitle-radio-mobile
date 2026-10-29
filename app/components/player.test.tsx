import React from "react"
import { AppState } from "react-native"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import TrackPlayer, { State, TrackType, usePlaybackState } from "react-native-track-player"
import i18n from "i18n-js"
import { Player } from "./player"
import { RootStore, RootStoreProvider } from "../models/root-store"
import { REFRESH_INTERVAL } from "../config/env"

const originalAppState = AppState.currentState
const { resetTrackPlayerMock } = require("react-native-track-player")
const clearPlayRequest = jest.fn()
const testMainStore = {
  local: { station: "svitle", play_requested: false, clearPlayRequest },
  current_station: { id: "svitle", name: "Svitle", logo: "svitle", lang: "ua" },
  current_track: "Song",
  next_track: "Next",
  updateStreamInfo: jest.fn(),
}
const root = { mainStore: testMainStore } as unknown as RootStore
let streamsUpdated: number

beforeEach(() => {
  jest.useFakeTimers()
  resetTrackPlayerMock()
  ;(root.mainStore.updateStreamInfo as unknown as jest.Mock).mockReset()
  ;(AppState.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() })
  ;(AppState as any).currentState = "active"
  root.mainStore.local.station = "svitle"
  root.mainStore.local.play_requested = false
  clearPlayRequest.mockReset()
  clearPlayRequest.mockImplementation(() => {
    root.mainStore.local.play_requested = false
  })
  testMainStore.current_station = {
    id: "svitle",
    name: "Svitle",
    logo: "svitle",
    lang: "ua",
  }
  testMainStore.current_track = "Song"
  streamsUpdated = Date.now()
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
  streamsUpdated: updatedAt = streamsUpdated,
  keepFakeTimers = false,
  clearLoadMocks = true,
}: {
  url?: string
  state: State
  activeUrl?: string
  streamsUpdated?: number
  keepFakeTimers?: boolean
  clearLoadMocks?: boolean
}) {
  ;(usePlaybackState as jest.Mock).mockReturnValue({ state })
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue(
    activeUrl ? { url: activeUrl } : undefined,
  )
  // Fake timers only during render: mobx-react-lite 2.x useObserver schedules a real 10 s
  // reaction-cleanup setTimeout on first render that would otherwise keep Jest alive after the
  // suite finishes. Real timers are restored right after so RNTL's async render/waitFor work.
  const view = await render(
    <RootStoreProvider value={root}>
      <Player url={url} current_track="Song" streams_updated={updatedAt} />
    </RootStoreProvider>,
  )
  if (!keepFakeTimers) jest.useRealTimers()
  await waitFor(() => expect(TrackPlayer.isServiceRunning).toHaveBeenCalled())
  await waitFor(() => expect(TrackPlayer.getActiveTrack).toHaveBeenCalled())
  await flushPromises()
  if (clearLoadMocks) {
    ;(TrackPlayer.add as jest.Mock).mockClear()
    ;(TrackPlayer.play as jest.Mock).mockClear()
    ;(TrackPlayer.reset as jest.Mock).mockClear()
    ;(TrackPlayer.getActiveTrack as jest.Mock).mockClear()
  }
  return view
}

function player(url: string | undefined, currentTrack = "Song", updatedAt = streamsUpdated) {
  return (
    <RootStoreProvider value={root}>
      <Player url={url} current_track={currentTrack} streams_updated={updatedAt} />
    </RootStoreProvider>
  )
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

async function flushPromises() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve()
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
  expect(screen.getByTestId("player.play").props.accessibilityLabel).toBe(
    i18n.t("live_screen.button_label_play"),
  )
  fireEvent.press(screen.getByTestId("player.play"))
  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalled())
  expect(TrackPlayer.add).toHaveBeenCalledWith(
    expect.objectContaining({ url, userAgent: expect.any(String), type }),
  )
})

test("pressing while playing resets playback", async () => {
  const url = "https://radio"
  await mountPlayer({ url, state: State.Playing, activeUrl: url })
  expect(screen.getByTestId("player.pause")).toBeTruthy()
  fireEvent.press(screen.getByTestId("player.pause"))
  await waitFor(() => expect(TrackPlayer.reset).toHaveBeenCalled())
  expect(TrackPlayer.play).not.toHaveBeenCalled()
})

test("buffering has no pressable control", async () => {
  await mountPlayer({ url: "https://radio", state: State.Buffering })
  expect(screen.getByTestId("player.disabled")).toBeTruthy()
  expect(screen.queryByTestId("player.play")).toBeNull()
  expect(screen.queryByTestId("player.pause")).toBeNull()
})

test("reinitializes the player and reapplies options before retrying play", async () => {
  await mountPlayer({ url: "https://radio", state: State.None })
  ;(TrackPlayer.setupPlayer as jest.Mock).mockClear()
  ;(TrackPlayer.updateOptions as jest.Mock).mockClear()
  ;(TrackPlayer.play as jest.Mock)
    .mockRejectedValueOnce(new Error("The player is not initialized"))
    .mockResolvedValue(undefined)

  fireEvent.press(screen.getByTestId("player.play"))

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(2))
  expect(TrackPlayer.setupPlayer).toHaveBeenCalledTimes(1)
  expect(TrackPlayer.updateOptions).toHaveBeenCalledTimes(1)

  const setupOrder = (TrackPlayer.setupPlayer as jest.Mock).mock.invocationCallOrder[0]
  const optionsOrder = (TrackPlayer.updateOptions as jest.Mock).mock.invocationCallOrder[0]
  const retryOrder = (TrackPlayer.play as jest.Mock).mock.invocationCallOrder[1]
  expect(setupOrder).toBeLessThan(optionsOrder)
  expect(optionsOrder).toBeLessThan(retryOrder)
})

test("stopping playback does not re-add the track", async () => {
  const url = "https://radio"
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })

  fireEvent.press(screen.getByTestId("player.pause"))
  await waitFor(() => expect(TrackPlayer.reset).toHaveBeenCalledTimes(1))
  ;(usePlaybackState as jest.Mock).mockReturnValue({ state: State.None })
  await view.rerender(player(url))

  await flushPromises()
  expect(TrackPlayer.add).not.toHaveBeenCalled()
})

test("a station selected before the Player mounts starts playback on mount", async () => {
  root.mainStore.local.play_requested = true

  await mountPlayer({
    url: "https://radio",
    state: State.None,
    clearLoadMocks: false,
  })

  expect(TrackPlayer.add).toHaveBeenCalledTimes(1)
  expect(TrackPlayer.play).toHaveBeenCalledTimes(1)
  expect(clearPlayRequest).toHaveBeenCalledTimes(1)
  expect((TrackPlayer.add as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
    (TrackPlayer.play as jest.Mock).mock.invocationCallOrder[0],
  )
})

test("a play request waits for the URL", async () => {
  root.mainStore.local.play_requested = true
  const view = await mountPlayer({ url: undefined, state: State.None })

  expect(TrackPlayer.play).not.toHaveBeenCalled()
  expect(clearPlayRequest).not.toHaveBeenCalled()

  await view.rerender(player("https://radio"))

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
  expect(clearPlayRequest).toHaveBeenCalledTimes(1)
})

test("a station change without a play request does not start playback", async () => {
  const view = await mountPlayer({ url: "https://a", state: State.None, activeUrl: "https://a" })
  root.mainStore.local.station = "svetloe"

  await view.rerender(player("https://b"))

  await waitFor(() => expect(TrackPlayer.add).toHaveBeenCalledTimes(1))
  expect(TrackPlayer.play).not.toHaveBeenCalled()
  expect(clearPlayRequest).not.toHaveBeenCalled()
})

test("switching station while playing loads once and plays exactly once", async () => {
  const view = await mountPlayer({ url: "https://a", state: State.Playing, activeUrl: "https://a" })
  root.mainStore.local.station = "svetloe"
  root.mainStore.local.play_requested = true
  testMainStore.current_station = {
    id: "svetloe",
    name: "Svetloe",
    logo: "svetloe",
    lang: "ru",
  }

  await view.rerender(player("https://b"))
  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
  expect(TrackPlayer.add).toHaveBeenCalledTimes(1)
  expect(TrackPlayer.add).toHaveBeenCalledWith(expect.objectContaining({ url: "https://b" }))
  expect((TrackPlayer.add as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
    (TrackPlayer.play as jest.Mock).mock.invocationCallOrder[0],
  )

  await view.rerender(player("https://b"))
  await flushPromises()
  expect(TrackPlayer.add).toHaveBeenCalledTimes(1)
  expect(TrackPlayer.play).toHaveBeenCalledTimes(1)
})

test("switching station while stopped starts playback once", async () => {
  const view = await mountPlayer({ url: "https://a", state: State.None, activeUrl: "https://a" })
  root.mainStore.local.station = "svetloe"
  root.mainStore.local.play_requested = true

  await view.rerender(player("https://b"))

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
  expect(TrackPlayer.add).toHaveBeenCalledTimes(1)
})

test("pressing play right after the state turns None plays once", async () => {
  const url = "https://radio"
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })
  ;(usePlaybackState as jest.Mock).mockReturnValue({ state: State.None })
  await view.rerender(player(url))

  fireEvent.press(screen.getByTestId("player.play"))

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
})

test("a stop requested while a load is adding runs after that load and wins", async () => {
  const view = await mountPlayer({ url: "https://a", state: State.Playing, activeUrl: "https://a" })
  const pendingAdd = deferred<void>()
  ;(TrackPlayer.add as jest.Mock).mockImplementationOnce(() => pendingAdd.promise)

  await view.rerender(player("https://b"))
  await waitFor(() => expect(TrackPlayer.add).toHaveBeenCalledTimes(1))
  fireEvent.press(screen.getByTestId("player.pause"))
  pendingAdd.resolve()
  await waitFor(() => expect(TrackPlayer.reset).toHaveBeenCalledTimes(2))

  const addOrder = (TrackPlayer.add as jest.Mock).mock.invocationCallOrder[0]
  const playOrder = (TrackPlayer.play as jest.Mock).mock.invocationCallOrder[0]
  const resetOrders = (TrackPlayer.reset as jest.Mock).mock.invocationCallOrder
  expect(addOrder).toBeLessThan(playOrder)
  expect(playOrder).toBeLessThan(resetOrders[1])
  expect(resetOrders[1]).toBeGreaterThan(Math.max(addOrder, playOrder, resetOrders[0]))
  expect(TrackPlayer.add).toHaveBeenCalledTimes(1)
})

test("rapid URL changes skip a load that has not started while a started load completes", async () => {
  const view = await mountPlayer({ url: "https://a", state: State.None, activeUrl: "https://a" })
  const pendingTrack = deferred<{ url: string }>()
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockClear()
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockImplementationOnce(() => pendingTrack.promise)

  await view.rerender(player("https://b"))
  await waitFor(() => expect(TrackPlayer.getActiveTrack).toHaveBeenCalledTimes(1))
  await view.rerender(player("https://c"))
  await view.rerender(player("https://d"))
  pendingTrack.resolve({ url: "https://a" })

  await waitFor(() => expect(TrackPlayer.add).toHaveBeenCalledTimes(2))
  expect((TrackPlayer.add as jest.Mock).mock.calls.map(([track]) => track.url)).toEqual([
    "https://b",
    "https://d",
  ])
})

test("a stop that supersedes a requested load cancels the request", async () => {
  const view = await mountPlayer({ url: "https://a", state: State.Playing, activeUrl: "https://a" })
  // Block the queue on the metadata sync that a URL change enqueues ahead of its load, so the
  // requested load for the new station is queued but has not started.
  const pendingTrack = deferred<{ url: string }>()
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockImplementationOnce(() => pendingTrack.promise)
  root.mainStore.local.play_requested = true
  root.mainStore.local.station = "svetloe"

  await view.rerender(player("https://b"))
  await waitFor(() => expect(TrackPlayer.getActiveTrack).toHaveBeenCalledTimes(1))
  fireEvent.press(screen.getByTestId("player.pause"))
  expect(clearPlayRequest).toHaveBeenCalledTimes(1)
  expect(root.mainStore.local.play_requested).toBe(false)

  pendingTrack.resolve({ url: "https://a" })
  await waitFor(() => expect(TrackPlayer.reset).toHaveBeenCalledTimes(1))
  expect(TrackPlayer.add).not.toHaveBeenCalled()
  expect(TrackPlayer.play).not.toHaveBeenCalled()

  // A later URL change while stopped (for example a quality toggle) must not start playback.
  ;(usePlaybackState as jest.Mock).mockReturnValue({ state: State.None })
  await view.rerender(player("https://c"))
  await waitFor(() => expect(TrackPlayer.add).toHaveBeenCalledTimes(1))
  expect(TrackPlayer.play).not.toHaveBeenCalled()
})

test("a URL replaced while a requested load is in flight still ends playing", async () => {
  // A station selected from persisted stream data mounts the Player with the persisted URL; the
  // mount-time refresh then replaces it while that load is awaiting TrackPlayer.
  root.mainStore.local.play_requested = true
  const pendingAdd = deferred<void>()
  ;(TrackPlayer.add as jest.Mock).mockImplementationOnce(() => pendingAdd.promise)
  ;(usePlaybackState as jest.Mock).mockReturnValue({ state: State.None })
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue(undefined)
  const view = await render(player("https://b-old"))
  jest.useRealTimers()
  await waitFor(() => expect(TrackPlayer.add).toHaveBeenCalledTimes(1))

  await view.rerender(player("https://b-new"))
  expect(clearPlayRequest).not.toHaveBeenCalled()
  pendingAdd.resolve()

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(2))
  expect((TrackPlayer.add as jest.Mock).mock.calls.map(([track]) => track.url)).toEqual([
    "https://b-old",
    "https://b-new",
  ])
  expect(clearPlayRequest).toHaveBeenCalledTimes(1)
  expect((TrackPlayer.add as jest.Mock).mock.invocationCallOrder[1]).toBeLessThan(
    (TrackPlayer.play as jest.Mock).mock.invocationCallOrder[1],
  )
})

test("a play request survives a superseded load", async () => {
  const view = await mountPlayer({ url: "https://a", state: State.None, activeUrl: "https://a" })
  const pendingTrack = deferred<{ url: string }>()
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockImplementationOnce(() => pendingTrack.promise)

  await view.rerender(player("https://b"))
  await waitFor(() => expect(TrackPlayer.getActiveTrack).toHaveBeenCalledTimes(1))
  root.mainStore.local.play_requested = true
  await view.rerender(player("https://c"))
  await view.rerender(player("https://d"))
  pendingTrack.resolve({ url: "https://a" })

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
  expect((TrackPlayer.add as jest.Mock).mock.calls.map(([track]) => track.url)).toEqual([
    "https://b",
    "https://d",
  ])
  expect(clearPlayRequest).toHaveBeenCalledTimes(1)
})

test("a station change with the same URL still plays once", async () => {
  const url = "https://radio"
  const view = await mountPlayer({ url, state: State.None, activeUrl: url })
  root.mainStore.local.play_requested = true
  root.mainStore.local.station = "svetloe"

  await view.rerender(player(url))

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
  expect(TrackPlayer.add).not.toHaveBeenCalled()
  expect(clearPlayRequest).toHaveBeenCalledTimes(1)
})

test("a failed play still consumes the request", async () => {
  const url = "https://radio"
  const view = await mountPlayer({ url, state: State.None, activeUrl: url })
  ;(TrackPlayer.play as jest.Mock).mockRejectedValueOnce(new Error("play failed"))
  root.mainStore.local.play_requested = true
  root.mainStore.local.station = "svetloe"

  await view.rerender(player(url))

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
  expect(clearPlayRequest).toHaveBeenCalledTimes(1)

  root.mainStore.local.station = "svitle"
  await view.rerender(player(url))
  await flushPromises()
  expect(TrackPlayer.play).toHaveBeenCalledTimes(1)
})

test("pressing play while the URL effect is loading does not reload the track", async () => {
  const view = await mountPlayer({ url: "https://a", state: State.None, activeUrl: "https://a" })
  const pendingPlay = deferred<void>()
  ;(TrackPlayer.play as jest.Mock).mockImplementationOnce(() => pendingPlay.promise)
  root.mainStore.local.station = "svetloe"
  root.mainStore.local.play_requested = true

  await view.rerender(player("https://b"))
  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue({ url: "https://b" })
  fireEvent.press(screen.getByTestId("player.play"))
  pendingPlay.resolve()
  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(2))

  expect(TrackPlayer.add).toHaveBeenCalledTimes(1)
  expect(TrackPlayer.reset).toHaveBeenCalledTimes(1)
  const addOrder = (TrackPlayer.add as jest.Mock).mock.invocationCallOrder[0]
  for (const playOrder of (TrackPlayer.play as jest.Mock).mock.invocationCallOrder) {
    expect(playOrder).toBeGreaterThan(addOrder)
  }
})

test("after an external stop the play button plays again", async () => {
  const url = "https://radio"
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })
  ;(usePlaybackState as jest.Mock).mockReturnValue({ state: State.Stopped })
  await view.rerender(player(url))

  fireEvent.press(screen.getByTestId("player.play"))

  await waitFor(() => expect(TrackPlayer.play).toHaveBeenCalledTimes(1))
  expect(TrackPlayer.add).not.toHaveBeenCalled()
})

test("a track title change updates the active track's metadata", async () => {
  const url = "https://radio"
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })
  ;(TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValue(0)
  ;(TrackPlayer.updateMetadataForTrack as jest.Mock).mockClear()
  testMainStore.current_track = "B"

  await view.rerender(player(url, "B"))

  await waitFor(() =>
    expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ title: "B" }),
    ),
  )
})

test("a title change for a different active track does not update metadata", async () => {
  const url = "https://radio"
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue({ url: "https://other" })
  ;(TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValue(0)
  ;(TrackPlayer.updateMetadataForTrack as jest.Mock).mockClear()
  testMainStore.current_track = "B"

  await view.rerender(player(url, "B"))
  await waitFor(() => expect(TrackPlayer.getActiveTrack).toHaveBeenCalled())

  expect(TrackPlayer.updateMetadataForTrack).not.toHaveBeenCalled()
})

test("stream info refreshes when the app becomes active", async () => {
  await mountPlayer({ url: "https://radio", state: State.None })
  const listener = (AppState.addEventListener as jest.Mock).mock.calls[0][1]
  expect(root.mainStore.updateStreamInfo).toHaveBeenCalledTimes(1)

  await act(() => listener("background"))
  expect(root.mainStore.updateStreamInfo).toHaveBeenCalledTimes(1)
  await act(() => listener("active"))
  expect(root.mainStore.updateStreamInfo).toHaveBeenCalledTimes(2)
})

test("the title follows stream info while backgrounded", async () => {
  const url = "https://radio"
  ;(TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValue(0)
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })
  const listener = (AppState.addEventListener as jest.Mock).mock.calls[0][1]
  await act(() => listener("background"))
  ;(TrackPlayer.updateMetadataForTrack as jest.Mock).mockClear()
  testMainStore.current_track = "B"

  await view.rerender(player(url, "B", Date.now()))

  await waitFor(() =>
    expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ title: "B" }),
    ),
  )
})

test("a stream-info refresh does not reload or replay the track", async () => {
  const url = "https://radio"
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })

  await view.rerender(player(url, "Song", Date.now() + 1))
  await flushPromises()

  expect(TrackPlayer.reset).not.toHaveBeenCalled()
  expect(TrackPlayer.add).not.toHaveBeenCalled()
  expect(TrackPlayer.play).not.toHaveBeenCalled()
})

test("the title blanks when stream info is stale", async () => {
  const url = "https://radio"
  ;(TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValue(0)
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })
  ;(TrackPlayer.updateMetadataForTrack as jest.Mock).mockClear()

  await view.rerender(player(url, "Song", Date.now() - 3 * REFRESH_INTERVAL))

  await waitFor(() =>
    expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ title: "" }),
    ),
  )
})

test("the title returns when a refresh lands", async () => {
  const url = "https://radio"
  ;(TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValue(0)
  const view = await mountPlayer({ url, state: State.Playing, activeUrl: url })
  await view.rerender(player(url, "Song", Date.now() - 3 * REFRESH_INTERVAL))
  await waitFor(() =>
    expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ title: "" }),
    ),
  )
  ;(TrackPlayer.updateMetadataForTrack as jest.Mock).mockClear()

  await view.rerender(player(url, "Song", Date.now()))

  await waitFor(() =>
    expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ title: "Song" }),
    ),
  )
})

test("a track loaded while stream info is stale carries no title", async () => {
  const view = await mountPlayer({ url: "https://radio", state: State.None })
  ;(TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue({ url: "https://radio" })

  await view.rerender(player("https://other", "Song", Date.now() - 3 * REFRESH_INTERVAL))

  await waitFor(() =>
    expect(TrackPlayer.add).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://other", title: "" }),
    ),
  )
})

test("the title blanks on the periodic tick when no refresh arrives", async () => {
  const url = "https://radio"
  const updatedAt = Date.now()
  ;(TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValue(0)
  await mountPlayer({
    url,
    state: State.Playing,
    activeUrl: url,
    streamsUpdated: updatedAt,
    keepFakeTimers: true,
  })
  ;(TrackPlayer.updateMetadataForTrack as jest.Mock).mockClear()

  await act(() => jest.advanceTimersByTimeAsync(3 * REFRESH_INTERVAL))

  expect(TrackPlayer.updateMetadataForTrack).toHaveBeenCalledWith(
    0,
    expect.objectContaining({ title: "" }),
  )
  jest.useRealTimers()
})
