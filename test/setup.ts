jest.mock("react-native-track-player")
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
)
jest.mock("react-native-device-info", () =>
  require("react-native-device-info/jest/react-native-device-info-mock"),
)
jest.mock("react-native-build-config", () => ({
  __esModule: true,
  default: { FLAVOR: "svitle" },
}))
jest.mock("react-native-localize", () => ({
  findBestLanguageTag: () => ({ languageTag: "uk", isRTL: false }),
}))
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  wrap: (component: unknown) => component,
  captureException: jest.fn(),
}))
jest.mock("react-native-safe-area-context", () => require("../__mocks__/safe-area-context"))

import { clearTimers } from "mobx-react-lite"
import "../app/i18n"
const { resetTrackPlayerMock } = require("react-native-track-player")

let consoleWarnSpy: jest.SpyInstance

beforeEach(() => {
  resetTrackPlayerMock()
  consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation()
})

afterEach(() => {
  clearTimers()
  // Matches "[mobx]", "[mobx-state-tree]" and "[mobx-react-lite]" diagnostics alike.
  const mobxWarnings = consoleWarnSpy.mock.calls.filter((call) =>
    /\[mobx[^\]]*\]/i.test(call.join(" ")),
  )
  consoleWarnSpy.mockRestore()
  expect(mobxWarnings).toEqual([])
})
