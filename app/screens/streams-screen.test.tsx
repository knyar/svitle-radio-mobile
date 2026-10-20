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
  setStation.mockReset()
  navigate.mockReset()
})

test("renders station IDs and switches to a non-selected station", async () => {
  await render(
    <RootStoreProvider value={root}>
      <StreamsScreen {...({ navigation: { navigate }, route: {} } as any)} />
    </RootStoreProvider>,
  )
  expect(screen.getByTestId("streams.item.svitle")).toBeTruthy()
  expect(screen.getByTestId("streams.item.svetloe")).toBeTruthy()

  fireEvent.press(screen.getByTestId("streams.item.svitle"))
  expect(setStation).not.toHaveBeenCalled()

  fireEvent.press(screen.getByTestId("streams.item.svetloe"))
  expect(setStation).toHaveBeenCalledWith("svetloe")
  expect(navigate).toHaveBeenCalledWith("live")
})
