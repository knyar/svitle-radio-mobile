import { MainStoreModel, MainStore } from "./main-store"

test("can be created", () => {
  const instance: MainStore = MainStoreModel.create({})

  expect(instance).toBeTruthy()
})
