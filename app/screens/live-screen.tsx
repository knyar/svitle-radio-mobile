import * as React from "react"
import { observer } from "mobx-react-lite"
import { TouchableOpacity, Text, View, StyleSheet } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { Screen, Player } from "../components"
// import { useStores } from "../models/root-store"
import i18n from "i18n-js"
import { colors } from "../theme"
import SvetloeLogo from "../images/svetloe.svg"
import IconSupport from '../images/icon.support.svg'
import IconQuality from '../images/icon.check.active.svg'

export interface LiveScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}


export const LiveScreen: React.FunctionComponent<LiveScreenProps> = observer((props) => {
  // const { someStore } = useStores()

  return (
    <Screen>
      <View style={styles.logo}>
        <SvetloeLogo width={300} style={styles.logoImage}/>
      </View>
      <View style={styles.player}>
        <Player />
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerLink}>
          <IconSupport height={18} style={styles.footerIcon} fill={colors.primary}/>
          <Text style={styles.footerText}>{i18n.t("live_screen.support_radio")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerLink}>
          <IconQuality height={18} style={styles.footerIcon} fill={colors.primary}/>
          <Text style={styles.footerText}>{i18n.t("live_screen.save_traffic")}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
})

const styles = StyleSheet.create({
  logo: {
    flex: 1,
    marginTop: 80,
  },
  logoImage: {
    maxWidth: "50%",
    flexShrink: 1,
  },
  player: {
    width: "100%",
    flex: 4,
  },
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
    padding: 7,
  },
})