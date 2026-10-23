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

// Spacing follows a 4 dp scale. Every channel is one row of intrinsic height: the logo sits in a
// fixed box so the four marks read at one size, and the text below it sets the rest, so large OS
// text and wrapped names only make a row taller. The empty spacers around the rows carry the
// growth instead: they widen evenly from GAP_MIN to GAP_MAX when the screen has room, the block
// centres in what is left, and the list scrolls when it does not fit (short phones, large text,
// more channels from the API).
const LOGO_WIDTH = 220
const LOGO_HEIGHT = 72
const GAP_MIN = 8
const GAP_MAX = 32
const LIST_MAX_WIDTH = 480

export const StreamsScreen: React.FunctionComponent<
  BottomTabScreenProps<PrimaryParamList, "streams">
> = (props) => {
  const { mainStore } = useStores()

  const stationComponent = (station: Station) => {
    const onPress = () => {
      mainStore.local.setStation(station.id)
      props.navigation.navigate("live")
    }

    const selected = mainStore.local.station === station.id
    return (
      <TouchableOpacity
        disabled={selected}
        style={[styles.stream, selected && styles.streamSelected]}
        onPress={onPress}
        testID={"streams.item." + station.id}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: selected }}
      >
        <Logo station={station} style={styles.streamLogo} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
        <Text style={[styles.streamText, selected && styles.streamTextSelected]}>
          {station.name}
        </Text>
        <Text style={styles.streamLang}>{i18n.t("streams_screen.lang." + station.lang)}</Text>
      </TouchableOpacity>
    )
  }

  return useObserver(() => (
    <Screen title={i18n.t("streams_screen.title")} testID="screen.streams">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.selector}>
          <View style={styles.gap} />
          {mainStore.preferences.stations.map((station) => (
            <React.Fragment key={station.id}>
              {stationComponent(station)}
              <View style={styles.gap} />
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <FooterLink
          url={mainStore.preferences.localizedUrl("archive")}
          icon="archive"
          text="streams_screen.archive"
          style={styles.footerLink}
        />
        <FooterLink
          url={mainStore.preferences.localizedUrl("youtube")}
          icon="video"
          text="streams_screen.youtube"
          style={styles.footerLink}
        />
      </View>
    </Screen>
  ))
}

const styles = StyleSheet.create({
  scroll: {
    alignSelf: "stretch",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  selector: {
    alignSelf: "center",
    flexGrow: 1,
    justifyContent: "center",
    maxWidth: LIST_MAX_WIDTH,
    width: "100%",
  },
  gap: {
    flexGrow: 1,
    maxHeight: GAP_MAX,
    minHeight: GAP_MIN,
  },
  stream: {
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  streamSelected: { backgroundColor: colors.menuBackgroundActive },
  streamLogo: {
    marginBottom: 12,
  },
  streamText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
  streamTextSelected: {
    fontWeight: "600",
  },
  streamLang: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 4,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    alignSelf: "stretch",
    columnGap: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footerLink: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
})
