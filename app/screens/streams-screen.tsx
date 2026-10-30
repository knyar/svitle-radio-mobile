import * as React from "react"
import { useObserver } from "mobx-react-lite"
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { Screen, FooterLink, Logo } from "../components"
import i18n from "i18n-js"
import { useStores } from "../models/root-store"
import { Station } from "../models/station"
import { colors } from "../theme"
import { PrimaryParamList } from "../navigation/types"

// Spacing follows a 4 dp scale. Every channel is one tile of intrinsic height: the logo sits in a
// fixed box so the marks read at one size, and the text below it sets the rest, so large OS text
// and wrapped names only make a tile taller. Tiles sit one per row on phones and two per row as
// soon as two fit side by side (Surface Duo, tablets, landscape); the logo box grows only once
// two larger tiles fit, so widening the window never collapses the grid back to one column.
// The empty spacers between rows carry the vertical growth: they widen evenly from GAP_MIN to
// GAP_MAX when the screen has room; what is left goes one third above the block and two thirds
// below it, so on tall screens the channels sit at the optical centre under the header rather
// than at the geometric one. The footer links stay put above the tab bar, behind a hairline that
// the list scrolls under when it does not fit (short phones, large text, more channels from the
// API).
const SCREEN_PADDING = 16
const TILE_PADDING = 12
const COLUMN_GAP = 8
const GAP_MIN = 8
const GAP_MAX = 32
const LOGO = {
  compact: { width: 220, height: 72 },
  expanded: { width: 288, height: 96 },
}
const TILE_MAX_WIDTH: Record<number, number> = { 1: 480, 2: 360 }

type LogoBox = { width: number; height: number }
export type TileLayout = { columns: 1 | 2; logo: LogoBox }

function fitsTwo(width: number, logo: LogoBox): boolean {
  return width - 2 * SCREEN_PADDING >= 2 * (logo.width + 2 * TILE_PADDING) + COLUMN_GAP
}

export function tileLayout(width: number): TileLayout {
  if (fitsTwo(width, LOGO.expanded)) {
    return { columns: 2, logo: LOGO.expanded }
  }
  if (fitsTwo(width, LOGO.compact)) {
    return { columns: 2, logo: LOGO.compact }
  }
  return { columns: 1, logo: LOGO.compact }
}

export function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size))
  }
  return rows
}

export const StreamsScreen: React.FunctionComponent<
  BottomTabScreenProps<PrimaryParamList, "streams">
> = (props) => {
  const { mainStore } = useStores()
  const { width } = useWindowDimensions()
  const { columns, logo } = tileLayout(width)
  const tileWidth = { maxWidth: TILE_MAX_WIDTH[columns] }

  const stationComponent = (station: Station) => {
    const onPress = () => {
      mainStore.local.selectStation(station.id)
      props.navigation.navigate("live")
    }

    const selected = mainStore.local.station === station.id
    return (
      <TouchableOpacity
        disabled={selected}
        style={[styles.stream, tileWidth, selected && styles.streamSelected]}
        onPress={onPress}
        key={station.id}
        testID={"streams.item." + station.id}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: selected }}
      >
        <Logo station={station} style={styles.streamLogo} width={logo.width} height={logo.height} />
        <Text style={[styles.streamText, selected && styles.streamTextSelected]}>
          {station.name}
        </Text>
        {station.lang ? (
          <Text style={styles.streamLang}>{i18n.t("streams_screen.lang." + station.lang)}</Text>
        ) : null}
      </TouchableOpacity>
    )
  }

  return useObserver(() => (
    <Screen title={i18n.t("streams_screen.title")} testID="screen.streams">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.selector}>
          <View style={styles.lead} />
          {chunk<Station>(mainStore.preferences.stations, columns).map((row, index) => (
            <React.Fragment key={row.map((station) => station.id).join("|")}>
              {index > 0 && <View style={styles.gap} />}
              <View style={styles.row}>{row.map(stationComponent)}</View>
            </React.Fragment>
          ))}
          <View style={styles.trail} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <FooterLink
          url={mainStore.preferences.localizedUrl("archive")}
          icon="archive"
          text="streams_screen.archive"
          style={styles.footerLink}
          testID="streams.link.archive"
        />
        <FooterLink
          url={mainStore.preferences.localizedUrl("youtube")}
          icon="video"
          text="streams_screen.youtube"
          style={styles.footerLink}
          testID="streams.link.youtube"
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
    paddingHorizontal: SCREEN_PADDING,
  },
  selector: {
    flexGrow: 1,
  },
  gap: {
    flexGrow: 1,
    maxHeight: GAP_MAX,
    minHeight: GAP_MIN,
  },
  lead: {
    flexGrow: 1,
    minHeight: GAP_MIN,
  },
  trail: {
    flexGrow: 2,
    minHeight: GAP_MIN,
  },
  row: {
    flexDirection: "row",
    gap: COLUMN_GAP,
    justifyContent: "center",
  },
  stream: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    paddingHorizontal: TILE_PADDING,
    paddingVertical: 12,
  },
  streamSelected: { backgroundColor: colors.menuBackgroundActive },
  streamLogo: {
    marginBottom: 8,
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
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    columnGap: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 8,
  },
  footerLink: {
    flexShrink: 1,
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
})
