import { StationsStoreModel, StationsStore } from "./stations-store"

test("can be created", () => {
  const instance: StationsStore = StationsStoreModel.create({})

  expect(instance).toBeTruthy()
})