# Hermetic end-to-end API

`server.js` serves the preferences and status endpoints used by the app, logo fixtures under
`/logos/`, and a looping live HLS stream for every fixture station. It uses only Node built-ins,
binds to `127.0.0.1:8484` by default, and derives fixture origins from a validated request `Host`
header so Android can use `10.0.2.2` while iOS uses host loopback. Both preferences and status
fixtures may use `{{origin}}`, which is replaced with that request origin.

Run it directly with `node scripts/e2e-api/server.js`. `--host` and `--port` override the bind
address; `--port 0` chooses an ephemeral port for tests. The e2e scripts always use fixed port 8484
because that URL is embedded in the app artifacts.

The HLS fixture was generated once with:

```sh
ffmpeg -f lavfi -i anullsrc=r=22050:cl=mono -t 60 -c:a aac -b:a 16k -f hls \
  -hls_time 10 -hls_list_size 0 -hls_segment_type fmp4 \
  -hls_fmp4_init_filename init.mp4 -hls_segment_filename seg%03d.m4s index.m3u8
```

The 46 ms tail (`seg006.m4s` and its two playlist lines) was dropped. The committed files were
validated with `ffprobe`; the server converts the VOD index into a moving live window and inserts a
discontinuity whenever playback wraps from `seg005.m4s` to `seg000.m4s`.

To point a debug build at this server, temporarily use its URL in `app/config/env.ts`, or add the
same `buildConfigField` used by the Android `e2e` build type to `debug`. Android emulators reach the
host at `http://10.0.2.2:8484/v2`; iOS simulators use `http://127.0.0.1:8484/v2`.
