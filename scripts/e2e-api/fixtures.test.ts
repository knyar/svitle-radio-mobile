/// <reference types="node" />
import { readFileSync } from "fs"
import { join } from "path"
import { PreferencesModel } from "../../app/models/preferences"
import { convertStreamInfo } from "../../app/services/api/api"

const fixture = (name: string) => JSON.parse(readFileSync(join(__dirname, name), "utf8"))

test("preferences fixture is accepted by the app model", () => {
  const preferences = PreferencesModel.create(fixture("preferences.svitle.json"))
  expect(preferences.stations.find((station) => station.id === "svid")?.logo).toBe("svitle")
})

test("status fixture supplies both streams for every station", () => {
  const origin = "http://127.0.0.1:8484"
  const raw = JSON.parse(
    readFileSync(join(__dirname, "status.json"), "utf8").replaceAll("{{origin}}", origin),
  )
  const streams = convertStreamInfo(raw)
  expect(streams.size).toBe(4)
  for (const stream of streams.values()) {
    expect(stream.stream_url).toMatch(new RegExp(`^${origin}/hls/`))
    expect(stream.stream_url_low).toMatch(new RegExp(`^${origin}/hls/`))
  }
})
