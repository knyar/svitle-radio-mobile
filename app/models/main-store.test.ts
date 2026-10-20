import { getSnapshot } from "mobx-state-tree"
import { MainStoreModel } from "./main-store"
import { RootStoreModel } from "./root-store"

const stations = [
  { id: "one", name: "One", logo: "svitle", lang: "uk" },
  { id: "two", name: "Two", logo: "svetloe", lang: "uk" },
]

const env = {
  api: {
    getPreferences: jest.fn(),
    getStreamInfo: jest.fn(),
  },
} as any

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation()
  env.api.getPreferences.mockReset()
  env.api.getStreamInfo.mockReset()
})

const streams = () =>
  new Map([
    [
      "one",
      {
        current_track: "Now",
        next_track: "Next",
        stream_url: "https://high",
        stream_url_low: "https://low",
      },
    ],
  ])

test("savePreferences selects, keeps, and replaces stations", () => {
  const store = MainStoreModel.create({}, env)
  store.savePreferences({ stations, contacts: [] } as any)
  expect(store.local.station).toBe("one")
  store.local.setStation("two")
  store.savePreferences({ stations, contacts: [] } as any)
  expect(store.local.station).toBe("two")
  store.local.setStation("missing")
  store.savePreferences({ stations, contacts: [] } as any)
  expect(store.local.station).toBe("one")
})

test("selects stream URLs and metadata", () => {
  const store = MainStoreModel.create({}, env)
  store.savePreferences({ stations, contacts: [] } as any)
  store.saveStreamInfo(streams())
  expect(store.current_url).toBe("https://high")
  store.local.toggleQuality()
  expect(store.current_url).toBe("https://low")
  expect(store.current_track).toBe("Now")
  expect(store.next_track).toBe("Next")
})

test("low quality falls back to the high URL", () => {
  const store = MainStoreModel.create({}, env)
  store.savePreferences({ stations, contacts: [] } as any)
  store.saveStreamInfo(new Map([["one", { stream_url: "https://high" }]]) as any)
  store.local.toggleQuality()
  expect(store.current_url).toBe("https://high")
})

test("missing stream values are undefined", () => {
  const store = MainStoreModel.create({}, env)
  store.savePreferences({ stations, contacts: [] } as any)
  expect(store.current_url).toBeUndefined()
  expect(store.current_track).toBeUndefined()
  expect(store.next_track).toBeUndefined()
  expect(store.current_stream.stream_url_low).toBeFalsy()
})

test("getPreferences retries temporary failures and saves the result", async () => {
  jest.useFakeTimers()
  jest.spyOn(Math, "random").mockReturnValue(0)
  env.api.getPreferences
    .mockResolvedValueOnce({ kind: "cannot-connect", temporary: true })
    .mockResolvedValueOnce({ kind: "ok", preferences: { stations, contacts: [] } })
  const store = MainStoreModel.create({}, env)

  const result = store.getPreferences()
  await Promise.resolve()
  await jest.advanceTimersByTimeAsync(500)
  await result

  expect(store.local.station).toBe("one")
  expect(env.api.getPreferences).toHaveBeenCalledTimes(2)
  jest.useRealTimers()
})

test("failed stream updates leave existing streams untouched", async () => {
  const store = MainStoreModel.create({}, env)
  store.saveStreamInfo(streams())
  env.api.getStreamInfo.mockResolvedValueOnce({ kind: "cannot-connect", temporary: true })
  await store.updateStreamInfo()
  expect(store.streams.get("one").stream_url).toBe("https://high")
})

test("persisted state omits tracks and restores preferences and URLs", () => {
  const root = RootStoreModel.create({}, env)
  root.mainStore.savePreferences({ stations, contacts: [] } as any)
  root.mainStore.local.toggleQuality()
  root.mainStore.saveStreamInfo(streams())
  const snapshot = getSnapshot(root)
  expect(snapshot.mainStore.streams.one).toEqual({
    stream_url: "https://high",
    stream_url_low: "https://low",
  })
  const restored = RootStoreModel.create(snapshot, env)
  expect(restored.mainStore.local.station).toBe("one")
  expect(restored.mainStore.local.low_quality).toBe(true)
  expect(restored.mainStore.streams.get("one").stream_url).toBe("https://high")
  expect(restored.mainStore.current_track).toBeUndefined()
  expect(restored.mainStore.next_track).toBeUndefined()
})
