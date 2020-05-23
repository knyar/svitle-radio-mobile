import { PreferencesStoreModel, PreferencesStore } from "./preferences-store"

test("can be created", () => {
  const instance: PreferencesStore = PreferencesStoreModel.create({})

  expect(instance).toBeTruthy()
})