import * as React from "react"
import { useObserver } from "mobx-react-lite"
import { Text, View, ImageBackground, StyleSheet, TouchableOpacity } from "react-native"
import i18n from "i18n-js"
import { useStores } from "../../models/root-store"
import PlayButton from "../../images/button.play.svg"
import { colors } from "../../theme"

export interface PlayerProps {
}

/**
 * React.FunctionComponent for your hook(s) needs
 *
 * Component description here for TypeScript tips.
 */
export const Player: React.FunctionComponent<PlayerProps> = props => {
  // const { someStore } = useStores()

  return useObserver(() => (
    <View style={styles.container}>
      <ImageBackground style={styles.lines} source={require('../../images/lines.png')}>
        <TouchableOpacity style={styles.button}>
          <PlayButton height="200" style={styles.buttonImage} fill={colors.primary} />
        </TouchableOpacity>
      </ImageBackground>
        <View style={styles.npContainer}>
          <Text style={styles.npHeader}>{i18n.t("live_screen.player_now")}</Text>
          <Text style={styles.npText}>Скороход Василий - Этот День</Text>
          <Text style={styles.npHeader}>{i18n.t("live_screen.player_next")}</Text>
          <Text style={styles.npText}>«Світле освідчення»</Text>
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