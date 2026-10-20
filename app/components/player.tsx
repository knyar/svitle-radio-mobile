import React, { useEffect, useState } from "react"
import { useObserver } from "mobx-react-lite"
import {
  Text,
  View,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Platform,
} from "react-native"
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
import { buttonState } from "../utils/player-state"
import { FLAVOR, Flavor } from "../config/flavor"
import { LogoId } from "../models/station"
import { lookup } from "./logo"
import { errorMessage } from "../utils/errors"

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
}
export const Player: React.FunctionComponent<PlayerProps> = (props) => {
  const { mainStore } = useStores()
  const playbackState = usePlaybackState()
  const [currentStation, setCurrentStation] = useState(mainStore.local.station)
  const [appState, setAppState] = useState(AppState.currentState)

  useEffect(() => {
    let sub = AppState.addEventListener("change", setAppState)
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
    // Clear track information while going to background on Android.
    // This is necessary because Android app will be stopped and no streaminfo
    // updates will be happening until it's back in foreground.
    if (Platform.OS === "android" && appState !== "active" && props.url) {
      const metadata = trackMetadata()
      metadata.title = ""
      setMetadata(metadata)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO(M3): deps intentionally incomplete; fixing changes effect timing
  }, [appState])

  useEffect(() => {
    setupPlayer()
  }, [])

  const trackMetadata = (): TrackMetadataBase => {
    return {
      artwork: artwork(mainStore.current_station?.logo ?? ""),
      artist: mainStore.current_station?.name ?? "",
      title: mainStore.current_track ?? "",
    }
  }

  async function currentTrackURL() {
    const currentTrack = await TrackPlayer.getActiveTrack()
    return currentTrack?.url
  }

  async function setMetadata(metadata: TrackMetadataBase) {
    const currentTrackIdx = await safely(TrackPlayer.getCurrentTrack)
    if (currentTrackIdx != null) {
      await safely(TrackPlayer.updateMetadataForTrack, currentTrackIdx, metadata)
    }
  }

  useEffect(() => {
    ;(async () => {
      if (
        playbackState.state !== State.Playing &&
        playbackState.state !== State.Buffering &&
        playbackState.state !== State.Paused
      ) {
        return
      }
      const currentTrack = await currentTrackURL()
      if (currentTrack && currentTrack === props.url) {
        const metadata = trackMetadata()
        await setMetadata(metadata)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO(M3): deps intentionally incomplete; fixing changes effect timing
  }, [props.current_track])

  async function updateTrack() {
    try {
      const running = await TrackPlayer.isServiceRunning()
      if (!running) {
        await setupPlayer()
      }
      const currentTrack = await currentTrackURL()
      if (props.url && currentTrack !== props.url) {
        const prevState = playbackState
        console.log(
          "Loading " + props.url + " instead of " + currentTrack + "; state: " + prevState.state,
        )
        await safely(TrackPlayer.reset)
        let metadata = trackMetadata()
        let track: Track = {
          url: props.url,
          userAgent: UserAgent(),
          type: props.url.endsWith(".m3u8") ? TrackType.HLS : TrackType.Default,
          ...metadata,
        }
        await safely(TrackPlayer.add, track)
        if (prevState.state === State.Playing) {
          await safely(TrackPlayer.play)
        }
      }
    } catch (error) {
      console.log("updateTrack error ", error)
    }
  }

  useEffect(() => {
    console.log("Playback state: " + playbackState.state)
  }, [playbackState])

  useEffect(() => {
    ;(async () => {
      await updateTrack()
      // Start playback when station is changed.
      if (mainStore.local.station && mainStore.local.station !== currentStation) {
        console.log(
          "Starting playback. Prev station " +
            currentStation +
            ". New station " +
            mainStore.local.station,
        )
        await safely(TrackPlayer.play)
      }
      setCurrentStation(mainStore.local.station)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO(M3): deps intentionally incomplete; fixing changes effect timing
  }, [props.url])

  async function togglePlayback() {
    try {
      if (playbackState.state === State.Playing) {
        await safely(TrackPlayer.reset)
      } else {
        await updateTrack()
        await safely(TrackPlayer.play)
      }
    } catch (error) {
      console.log(error)
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
