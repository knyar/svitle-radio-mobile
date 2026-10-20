test("isFlavor accepts supported flavours", () => {
  const { isFlavor } = require("./flavor")

  expect(isFlavor("svitle")).toBe(true)
  expect(isFlavor("svetloe")).toBe(true)
  expect(isFlavor("kids")).toBe(false)
  expect(isFlavor(undefined)).toBe(false)
})

test.each([
  ["unknown", { FLAVOR: "kids" }, "Unknown FLAVOR build config: kids"],
  ["missing", {}, "Unknown FLAVOR build config: undefined"],
])("throws for %s flavour configuration", (_name, buildConfig, message) => {
  jest.resetModules()
  jest.isolateModules(() => {
    jest.doMock("react-native-build-config", () => ({ __esModule: true, default: buildConfig }))
    expect(() => require("./flavor")).toThrow(message)
  })
})

test("loads a supported configured flavour", () => {
  jest.resetModules()
  jest.isolateModules(() => {
    jest.doMock("react-native-build-config", () => ({
      __esModule: true,
      default: { FLAVOR: "svetloe" },
    }))
    expect(require("./flavor").FLAVOR).toBe("svetloe")
  })
})
