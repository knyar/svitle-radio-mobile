import React, { useCallback, useEffect, useRef, useState } from "react"
import { useObserver } from "mobx-react-lite"
import { Text, View, ImageBackground, StyleSheet, TouchableOpacity, AppState } from "react-native"
import TrackPlayer, {
  usePlaybackState,
  State,
  Capability,
  AppKilledPlaybackBehavior,
  TrackMetadataBase,
  Track,
  TrackType,
  PlayerOptions,
} from "react-native-track-player"
import i18n from "i18n-js"
import { useStores } from "../models/root-store"
import PlayButton from "../images/button.play.svg"
import PauseButton from "../images/button.pause.svg"
import { colors } from "../theme"
import { UserAgent } from "../services/api"
import { buttonState, isStreamInfoStale } from "../utils/player-state"
import { FLAVOR, Flavor } from "../config/flavor"
import { REFRESH_INTERVAL } from "../config/env"
import { LogoId } from "../models/station"
import { lookup } from "./logo"
import { errorMessage } from "../utils/errors"
import { isRemoteLogo, isSvgUrl } from "../utils/logo-source"

const PLAYER_OPTIONS: PlayerOptions = {
  playBuffer: 5, // Android only
  minBuffer: 10, // iOS & Android
  maxBuffer: 20, // Android only
  waitForBuffer: true, // iOS only
}

async function setupPlayer() {
  try {
    await TrackPlayer.setupPlayer(PLAYER_OPTIONS)
    await TrackPlayer.updateOptions({
      capabilities: [Capability.Pause],
      compactCapabilities: [Capability.Pause],
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
    })
  } catch (error) {
    if (!errorMessage(error).includes("The player has already been initialized via setupPlayer")) {
      console.log("setupPlayer", error)
    }
  }
}

const backgrounds: Record<Flavor, number> = {
  svitle: require("../images/bg.svitle.png"),
  svetloe: require("../images/bg.svetloe.png"),
}
const BACKGROUND = backgrounds[FLAVOR]

const artwork = (logo: string): any => {
  if (isRemoteLogo(logo)) {
    return isSvgUrl(logo) ? undefined : logo
  }
  const artworks: Record<LogoId, any> = {
    svitle: require("../images/artwork.svitle.png"),
    svetloe: require("../images/artwork.svetloe.png"),
    kids: require("../images/artwork.kids.png"),
  }
  return lookup(artworks, logo)
}

interface NowPlayingProps {
  header: string
  text?: string
}
const NowPlaying: React.FunctionComponent<NowPlayingProps> = (props) => {
  if (!props.text) {
    return null
  }
  return (
    <View>
      <Text style={styles.npHeader}>{i18n.t(props.header)}</Text>
      <Text style={styles.npText}>{props.text}</Text>
    </View>
  )
}

interface ButtonProps {
  url?: string
  playbackState: State | undefined
  toggle: () => void
}
export const Button: React.FunctionComponent<ButtonProps> = (props) => {
  const { enabled, variant, labelKey } = buttonState(props.url, props.playbackState)
  const ButtonComponent = variant === "pause" ? PauseButton : PlayButton

  if (!enabled) {
    return (
      <View testID="player.disabled" style={styles.buttonDisabledWrapper}>
        <ButtonComponent
          height="200"
          style={[styles.buttonImage, styles.buttonDisabled]}
          fill={colors.primary}
        />
      </View>
    )
  }

  return (
    <TouchableOpacity
      onPress={props.toggle}
      accessibilityLabel={i18n.t(labelKey)}
      testID={variant === "pause" ? "player.pause" : "player.play"}
    >
      <ButtonComponent height="200" style={[styles.buttonImage]} fill={colors.primary} />
    </TouchableOpacity>
  )
}

export interface PlayerProps {
  url?: string
  current_track?: string
  streams_updated: number
}
export const Player: React.FunctionComponent<PlayerProps> = (props) => {
  const { mainStore } = useStores()
  const playbackState = usePlaybackState()
  const [appState, setAppState] = useState(AppState.currentState)
  const [tick, setTick] = useState(0)
  // Read through a ref so a stream-info refresh does not recreate trackMetadata/load and re-run
  // the URL effect; the metadata-sync effect below keys on the timestamp itself.
  const streamsUpdatedRef = useRef(props.streams_updated)
  streamsUpdatedRef.current = props.streams_updated
  const stateRef = useRef(playbackState.state)
  stateRef.current = playbackState.state
  const queueRef = useRef<Promise<unknown>>(Promise.resolve())
  const loadGenerationRef = useRef(0)

  // Component operations are serialized, not transactional: an operation that has started finishes
  // before a later stop/load, and a successful reset followed by a failed add still leaves the queue
  // empty. A never-settling TrackPlayer promise stalls later operations. The playback service mutates
  // TrackPlayer outside this queue in response to remote controls.
  const enqueue = useCallback(<T,>(op: () => Promise<T>): Promise<T | undefined> => {
    const run = queueRef.current.then(op, op)
    const settled = run.catch((error: unknown) => {
      console.log("[Player] operation failed", error)
      return undefined
    })
    queueRef.current = settled
    return settled
  }, [])

  // Hide stream info older than twice the refresh interval. This covers a frozen process, offline
  // operation, and failed refreshes; iOS suspends JavaScript in the background anyway.
  const trackMetadata = useCallback((): TrackMetadataBase => {
    const stale = isStreamInfoStale(streamsUpdatedRef.current, Date.now(), REFRESH_INTERVAL)
    return {
      artwork: artwork(mainStore.current_station?.logo ?? ""),
      artist: mainStore.current_station?.name ?? "",
      title: stale ? "" : mainStore.current_track ?? "",
    }
  }, [mainStore])

  const load = useCallback(
    (url: string | undefined, autoplay: boolean) => {
      const generation = ++loadGenerationRef.current
      return enqueue(async () => {
        if (generation !== loadGenerationRef.current) return "skipped"

        const requested = mainStore.local.play_requested
        const play = autoplay || (!!url && requested)
        const running = await TrackPlayer.isServiceRunning()
        if (!running) {
          await setupPlayer()
        }
        const currentTrack = await TrackPlayer.getActiveTrack()
        const active = currentTrack?.url
        if (url && active !== url) {
          console.log("Loading " + url + " instead of " + active)
          await safely(TrackPlayer.reset)
          const track: Track = {
            url,
            userAgent: UserAgent(),
            type: url.endsWith(".m3u8") ? TrackType.HLS : TrackType.Default,
            ...trackMetadata(),
          }
          await safely(TrackPlayer.add, track)
        }
        // A second play for an already loaded/playing URL is an RNTP no-op and is accepted.
        if (url && play) {
          // A play request is consumed only while this load is still the latest. If the URL was
          // replaced while this load was in flight (a stream-info refresh after a station was
          // selected from persisted data), the queued replacement captured a non-playing state and
          // inherits the request instead; a stop clears it. Consumed before play, so one attempt.
          if (requested && generation === loadGenerationRef.current) {
            mainStore.local.clearPlayRequest()
          }
          await safely(TrackPlayer.play)
        }
        return active !== url ? "loaded" : "unchanged"
      })
    },
    [enqueue, mainStore, trackMetadata],
  )

  // A stop also cancels a play request whose load has not started yet: that load is superseded
  // here and would otherwise leave the request for an unrelated later URL change to consume.
  const stop = useCallback(() => {
    ++loadGenerationRef.current
    mainStore.local.clearPlayRequest()
    return enqueue(() => safely(TrackPlayer.reset))
  }, [enqueue, mainStore])

  useEffect(() => {
    const sub = AppState.addEventListener("change", setAppState)
    console.log("Player mounted")
    return () => {
      sub.remove()
      console.log("Player unmounted")
    }
  }, [])

  useEffect(() => {
    if (appState === "active") {
      mainStore.updateStreamInfo()
    }
  }, [appState, mainStore])

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    enqueue(setupPlayer)
  }, [enqueue])

  useEffect(() => {
    enqueue(async () => {
      if (
        playbackState.state !== State.Playing &&
        playbackState.state !== State.Buffering &&
        playbackState.state !== State.Paused
      ) {
        return
      }
      const currentTrack = await TrackPlayer.getActiveTrack()
      if (currentTrack?.url && currentTrack.url === props.url) {
        const metadata = trackMetadata()
        const currentTrackIdx = await safely(TrackPlayer.getCurrentTrack)
        if (currentTrackIdx != null) {
          await safely(TrackPlayer.updateMetadataForTrack, currentTrackIdx, metadata)
        }
      }
    })
  }, [
    props.current_track,
    props.streams_updated,
    props.url,
    playbackState.state,
    tick,
    trackMetadata,
    enqueue,
  ])

  useEffect(() => {
    console.log("Playback state: " + playbackState.state)
  }, [playbackState])

  const station = mainStore.local.station
  useEffect(() => {
    load(props.url, stateRef.current === State.Playing)
  }, [props.url, station, load])

  function togglePlayback() {
    if (stateRef.current === State.Playing) {
      stop()
    } else {
      load(props.url, true)
    }
  }

  return useObserver(() => (
    <View style={styles.container}>
      <ImageBackground style={styles.lines} source={BACKGROUND} resizeMode="stretch">
        <Button url={props.url} playbackState={playbackState.state} toggle={togglePlayback} />
      </ImageBackground>
      <View style={styles.npContainer}>
        <NowPlaying header="live_screen.player_now" text={mainStore.current_track} />
        <NowPlaying header="live_screen.player_next" text={mainStore.next_track} />
      </View>
    </View>
  ))
}

const styles = StyleSheet.create({
  container: {
    width: "100%",

    flexDirection: "column",
    flex: 1,
    alignItems: "center",
  },
  lines: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonImage: {
    maxWidth: "33%",
    flexShrink: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Full width so the SVG's percentage maxWidth still resolves against the
  // ImageBackground, as it did before the testID wrapper was added.
  buttonDisabledWrapper: {
    width: "100%",
    alignItems: "center",
  },
  npContainer: {
    flex: 0.6,
    width: 220,
  },
  npHeader: {
    fontWeight: "bold",
    color: colors.text,
  },
  npText: {
    marginBottom: 10,
    color: colors.text,
  },
})

async function safely<T extends unknown[], R>(
  action: (...args: T) => Promise<R>,
  ...args: T
): Promise<R | null> {
  const methodName = action?.name || "unknown"
  try {
    console.log(`[TrackPlayer] Calling ${methodName}`)
    return await action(...args)
  } catch (e: unknown) {
    if (errorMessage(e).includes("The player is not initialized")) {
      // reinitialize player and retry
      try {
        await setupPlayer()
        return await action(...args)
      } catch (retryError) {
        console.error(`[TrackPlayer] safely err after init for ${methodName}:`, retryError)
        return null
      }
    }
    console.error(`[TrackPlayer] safely err for ${methodName}:`, e)
    return null
  }
}
