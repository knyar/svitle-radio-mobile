import { Api, convertStreamInfo } from "./api"

const station = {
  current_track: "Now",
  next_track: "Next",
  streams: [
    { name: "high", url: "https://high" },
    { name: "low", url: "https://low" },
  ],
}

function apiWith(response: any) {
  const api = new Api()
  api.apisauce = { get: jest.fn().mockResolvedValue(response) } as any
  return api
}

beforeEach(() => jest.spyOn(console, "log").mockImplementation())

test("getStreamInfo parses high and low streams", async () => {
  const api = apiWith({ ok: true, data: { stations: { svitle: station } } })
  const result = await api.getStreamInfo()
  expect(result).toEqual({
    kind: "ok",
    streams: new Map([
      [
        "svitle",
        expect.objectContaining({ stream_url: "https://high", stream_url_low: "https://low" }),
      ],
    ]),
  })
})

test("empty track strings become undefined", () => {
  const streams = convertStreamInfo({
    stations: { svitle: { ...station, current_track: "", next_track: "" } },
  })
  expect(streams.get("svitle")).toEqual(
    expect.objectContaining({ current_track: undefined, next_track: undefined }),
  )
})

test("missing streams is bad data", async () => {
  const api = apiWith({ ok: true, data: { stations: { svitle: {} } } })
  await expect(api.getStreamInfo()).resolves.toEqual({ kind: "bad-data" })
})

test("network errors cannot connect", async () => {
  const api = apiWith({ ok: false, problem: "NETWORK_ERROR" })
  await expect(api.getStreamInfo()).resolves.toEqual({ kind: "cannot-connect", temporary: true })
})

test("getPreferences passes data through and maps errors", async () => {
  const data = { stations: [] }
  await expect(apiWith({ ok: true, data }).getPreferences()).resolves.toEqual({
    kind: "ok",
    preferences: data,
  })
  await expect(apiWith({ ok: false, problem: "NETWORK_ERROR" }).getPreferences()).resolves.toEqual({
    kind: "cannot-connect",
    temporary: true,
  })
})

test("convertStreamInfo handles no stations", () => {
  expect(convertStreamInfo({})).toEqual(new Map())
})
