import { StationModel, Station } from "./station"

test("can be created", () => {
  const instance: Station = StationModel.create({})

  expect(instance).toBeTruthy()
})
