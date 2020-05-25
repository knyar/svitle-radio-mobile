import * as React from "react"
import { useObserver } from "mobx-react-lite"
import { Text, View, ImageBackground, StyleSheet, TouchableOpacity } from "react-native"
import i18n from "i18n-js"
import { useStores } from "../../models/root-store"
import PlayButton from "../../images/button.play.svg"
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

export interface PlayerProps {}
export const Player: React.FunctionComponent<PlayerProps> = props => {
  const { mainStore } = useStores()

  return useObserver(() => (
    <View style={styles.container}>
      <ImageBackground style={styles.lines} source={require('../../images/lines.png')}>
        <TouchableOpacity style={styles.button} onPress={mainStore.updateStreamInfo}>
          <PlayButton height="200" style={styles.buttonImage} fill={colors.primary} />
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
