import React from "react"
import { fireEvent, render, screen } from "@testing-library/react-native"
import { RootStore, RootStoreProvider } from "../models/root-store"
import { StreamsScreen } from "./streams-screen"

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
      localizedUrl: jest.fn(),
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
