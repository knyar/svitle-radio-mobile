import * as React from "react"
import { observer, useObserver } from "mobx-react-lite"
import { View, StyleSheet } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { Screen, Player, FooterLink, FooterCheckbox } from "../components"
import { useStores } from "../models/root-store"
import SvetloeLogo from "../images/svetloe.svg"

export interface LiveScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const LiveScreen: React.FunctionComponent<LiveScreenProps> = observer((props) => {
  const { preferencesStore } = useStores()

  return useObserver(() => (
    <Screen>
      <View style={styles.logo}>
        <SvetloeLogo width={300} style={styles.logoImage}/>
      </View>
      <View style={styles.player}>
        <Player />
      </View>
      <View style={styles.footer}>
        <FooterLink url={preferencesStore.preferences.url_support}
          icon="support" text="live_screen.support_radio"/>
        <FooterCheckbox text="live_screen.save_traffic"/>
      </View>
    </Screen>
  ))
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
})