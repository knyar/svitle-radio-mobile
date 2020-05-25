import { StreamInfoModel, StreamInfo } from "./stream-info"

test("can be created", () => {
  const instance: StreamInfo = StreamInfoModel.create({})

  expect(instance).toBeTruthy()
})
