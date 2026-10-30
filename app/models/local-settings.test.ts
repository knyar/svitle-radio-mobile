import { getSnapshot } from "mobx-state-tree"
import { LocalSettingsModel } from "./local-settings"

test("selectStation records a playback request", () => {
  const settings = LocalSettingsModel.create()

  settings.selectStation("svitle")

  expect(settings.station).toBe("svitle")
  expect(settings.play_requested).toBe(true)
})

test("setStation does not record a playback request", () => {
  const settings = LocalSettingsModel.create()

  settings.setStation("svitle")

  expect(settings.station).toBe("svitle")
  expect(settings.play_requested).toBe(false)
})

test("clearPlayRequest clears a playback request", () => {
  const settings = LocalSettingsModel.create()
  settings.selectStation("svitle")

  settings.clearPlayRequest()

  expect(settings.play_requested).toBe(false)
})

test("playback requests are not persisted or restored", () => {
  const settings = LocalSettingsModel.create()
  settings.selectStation("svitle")
  const snapshot = getSnapshot(settings)

  expect(snapshot).not.toHaveProperty("play_requested")
  expect(LocalSettingsModel.create(snapshot).play_requested).toBe(false)
})
