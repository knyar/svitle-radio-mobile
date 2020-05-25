import { PreferencesModel, Preferences } from "./preferences"

test("can be created", () => {
  const instance: Preferences = PreferencesModel.create({})

  expect(instance).toBeTruthy()
})
