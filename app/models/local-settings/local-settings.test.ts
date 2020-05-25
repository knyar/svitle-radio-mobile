import { LocalSettingsModel, LocalSettings } from "./local-settings"

test("can be created", () => {
  const instance: LocalSettings = LocalSettingsModel.create({})

  expect(instance).toBeTruthy()
})
