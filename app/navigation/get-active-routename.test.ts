import getActiveRouteName from "./get-active-routename"

test("finds the active route in nested navigation state", () => {
  const state = {
    index: 0,
    routes: [
      { name: "root", state: { index: 1, routes: [{ name: "live" }, { name: "streams" }] } },
    ],
  } as any
  expect(getActiveRouteName(state)).toBe("streams")
})
