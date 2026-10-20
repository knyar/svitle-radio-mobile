import React from "react"
import { act, render, screen } from "@testing-library/react-native"
import { RootStoreModel, RootStoreProvider } from "../models/root-store"
import { LiveScreen } from "./live-screen"

const streams = new Map([["svitle", { stream_url: "https://high", stream_url_low: "https://low" }]])
const fakeEnv = {
  api: {
    getStreamInfo: jest.fn(),
    getPreferences: jest.fn(),
  },
} as any

let warnSpy: jest.SpyInstance

beforeEach(() => {
  jest.useFakeTimers()
  fakeEnv.api.getStreamInfo.mockResolvedValue({ kind: "ok", streams })
  fakeEnv.api.getPreferences.mockResolvedValue({ kind: "ok" })
  warnSpy = jest.spyOn(console, "warn").mockImplementation()
  jest.spyOn(console, "log").mockImplementation()
})

afterEach(() => {
  expect(warnSpy.mock.calls.some((call) => /\[mobx\]/i.test(call.join(" ")))).toBe(false)
  jest.useRealTimers()
})

test("updates the quality state after a real MST mutation", async () => {
  const root = RootStoreModel.create({}, fakeEnv)
  root.mainStore.savePreferences({
    stations: [{ id: "svitle", name: "Svitle", logo: "svitle", lang: "ua" }],
    contacts: [],
  } as any)
  root.mainStore.saveStreamInfo(streams as any)

  // Fake timers only during render: mobx-react-lite 2.x observer schedules a real 10 s
  // reaction-cleanup setTimeout that would otherwise keep Jest alive after the suite finishes.
  await render(
    <RootStoreProvider value={root}>
      <LiveScreen />
    </RootStoreProvider>,
  )
  jest.useRealTimers()

  expect(screen.getByTestId("live.quality").props.accessibilityState.checked).toBe(false)

  await act(() => root.mainStore.local.toggleQuality())

  expect(screen.getByTestId("live.quality").props.accessibilityState.checked).toBe(true)
})
