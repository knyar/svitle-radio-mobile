import React, { useEffect, useState } from "react"
import { useObserver } from "mobx-react-lite"
import { Text, View, ImageBackground, StyleSheet, TouchableOpacity, AppState, Platform } from "react-native"
import TrackPlayer, { usePlaybackState } from "react-native-track-player";
import i18n from "i18n-js"
import { useStores } from "../models/root-store"
import PlayButton from "../images/button.play.svg"
import PauseButton from "../images/button.pause.svg"
import { colors } from "../theme"
import { UserAgent } from "../services/api"
const { FLAVOR } = require("../config/flavor")


const PLAYER_OPTIONS = {
  playBuffer: 5,  // Android only
  minBuffer: 10,  // iOS & Android
  maxBuffer: 20, // Android only
  waitForBuffer: true,  // iOS only
}

const background = (): any => {
  return {
    svitle: require("../images/bg.svitle.png"),
    svetloe: require("../images/bg.svetloe.png"),
  }[FLAVOR]
}

const artwork = (logo: string): any => {
  const artworks = {
    svitle: require("../images/artwork.svitle.png"),
    svetloe: require("../images/artwork.svetloe.png"),
    kids: require("../images/artwork.kids.png"),
  }
  return artworks[logo]
}

interface NowPlayingProps {
  header: string,
  text?: string
}
const NowPlaying: React.FunctionComponent<NowPlayingProps> = props => {
  if (!props.text) { return null }
  return (
    <View>
      <Text style={styles.npHeader}>{i18n.t(props.header)}</Text>
      <Text style={styles.npText}>{props.text}</Text>
    </View>
  )
}

interface ButtonProps {
  url?: string,
  playbackState: TrackPlayer.State,
  toggle: () => void,
}
export const Button: React.FunctionComponent<ButtonProps> = props => {
  let ButtonComponent = PlayButton
  let enabled = !!props.url
  switch (props.playbackState) {
    case TrackPlayer.STATE_PLAYING:
      ButtonComponent = PauseButton
      break
    case TrackPlayer.STATE_BUFFERING:
    case TrackPlayer.STATE_CONNECTING:
      enabled = false
      break
  }

  if (!enabled) {
    return <ButtonComponent height="200" style={[styles.buttonImage, styles.buttonDisabled]} fill={colors.primary}/>
  }

  return useObserver(() => (
    <TouchableOpacity onPress={props.toggle}>
      <ButtonComponent height="200" style={[styles.buttonImage]} fill={colors.primary} />
    </TouchableOpacity>
  ))
}

export interface PlayerProps {
  url?: string,
  current_track: string,
}
export const Player: React.FunctionComponent<PlayerProps> = props => {
  const { mainStore } = useStores()
  const playbackState = usePlaybackState()
  const [currentStation, setCurrentStation] = useState(mainStore.local.station)

  const _handleAppStateChange = appState => {
    console.log("App state: " + appState)
    if (appState === "active") {
      mainStore.updateStreamInfo()
    }
    // Clear track information while going to background on Android.
    // This is necessary because Android app will be stopped and no streaminfo
    // updates will be happening until it's back in foreground.
    if ((Platform.OS === 'android') && (appState != "active")) {
      const metadata = trackMetadata()
      metadata.title = ""
      safely(TrackPlayer.updateMetadataForTrack, props.url, metadata)
    }
  }
  useEffect(() => {
    AppState.addEventListener("change", _handleAppStateChange)
    console.log("Player mounted")
    return () => {
      AppState.removeEventListener("change", _handleAppStateChange)
      console.log("Player unmounted")
     }
  }, [])

  async function setupPlayer() {
    try {
      if (await TrackPlayer.isServiceRunning()) {
        console.log("Player already running on setupPlayer; skipping")
        return
      }
      await TrackPlayer.setupPlayer(PLAYER_OPTIONS)
      await TrackPlayer.updateOptions({
        capabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_STOP
        ],
        compactCapabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_STOP
        ]
      });
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    setupPlayer()
  }, [])

  const trackMetadata = (): any => {
    return {
      id: props.url,
      artwork: artwork(mainStore.current_station.logo),
      artist: mainStore.current_station.name,
      title: mainStore.current_track || "",
    }
  }

  useEffect(() => {
    ;(async () => {
      if (playbackState != TrackPlayer.STATE_PLAYING &&
        playbackState != TrackPlayer.STATE_BUFFERING &&
        playbackState != TrackPlayer.STATE_PAUSED) {
          return
      }
      const currentTrack = await TrackPlayer.getCurrentTrack()
      if (currentTrack && (currentTrack == props.url)) {
        const metadata = trackMetadata()
        await safely(TrackPlayer.updateMetadataForTrack, props.url, metadata)
      }
    })()
  }, [props.current_track])

  async function updateTrack() {
    try {
      const running = await TrackPlayer.isServiceRunning()
      if (!running) { await setupPlayer() }
      const currentTrack = await TrackPlayer.getCurrentTrack()
      if (props.url && (currentTrack != props.url)) {
        const prevState = playbackState
        console.log("Loading " + props.url + " instead of " + currentTrack + "; state: " + prevState)
        await safely(TrackPlayer.reset)
        let track = trackMetadata()
        track.url = props.url
        track.userAgent = UserAgent()
        track.type = props.url.endsWith(".m3u8") ? "hls" : "default"
        await safely(TrackPlayer.add, track)
        if (prevState == TrackPlayer.STATE_PLAYING) {
          await safely(TrackPlayer.play)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    console.log("Playback state: " + playbackState)
  }, [playbackState])

  useEffect(() => {
    ;(async () => {
      await updateTrack()
      // Start playback when station is changed.
      if (mainStore.local.station && (mainStore.local.station != currentStation)) {
        console.log("Starting playback. Prev station " + currentStation + ". New station " + mainStore.local.station)
        await safely(TrackPlayer.play)
      }
      setCurrentStation(mainStore.local.station)
    })()
  }, [props.url])

  async function togglePlayback() {
    try {
      if (playbackState == TrackPlayer.STATE_PLAYING) {
        await safely(TrackPlayer.pause)
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
      <ImageBackground style={styles.lines} source={background()}>
        <Button url={props.url} playbackState={playbackState} toggle={togglePlayback}/>
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

async function safely(action, ...args) {
  try {
    return await action(...args)
  } catch (e) {
    if (e.message === 'The playback is not initialized') {
      // reinitialize player and retry
      try {
        await TrackPlayer.setupPlayer(PLAYER_OPTIONS)
        return await action(...args)
      } catch (e) {
        console.error(e)
        return null
      }
    }
    console.error(e)
    return null
  }
}
