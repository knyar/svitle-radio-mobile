import { act, renderHook, waitFor } from "@testing-library/react-native"

import { setupRootStore } from "../models/root-store"
import * as storage from "./storage"
import { restorableNavigationState, useAppBoot } from "./use-app-boot"

jest.mock("../models/root-store", () => ({
  setupRootStore: jest.fn(),
}))
jest.mock("./storage", () => ({
  load: jest.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const currentTabState = {
  stale: false,
  type: "tab",
  key: "tab-key",
  index: 1,
  routeNames: ["live", "streams", "contacts"],
  routes: [{ key: "streams-key", name: "streams" }],
}

beforeEach(() => jest.resetAllMocks())

test("waits for the store and navigation restore before becoming ready", async () => {
  const store = { mainStore: {} } as any
  const storeResult = deferred<any>()
  const navigationResult = deferred<unknown>()
  ;(setupRootStore as jest.Mock).mockReturnValue(storeResult.promise)
  ;(storage.load as jest.Mock).mockReturnValue(navigationResult.promise)

  const { result } = await renderHook(() => useAppBoot("navigation"))

  await act(async () => storeResult.resolve(store))
  expect(result.current.ready).toBe(false)

  await act(async () => navigationResult.resolve(currentTabState))
  await waitFor(() => expect(result.current.ready).toBe(true))
  expect(result.current.initialNavigationState).toBe(currentTabState)
})

test("becomes ready without navigation state when storage fails", async () => {
  ;(setupRootStore as jest.Mock).mockResolvedValue({ mainStore: {} })
  ;(storage.load as jest.Mock).mockRejectedValue(new Error("storage unavailable"))

  const { result } = await renderHook(() => useAppBoot("navigation"))

  await waitFor(() => expect(result.current.ready).toBe(true))
  expect(result.current.initialNavigationState).toBeUndefined()
})

test("rejects an old persisted root stack state", () => {
  const oldStackState = {
    stale: false,
    type: "stack",
    routes: [{ name: "primaryStack", state: currentTabState }],
  }

  expect(restorableNavigationState(oldStackState)).toBeUndefined()
})

test("returns a current tab state unchanged", () => {
  expect(restorableNavigationState(currentTabState)).toBe(currentTabState)
})

test.each([null, "garbage", {}, { routes: [] }])(
  "rejects invalid persisted navigation state %#",
  (loaded) => {
    expect(restorableNavigationState(loaded)).toBeUndefined()
  },
)
