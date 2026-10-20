import React from "react"
import { Text, Linking, StyleSheet, TextStyle, ViewStyle, TouchableOpacity } from "react-native"
import i18n from "i18n-js"
import IconSupport from "../images/icon.support.svg"
import IconArchive from "../images/icon.archive.svg"
import IconVideo from "../images/icon.video.svg"
import { colors } from "../theme"
import { useLinkSupported } from "../utils/use-link-supported"

const icons = {
  support: { Icon: IconSupport, height: 18, padding: 5 },
  archive: { Icon: IconArchive, height: 16, padding: 3 },
  video: { Icon: IconVideo, height: 18, padding: 3 },
}

export interface FooterLinkProps {
  icon: keyof typeof icons
  text: string
  url?: string
  style?: ViewStyle | ViewStyle[]
}

export const FooterLink: React.FunctionComponent<FooterLinkProps> = (props) => {
  const supported = useLinkSupported(props.url)

  const url = props.url
  if (!supported || !url) {
    if (props.url) {
      console.log("Link '" + props.url + "' is not supported")
    }
    return null
  }

  const onPress = () => Linking.openURL(url)

  const { Icon: IconComponent, height, padding } = icons[props.icon]
  const textStyle: TextStyle = { padding }

  return (
    <TouchableOpacity style={[styles.container, props.style]} onPress={onPress}>
      <IconComponent height={height} style={styles.icon} fill={colors.primary} />
      <Text style={[styles.text, textStyle]}>{i18n.t(props.text)}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
  },
  icon: {
    flexShrink: 1,
  },
  text: {
    color: colors.primary,
  },
})
