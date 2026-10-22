test.each([undefined, "", "$(API_URL)", "ftp://example.test/v2", 42])(
  "resolveApiUrl falls back for %p",
  (value) => {
    const { resolveApiUrl } = require("./env")
    expect(resolveApiUrl(value, "https://fallback.test/v2")).toBe("https://fallback.test/v2")
  },
)

test("resolveApiUrl accepts an HTTP URL", () => {
  const { resolveApiUrl } = require("./env")
  expect(resolveApiUrl("http://127.0.0.1:8484/v2", "https://fallback.test/v2")).toBe(
    "http://127.0.0.1:8484/v2",
  )
})

test("API_URL uses the configured build value", () => {
  jest.resetModules()
  jest.isolateModules(() => {
    jest.doMock("react-native-build-config", () => ({
      __esModule: true,
      default: { FLAVOR: "svitle", API_URL: "http://10.0.2.2:8484/v2" },
    }))
    expect(require("./env").API_URL).toBe("http://10.0.2.2:8484/v2")
  })
})
