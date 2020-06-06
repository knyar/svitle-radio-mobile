import React, { useEffect } from "react"
import { useObserver } from "mobx-react-lite"
import { Text, View, ImageBackground, StyleSheet, ViewStyle, TouchableOpacity, Platform } from "react-native"
import TrackPlayer, { useTrackPlayerEvents, usePlaybackState } from "react-native-track-player";
import i18n from "i18n-js"
import { useStores } from "../models/root-store"
import PlayButton from "../images/button.play.svg"
import PauseButton from "../images/button.pause.svg"
import { colors } from "../theme"

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
  playbackState: string,
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
    case TrackPlayer.STATE_PAUSED:
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
}
export const Player: React.FunctionComponent<PlayerProps> = props => {
  const { mainStore } = useStores()
  const playbackState = usePlaybackState();
  if (Platform.OS === 'android') {
    // TODO: also use this for iOS when it's supported
    // https://github.com/react-native-kit/react-native-track-player/issues/933
    useTrackPlayerEvents(["playback-metadata-received"], async () => {
      mainStore.updateStreamInfo()
    })
  }

  async function setupPlayer() {
    try {
      const buffer = 0.2;
      await TrackPlayer.setupPlayer({
        playBuffer: buffer,
        minBuffer: buffer * 2,
        maxBuffer: buffer * 2,
        waitForBuffer: true,
      });
      await TrackPlayer.updateOptions({
        capabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_PAUSE,
          TrackPlayer.CAPABILITY_STOP
        ],
        compactCapabilities: [
          TrackPlayer.CAPABILITY_PLAY,
          TrackPlayer.CAPABILITY_PAUSE
        ]
      });
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    setupPlayer()
  }, [])

  async function updateTrack() {
    try {
      const currentTrack = await TrackPlayer.getCurrentTrack()
      if (props.url && (currentTrack != props.url)) {
        const prevState = playbackState
        console.log("Loading " + props.url + " instead of " + currentTrack + "; state: " + prevState)
        await TrackPlayer.reset()
        await TrackPlayer.add({
          id: props.url,
          url: props.url,
          artist: mainStore.current_station.name || "",
          title: mainStore.current_track || "",
        })
        if (prevState == TrackPlayer.STATE_PLAYING) {
          await TrackPlayer.play()
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    updateTrack()
  }, [props.url])

  async function togglePlayback() {
    try {
      if (playbackState == TrackPlayer.STATE_PLAYING) {
        await TrackPlayer.stop()
      } else {
        await updateTrack()
        await TrackPlayer.play()
      }
    } catch (error) {
      console.log(error)
    }
  }

  return useObserver(() => (
    <View style={styles.container}>
      <ImageBackground style={styles.lines} source={require('../images/lines.png')}>
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
