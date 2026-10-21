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

beforeEach(() => {
  fakeEnv.api.getStreamInfo.mockResolvedValue({ kind: "ok", streams })
  fakeEnv.api.getPreferences.mockResolvedValue({ kind: "ok" })
  jest.spyOn(console, "log").mockImplementation()
})

test("updates the quality state after a real MST mutation", async () => {
  const root = RootStoreModel.create({}, fakeEnv)
  root.mainStore.savePreferences({
    stations: [{ id: "svitle", name: "Svitle", logo: "svitle", lang: "ua" }],
    contacts: [],
  } as any)
  root.mainStore.saveStreamInfo(streams as any)

  await render(
    <RootStoreProvider value={root}>
      <LiveScreen />
    </RootStoreProvider>,
  )
  expect(screen.getByTestId("live.quality").props.accessibilityState.checked).toBe(false)

  await act(() => root.mainStore.local.toggleQuality())

  expect(screen.getByTestId("live.quality").props.accessibilityState.checked).toBe(true)
})
