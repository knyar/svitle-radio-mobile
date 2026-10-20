import React from "react"
import { act, render } from "@testing-library/react-native"
import { Timer } from "./timer"
import { RootStore, RootStoreProvider } from "../models/root-store"
import { REFRESH_INTERVAL } from "../config/env"

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date("2025-01-01T00:00:30Z"))
  jest.spyOn(Math, "random").mockReturnValue(0.25)
  jest.spyOn(console, "log").mockImplementation()
})

afterEach(() => jest.useRealTimers())

function store(streamsUpdated: number) {
  return {
    mainStore: { streamsUpdated, updateStreamInfo: jest.fn().mockResolvedValue(undefined) },
  } as unknown as RootStore
}

test("refreshes stream info at the normal interval", async () => {
  const root = store(Date.now() - 30000)
  const view = await render(
    <RootStoreProvider value={root}>
      <Timer />
    </RootStoreProvider>,
  )
  await act(async () => {
    await jest.advanceTimersByTimeAsync(REFRESH_INTERVAL)
  })
  expect(root.mainStore.updateStreamInfo).toHaveBeenCalledTimes(1)
  await act(() => view.unmount())
})

test("recent updates wait for the randomized retry", async () => {
  const root = store(Date.now() + REFRESH_INTERVAL)
  const view = await render(
    <RootStoreProvider value={root}>
      <Timer />
    </RootStoreProvider>,
  )
  await act(async () => {
    await jest.advanceTimersByTimeAsync(REFRESH_INTERVAL)
  })
  expect(root.mainStore.updateStreamInfo).not.toHaveBeenCalled()
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5249)
  })
  expect(root.mainStore.updateStreamInfo).not.toHaveBeenCalled()
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1)
  })
  expect(root.mainStore.updateStreamInfo).toHaveBeenCalledTimes(1)
  await act(() => view.unmount())
})

test("unmount clears the pending timer", async () => {
  const root = store(Date.now() - 30000)
  const view = await render(
    <RootStoreProvider value={root}>
      <Timer />
    </RootStoreProvider>,
  )
  await act(() => view.unmount())
  await act(async () => {
    await jest.advanceTimersByTimeAsync(REFRESH_INTERVAL)
  })
  expect(root.mainStore.updateStreamInfo).not.toHaveBeenCalled()
})
