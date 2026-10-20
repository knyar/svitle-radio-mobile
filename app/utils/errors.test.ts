import { errorMessage } from "./errors"

test.each([
  [new Error("broken"), "broken"],
  ["broken", "broken"],
  [{ reason: "broken" }, "[object Object]"],
])("formats an error message", (error, expected) => {
  expect(errorMessage(error)).toBe(expected)
})
