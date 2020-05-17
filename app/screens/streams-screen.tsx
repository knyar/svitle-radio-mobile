import * as React from "react"
import { observer } from "mobx-react-lite"
import { TouchableOpacity, Text, View, StyleSheet, Linking } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { Screen } from "../components"
import i18n from "i18n-js"
// import { useStores } from "../models/root-store"
import { colors } from "../theme"
import IconArchive from '../images/icon.archive.svg'
import IconVideo from '../images/icon.video.svg'
import PlayButton from "../images/button.play.svg"
import PauseButton from "../images/button.pause.svg"
import SvetloeLogo from "../images/svetloe.svg"
import SvitleLogo from "../images/svitle.svg"

export interface StreamsScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const StreamsScreen: React.FunctionComponent<StreamsScreenProps> = observer((props) => {
  // const { someStore } = useStores()
  return (
    <Screen title={i18n.t("streams_screen.title")}>
      <View style={styles.selector}>
        <TouchableOpacity style={[styles.stream, styles.streamSelected]}>
          <View style={styles.streamContainer}>
            <PauseButton style={styles.streamButton} height={80} fill={colors.primary} />
            <SvetloeLogo style={styles.streamLogo} height={80} />
            <Text style={styles.streamText}>{i18n.t("streams_screen.radios.svetloe")}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stream}>
          <View style={styles.streamContainer}>
            <PlayButton style={styles.streamButton} height={80} fill={colors.primary} />
            <SvitleLogo style={styles.streamLogo} height={80} />
            <Text style={styles.streamText}>{i18n.t("streams_screen.radios.svitle")}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stream}>
          <View style={styles.streamContainer}>
            <PlayButton style={styles.streamButton} height={80} fill={colors.primary} />
            <SvetloeLogo style={styles.streamLogo} height={80} />
            <Text style={styles.streamText}>{i18n.t("streams_screen.radios.kids")}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerLink}>
          <IconArchive height={17} style={styles.footerIcon} fill={colors.primary}/>
          <Text style={styles.footerText}>{i18n.t("streams_screen.archive")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerLink}
            onPress={() => Linking.openURL("https://www.youtube.com/c/svitleradioEmmanuel/live")}>
          <IconVideo height={18} style={styles.footerIcon} fill={colors.primary}/>
          <Text style={styles.footerText}>{i18n.t("streams_screen.youtube")}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
})

const styles = StyleSheet.create({
  selector: {
    flexDirection: "column",
    width: "100%",
    flex: 5,
  },
  stream: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  streamContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  streamButton: {
    maxHeight: "21%",
  },
  streamLogo: {
    margin: 10,
    maxHeight: "25%",
  },
  streamText: {
    fontSize: 16,
    color: colors.text,
  },
  streamSelected: {backgroundColor: colors.menuBackgroundActive},
  footer: {
    width: "100%",
    flex: 0.8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  footerLink: {
    alignItems: "center",
    flexDirection: "row",
  },
  footerIcon: {
    flexShrink: 1,
  },
  footerText: {
    color: colors.primary,
    padding: 3,
  },
})