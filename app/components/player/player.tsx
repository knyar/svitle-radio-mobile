import React, { useEffect } from "react"
import { useObserver } from "mobx-react-lite"
import { Text, View, ImageBackground, StyleSheet, ViewStyle, TouchableOpacity } from "react-native"
import TrackPlayer, { useTrackPlayerEvents, usePlaybackState } from "react-native-track-player";
import i18n from "i18n-js"
import { useStores } from "../../models/root-store"
import PlayButton from "../../images/button.play.svg"
import PauseButton from "../../images/button.pause.svg"
import { colors } from "../../theme"

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

export interface PlayerProps {
  url?: string,
}
export const Player: React.FunctionComponent<PlayerProps> = props => {
  const { mainStore } = useStores()
  const playbackState = usePlaybackState();
  useTrackPlayerEvents(["playback-metadata-received"], async () => {
    mainStore.updateStreamInfo()
  })

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
    console.log("Playbook state: " + playbackState)
  }, [playbackState])

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

  let ButtonComponent = PlayButton
  let buttonStyle: ViewStyle = { }
  switch (playbackState) {
    case TrackPlayer.STATE_PLAYING:
      ButtonComponent = PauseButton
      break
    case TrackPlayer.STATE_BUFFERING:
    case TrackPlayer.STATE_PAUSED:
    case TrackPlayer.STATE_CONNECTING:
      buttonStyle.opacity = 0.5
      break
  }

  return useObserver(() => (
    <View style={styles.container}>
      <ImageBackground style={styles.lines} source={require('../../images/lines.png')}>
        <TouchableOpacity style={styles.button} onPress={togglePlayback}>
          <ButtonComponent height="200" style={[styles.buttonImage, buttonStyle]} fill={colors.primary} />
        </TouchableOpacity>
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
  button: {
  },
  buttonImage: {
    maxWidth: "33%",
    flexShrink: 1,
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
