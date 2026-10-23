import * as React from "react"
import { useObserver } from "mobx-react-lite"
import { TouchableOpacity, Text, View, StyleSheet, ScrollView } from "react-native"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { Screen, FooterLink, Logo } from "../components"
import i18n from "i18n-js"
import { useStores } from "../models/root-store"
import { Station } from "../models/station"
import { colors } from "../theme"
import { PrimaryParamList } from "../navigation/types"

// The station logos have different aspect ratios; each is fitted into the same box so the text
// column starts at one x on every row.
const LOGO_WIDTH = 104
const LOGO_HEIGHT = 56

export const StreamsScreen: React.FunctionComponent<
  BottomTabScreenProps<PrimaryParamList, "streams">
> = (props) => {
  const { mainStore } = useStores()

  const stationComponent = (station: Station, index: number, stations: Station[]) => {
    const onPress = () => {
      mainStore.local.setStation(station.id)
      props.navigation.navigate("live")
    }

    const selected = mainStore.local.station === station.id
    const last = index === stations.length - 1
    return (
      <TouchableOpacity
        disabled={selected}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[styles.stream, !last && styles.streamDivider, selected && styles.streamSelected]}
        onPress={onPress}
        key={station.id}
        testID={"streams.item." + station.id}
      >
        <View style={styles.streamLogo}>
          <Logo station={station} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
        </View>
        <View style={styles.streamText}>
          <Text style={[styles.streamName, selected && styles.streamNameSelected]}>
            {station.name}
          </Text>
          <Text style={styles.streamLang}>{i18n.t("streams_screen.lang." + station.lang)}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return useObserver(() => (
    <Screen title={i18n.t("streams_screen.title")} testID="screen.streams">
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        testID="streams.list"
      >
        {mainStore.preferences.stations.map(stationComponent)}
      </ScrollView>
      <View style={styles.footer}>
        <FooterLink
          url={mainStore.preferences.localizedUrl("archive")}
          icon="archive"
          text="streams_screen.archive"
        />
        <FooterLink
          url={mainStore.preferences.localizedUrl("youtube")}
          icon="video"
          text="streams_screen.youtube"
        />
      </View>
    </Screen>
  ))
}

const styles = StyleSheet.create({
  // A plain list: rows keep their own height on every screen size (and under large OS text),
  // the list scrolls when it does not fit, and on wide displays it is capped and centred.
  list: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingTop: 4,
    paddingBottom: 16,
  },
  stream: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 88,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 20,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  streamDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  // Selected is shown by the tint, the edge bar, and the bold name, not by colour alone.
  streamSelected: {
    backgroundColor: colors.menuBackgroundActive,
    borderLeftColor: colors.primary,
  },
  streamLogo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  streamText: {
    flex: 1,
  },
  streamName: {
    fontSize: 18,
    color: colors.text,
  },
  streamNameSelected: {
    fontWeight: "600",
  },
  streamLang: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
})
