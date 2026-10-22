/// <reference types="node" />
import { ChildProcessWithoutNullStreams, spawn } from "child_process"
import { readFileSync, statSync } from "fs"
import { request } from "http"
import { join } from "path"
import { createInterface } from "readline"

const serverModule = require("./server") as {
  livePlaylist: (fixture: PlaylistFixture, nowMs: number, window?: number) => string
  parsePlaylist: (fixture: string) => PlaylistFixture
}

interface PlaylistFixture {
  targetDuration: number
  mapUri: string
  segments: Array<{ uri: string; duration: number }>
}

const fixture = serverModule.parsePlaylist(readFileSync(join(__dirname, "hls/index.m3u8"), "utf8"))

function atSequence(sequence: number, window = 5): string {
  return serverModule.livePlaylist(fixture, sequence * fixture.targetDuration * 1000, window)
}

test("live playlist starts at zero without a discontinuity", () => {
  const playlist = atSequence(0)
  expect(playlist).toContain("#EXT-X-MEDIA-SEQUENCE:0")
  expect(playlist).toContain("#EXT-X-DISCONTINUITY-SEQUENCE:0")
  expect(playlist).not.toContain("#EXT-X-DISCONTINUITY\n")
  expect(playlist).not.toContain("#EXT-X-ENDLIST")
})

test.each([
  [0, 0, 0],
  [fixture.segments.length - 1, 0, 1],
  [fixture.segments.length, 1, 0],
  [fixture.segments.length + 1, 1, 0],
])(
  "live playlist at first sequence %i has discontinuity sequence %i and %i tags",
  (first, discontinuitySequence, tagCount) => {
    const playlist = atSequence(first + 1, 2)
    expect(playlist).toContain(`#EXT-X-MEDIA-SEQUENCE:${first}`)
    expect(playlist.match(/#EXTINF:/g)).toHaveLength(2)
    expect(playlist).toContain(`#EXT-X-DISCONTINUITY-SEQUENCE:${discontinuitySequence}`)
    expect(playlist.match(/^#EXT-X-DISCONTINUITY$/gm) || []).toHaveLength(tagCount)
  },
)

test("live playlist advances its media sequence and window", () => {
  const playlist = atSequence(8, 5)
  expect(playlist).toContain("#EXT-X-MEDIA-SEQUENCE:4")
  expect(playlist).toContain("#EXT-X-DISCONTINUITY-SEQUENCE:0")
  expect(playlist.match(/#EXTINF:/g)).toHaveLength(5)
})

let child: ChildProcessWithoutNullStreams
let origin: string

beforeAll(async () => {
  child = spawn(process.execPath, [join(__dirname, "server.js"), "--port", "0"], {
    stdio: ["pipe", "pipe", "pipe"],
  })
  origin = await new Promise<string>((resolve, reject) => {
    const lines = createInterface({ input: child.stdout })
    const onExit = (code: number | null) =>
      reject(new Error(`server exited before listening: ${code}`))
    child.once("exit", onExit)
    child.stderr.once("data", (data) => reject(new Error(String(data))))
    lines.once("line", (line) => {
      child.off("exit", onExit)
      lines.close()
      resolve(line.replace("listening on ", ""))
    })
  })
})

afterAll(async () => {
  if (child && child.exitCode === null && !child.killed) {
    child.kill()
    await new Promise<void>((resolve) => child.once("exit", () => resolve()))
  }
})

// Node's fetch refuses to override the Host header and normalises "..", so the cases that depend
// on the raw request line go through http.request.
function rawRequest(
  rawPath: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: string }> {
  const url = new URL(origin)
  return new Promise((resolve, reject) => {
    const req = request(
      { host: url.hostname, port: url.port, method: "GET", path: rawPath, headers },
      (response) => {
        let body = ""
        response.setEncoding("utf8")
        response.on("data", (chunk) => (body += chunk))
        response.on("end", () => resolve({ status: response.statusCode || 0, body }))
      },
    )
    req.on("error", reject)
    req.end()
  })
}

test("serves preferences and rewrites the status origin", async () => {
  const preferences = await fetch(`${origin}/v2/preferences.svitle`)
  const body = await preferences.json()
  expect(body.stations.find((station: { id: string }) => station.id === "svid").logo).toBe("svitle")
  expect(preferences.headers.get("cache-control")).toBe("no-store")

  const status = await rawRequest("/v2/status?recent_tracks=0", { Host: "10.0.2.2:1234" })
  expect(status.status).toBe(200)
  expect(status.body).toContain("http://10.0.2.2:1234/hls/svitle/default.m3u8")
  expect(status.body).not.toContain("{{origin}}")
})

test("serves live playlists and media", async () => {
  const playlist = await fetch(`${origin}/hls/svitle/default.m3u8`)
  expect(playlist.status).toBe(200)
  expect(playlist.headers.get("content-type")).toBe("application/vnd.apple.mpegurl")
  expect(playlist.headers.get("cache-control")).toBe("no-store")
  expect(await playlist.text()).toContain('#EXT-X-MAP:URI="init.mp4"')

  const segment = await fetch(`${origin}/hls/svitle/seg000.m4s`)
  expect(segment.status).toBe(200)
  expect(Number(segment.headers.get("content-length"))).toBe(
    statSync(join(__dirname, "hls/seg000.m4s")).size,
  )
  expect(segment.headers.get("cache-control")).toBe("max-age=3600")
})

test("serves a single byte range and rejects an unsatisfiable range", async () => {
  const size = statSync(join(__dirname, "hls/seg000.m4s")).size
  const partial = await fetch(`${origin}/hls/svitle/seg000.m4s`, {
    headers: { Range: "bytes=10-19" },
  })
  expect(partial.status).toBe(206)
  expect(partial.headers.get("content-range")).toBe(`bytes 10-19/${size}`)
  expect((await partial.arrayBuffer()).byteLength).toBe(10)

  const invalid = await fetch(`${origin}/hls/svitle/seg000.m4s`, {
    headers: { Range: `bytes=${size}-` },
  })
  expect(invalid.status).toBe(416)
  expect(invalid.headers.get("content-range")).toBe(`bytes */${size}`)
})

test.each([
  "/hls/svitle/..%2f..%2fpackage.json",
  "/hls/svitle/%2e%2e/init.mp4",
  "/hls/Sv!tle/default.m3u8",
  "/hls/svitle/seg999.m4s",
  "/unknown",
])("returns JSON 404 for invalid path %s", async (rawPath) => {
  const response = await rawRequest(rawPath)
  expect(response).toEqual({ status: 404, body: '{"error":"not found"}' })
})
