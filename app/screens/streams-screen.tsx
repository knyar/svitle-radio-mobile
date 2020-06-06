import * as React from "react"
import { useObserver } from "mobx-react-lite"
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { Screen, FooterLink, Logo } from "../components"
import i18n from "i18n-js"
import { useStores } from "../models/root-store"
import { Station } from "../models/station"
import { colors } from "../theme"

export interface StreamsScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const StreamsScreen: React.FunctionComponent<StreamsScreenProps> = (props) => {
  const { mainStore } = useStores()

  const stationComponent = (station: Station) => {
    const onPress = () => mainStore.local.setStation(station.id)
    let style: ViewStyle[] = [styles.stream]
    if (mainStore.local.station == station.id) {
      style.push(styles.streamSelected)
    }

    return useObserver(() => (
      <TouchableOpacity style={style} onPress={onPress} key={station.id}>
        <View style={styles.streamContainer}>
          <Logo id={station.logo} style={styles.streamLogo} height={80}/>
          <Text style={styles.streamText}>{station.name}</Text>
        </View>
      </TouchableOpacity>
    ))
  }

  return useObserver(() => (
    <Screen title={i18n.t("streams_screen.title")}>
      <View style={styles.selector}>
        {mainStore.preferences.stations.map(stationComponent)}
      </View>
      <View style={styles.footer}>
        <FooterLink url={mainStore.preferences.url_archive}
          icon="archive" text="streams_screen.archive"/>
        <FooterLink url={mainStore.preferences.url_youtube}
          icon="video" text="streams_screen.youtube"/>
      </View>
    </Screen>
  ))
}

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
})
