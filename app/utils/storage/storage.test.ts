import AsyncStorage from "@react-native-async-storage/async-storage"

import { load, save } from "./storage"

// fixtures
const VALUE_OBJECT = { x: 1 }
const VALUE_STRING = JSON.stringify(VALUE_OBJECT)

beforeEach(() => {
  // @ts-ignore
  AsyncStorage.getItem.mockReturnValue(Promise.resolve(VALUE_STRING))
})

afterEach(() => jest.clearAllMocks())

test("load", async () => {
  const value = await load("something")
  expect(value).toEqual(JSON.parse(VALUE_STRING))
})

test("load returns null for invalid JSON", async () => {
  // @ts-ignore mock helper
  AsyncStorage.getItem.mockResolvedValueOnce("not-json")
  await expect(load("something")).resolves.toBeNull()
})

test("load returns null for a missing key", async () => {
  // @ts-ignore mock helper
  AsyncStorage.getItem.mockResolvedValueOnce(null)
  await expect(load("missing")).resolves.toBeNull()
})

test("save", async () => {
  await save("something", VALUE_OBJECT)
  expect(AsyncStorage.setItem).toHaveBeenCalledWith("something", VALUE_STRING)
})
