import React from "react"
import { Linking } from "react-native"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { RootStore, RootStoreProvider } from "../models/root-store"
import { ContactsScreen } from "./contacts-screen"

const root = {
  mainStore: {
    preferences: {
      contacts: [
        {
          title: "contacts_screen.block.editors",
          icon_links: [
            { text: "skype", url: "https://example.com/skype" },
            { text: "unknown", url: "https://example.com/unknown" },
          ],
          text_links: [{ text: "Email us", url: "mailto:hello@example.com" }],
        },
      ],
    },
  },
} as unknown as RootStore

beforeEach(() => {
  jest.useFakeTimers()
  ;(Linking.canOpenURL as jest.Mock).mockResolvedValue(false)
  ;(Linking.openURL as jest.Mock).mockResolvedValue(undefined)
})

afterEach(() => jest.useRealTimers())

test("renders contacts and opens a supported known icon link", async () => {
  await render(
    <RootStoreProvider value={root}>
      <ContactsScreen navigation={{} as any} />
    </RootStoreProvider>,
  )
  jest.useRealTimers()

  expect(screen.getByText("Редакція")).toBeTruthy()
  expect(screen.getByText("Email us")).toBeTruthy()
  await waitFor(() => expect(screen.getAllByTestId("svg")).toHaveLength(2))

  fireEvent.press(screen.getAllByTestId("svg")[1])
  expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/skype")
})
