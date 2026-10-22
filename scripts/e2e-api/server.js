/* eslint-env node */
const fs = require("fs")
const http = require("http")
const path = require("path")

const ROOT = __dirname
const HLS_ROOT = path.join(ROOT, "hls")

function parsePlaylist(fixture) {
  const lines = fixture.trim().split(/\r?\n/)
  const targetLine = lines.find((line) => line.startsWith("#EXT-X-TARGETDURATION:"))
  const mapLine = lines.find((line) => line.startsWith("#EXT-X-MAP:URI="))
  if (!targetLine || !mapLine) {
    throw new Error("HLS fixture is missing its target duration or map")
  }

  const targetDuration = Number(targetLine.split(":", 2)[1])
  const mapMatch = mapLine.match(/^#EXT-X-MAP:URI="([^"]+)"$/)
  const segments = []
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith("#EXTINF:")) {
      const duration = Number(lines[index].slice("#EXTINF:".length).replace(/,$/, ""))
      const uri = lines[index + 1]
      if (!uri || uri.startsWith("#") || !Number.isFinite(duration)) {
        throw new Error("HLS fixture has an invalid segment")
      }
      segments.push({ uri, duration })
    }
  }
  if (!Number.isFinite(targetDuration) || !mapMatch || segments.length === 0) {
    throw new Error("HLS fixture is invalid")
  }
  return { targetDuration, mapUri: mapMatch[1], segments }
}

function livePlaylist(fixture, nowMs, window = 5) {
  const { targetDuration, mapUri, segments } = fixture
  const sequence = Math.floor(nowMs / (targetDuration * 1000))
  const first = Math.max(0, sequence - window + 1)
  const lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:7",
    `#EXT-X-TARGETDURATION:${targetDuration}`,
    `#EXT-X-MEDIA-SEQUENCE:${first}`,
    `#EXT-X-DISCONTINUITY-SEQUENCE:${Math.floor(first / segments.length)}`,
    `#EXT-X-MAP:URI="${mapUri}"`,
  ]

  for (let index = first; index <= sequence; index += 1) {
    if (index > first && index % segments.length === 0) {
      lines.push("#EXT-X-DISCONTINUITY")
    }
    const segment = segments[index % segments.length]
    lines.push(`#EXTINF:${segment.duration.toFixed(6)},`, segment.uri)
  }
  return `${lines.join("\n")}\n`
}

function parseRange(value, size) {
  if (!value) return null
  const match = value.match(/^bytes=(\d*)-(\d*)$/)
  if (!match || (!match[1] && !match[2])) return undefined

  let start
  let end
  if (!match[1]) {
    const suffixLength = Number(match[2])
    if (suffixLength <= 0) return undefined
    start = Math.max(0, size - suffixLength)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] ? Number(match[2]) : size - 1
  }
  if (start >= size || start > end) return undefined
  return { start, end: Math.min(end, size - 1) }
}

function createRequestHandler({
  preferences,
  status,
  playlistFixture,
  mediaFiles,
  now = Date.now,
}) {
  return (request, response) => {
    const requestPath = request.url ? request.url.split("?", 1)[0] : ""
    let statusCode = 404
    // "close" fires for every response, including ones the client abandons; "finish" is skipped
    // when a client hangs up right after the last byte, which curl does for piped media.
    response.on("close", () => {
      process.stdout.write(
        `${new Date().toISOString()} ${request.method} ${requestPath} ${statusCode}\n`,
      )
    })

    const finish = (code, headers, body) => {
      statusCode = code
      response.writeHead(code, headers)
      response.end(body)
    }

    if (request.method === "GET" && requestPath === "/v2/preferences.svitle") {
      finish(
        200,
        { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
        preferences,
      )
    } else if (request.method === "GET" && requestPath === "/v2/status") {
      const origin = `http://${request.headers.host || "127.0.0.1"}`
      finish(
        200,
        { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
        status.replaceAll("{{origin}}", origin),
      )
    } else if (
      request.method === "GET" &&
      /^\/hls\/[a-z0-9]+\/[a-z0-9]+\.m3u8$/.test(requestPath)
    ) {
      finish(
        200,
        { "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" },
        livePlaylist(playlistFixture, now()),
      )
    } else if (request.method === "GET") {
      const match = requestPath.match(/^\/hls\/([a-z0-9]+)\/(init\.mp4|seg\d{3}\.m4s)$/)
      const filename = match && match[2]
      if (filename && mediaFiles.has(filename)) {
        const filePath = path.join(HLS_ROOT, filename)
        const size = fs.statSync(filePath).size
        const range = parseRange(request.headers.range, size)
        if (request.headers.range && !range) {
          finish(416, { "Content-Range": `bytes */${size}`, "Cache-Control": "max-age=3600" })
        } else {
          const headers = {
            "Content-Type": filename === "init.mp4" ? "video/mp4" : "video/iso.segment",
            "Cache-Control": "max-age=3600",
            "Accept-Ranges": "bytes",
          }
          if (range) {
            headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`
            headers["Content-Length"] = String(range.end - range.start + 1)
            response.writeHead(206, headers)
            fs.createReadStream(filePath, range).pipe(response)
            statusCode = 206
          } else {
            headers["Content-Length"] = String(size)
            response.writeHead(200, headers)
            fs.createReadStream(filePath).pipe(response)
            statusCode = 200
          }
        }
      } else {
        finish(404, { "Content-Type": "application/json; charset=utf-8" }, '{"error":"not found"}')
      }
    } else {
      finish(404, { "Content-Type": "application/json; charset=utf-8" }, '{"error":"not found"}')
    }
  }
}

function parseArgs(args) {
  const options = { port: 8484, host: "127.0.0.1" }
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--port" && args[index + 1] !== undefined) {
      options.port = Number(args[++index])
    } else if (args[index] === "--host" && args[index + 1] !== undefined) {
      options.host = args[++index]
    } else {
      throw new Error(`unknown or incomplete argument: ${args[index]}`)
    }
  }
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error("port must be an integer from 0 to 65535")
  }
  return options
}

module.exports = { createRequestHandler, livePlaylist, parseArgs, parsePlaylist, parseRange }

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2))
  const preferences = fs.readFileSync(path.join(ROOT, "preferences.svitle.json"), "utf8")
  const status = fs.readFileSync(path.join(ROOT, "status.json"), "utf8")
  const playlistFixture = parsePlaylist(fs.readFileSync(path.join(HLS_ROOT, "index.m3u8"), "utf8"))
  const mediaFiles = new Set(fs.readdirSync(HLS_ROOT))
  const server = http.createServer(
    createRequestHandler({ preferences, status, playlistFixture, mediaFiles }),
  )
  server.listen(options.port, options.host, () => {
    const address = server.address()
    if (!address || typeof address === "string") throw new Error("server has no TCP address")
    process.stdout.write(`listening on http://${options.host}:${address.port}\n`)
  })
}
