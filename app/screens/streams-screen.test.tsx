import React from "react"
import { fireEvent, render, screen } from "@testing-library/react-native"
import { RootStore, RootStoreProvider } from "../models/root-store"
import { StreamsScreen, chunk, tileLayout } from "./streams-screen"

const setStation = jest.fn()
const navigate = jest.fn()
const root = {
  mainStore: {
    local: { station: "svitle", setStation },
    preferences: {
      stations: [
        { id: "svitle", name: "Svitle", logo: "svitle", lang: "ua" },
        { id: "svetloe", name: "Svetloe", logo: "svetloe", lang: "ru" },
      ],
      localizedUrl: jest.fn((key: string) => `https://example.com/${key}`),
    },
  },
} as unknown as RootStore

beforeEach(() => {
  jest.useFakeTimers()
  setStation.mockReset()
  navigate.mockReset()
})

afterEach(() => jest.useRealTimers())

test("marks the current station selected and switches to a non-selected station", async () => {
  // Fake timers only during render: mobx-react-lite 2.x useObserver schedules a real 10 s
  // reaction-cleanup setTimeout on first render that would otherwise keep Jest alive after the
  // suite finishes. Real timers are restored right after so RNTL's async render works.
  await render(
    <RootStoreProvider value={root}>
      <StreamsScreen {...({ navigation: { navigate }, route: {} } as any)} />
    </RootStoreProvider>,
  )
  jest.useRealTimers()

  expect(screen.getByTestId("streams.item.svitle")).toBeSelected()
  expect(screen.getByTestId("streams.item.svitle")).toBeDisabled()
  expect(screen.getByTestId("streams.item.svetloe")).not.toBeSelected()
  expect(screen.getByTestId("streams.item.svetloe")).toBeEnabled()

  fireEvent.press(screen.getByTestId("streams.item.svitle"))
  expect(setStation).not.toHaveBeenCalled()

  fireEvent.press(screen.getByTestId("streams.item.svetloe"))
  expect(setStation).toHaveBeenCalledWith("svetloe")
  expect(navigate).toHaveBeenCalledWith("live")
})

test("footer links are 48 dp tall and may shrink to wrap long labels", async () => {
  await render(
    <RootStoreProvider value={root}>
      <StreamsScreen {...({ navigation: { navigate }, route: {} } as any)} />
    </RootStoreProvider>,
  )
  jest.useRealTimers()

  const archive = await screen.findByTestId("streams.link.archive")
  expect(archive).toHaveStyle({ minHeight: 48, flexShrink: 1 })
  expect(await screen.findByTestId("streams.link.youtube")).toHaveStyle({ minHeight: 48 })
})

test("tileLayout never drops back to one column as the window widens", () => {
  expect(tileLayout(360)).toEqual({ columns: 1, logo: { width: 220, height: 72 } })
  expect(tileLayout(412)).toEqual({ columns: 1, logo: { width: 220, height: 72 } })
  expect(tileLayout(540)).toEqual({ columns: 2, logo: { width: 220, height: 72 } })
  expect(tileLayout(600)).toEqual({ columns: 2, logo: { width: 220, height: 72 } })
  expect(tileLayout(663)).toEqual({ columns: 2, logo: { width: 220, height: 72 } })
  expect(tileLayout(664)).toEqual({ columns: 2, logo: { width: 288, height: 96 } })
  expect(tileLayout(800)).toEqual({ columns: 2, logo: { width: 288, height: 96 } })
  let columns = 1
  for (let width = 320; width <= 1400; width += 1) {
    expect(tileLayout(width).columns).toBeGreaterThanOrEqual(columns)
    columns = tileLayout(width).columns
  }
})

test("chunk splits the stations into rows of the column count", () => {
  expect(chunk(["a", "b", "c", "d"], 1)).toEqual([["a"], ["b"], ["c"], ["d"]])
  expect(chunk(["a", "b", "c", "d"], 2)).toEqual([
    ["a", "b"],
    ["c", "d"],
  ])
  expect(chunk(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]])
  expect(chunk([], 2)).toEqual([])
})
