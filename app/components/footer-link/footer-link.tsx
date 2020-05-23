import * as React from "react"
import { useObserver } from "mobx-react-lite"
import { Text, Linking, StyleSheet, ViewStyle, TouchableOpacity } from "react-native"
import i18n from "i18n-js"
import IconSupport from '../../images/icon.support.svg'
import IconArchive from '../../images/icon.archive.svg'
import IconVideo from '../../images/icon.video.svg'
import { colors } from "../../theme"

export interface FooterLinkProps {
  icon: string
  text: string
  url?: string
  style?: ViewStyle | ViewStyle[]
}

export const FooterLink: React.FunctionComponent<FooterLinkProps> = props => {
  if (!props.url) {
    return useObserver(() => (null))
  }

  const onPress = () => Linking.openURL(props.url);

  let textStyle: ViewStyle = { padding: 3 }
  let icon = null
  switch (props.icon) {
    case "support":
      icon = <IconSupport height={18} style={styles.icon} fill={colors.primary}/>
      textStyle = { padding: 5 }
      break;
    case "archive":
      icon = <IconArchive height={17} style={styles.icon} fill={colors.primary}/>
      break;
    case "video":
      icon = <IconVideo height={18} style={styles.icon} fill={colors.primary}/>
      break;
  }

  return useObserver(() => (
    <TouchableOpacity style={[styles.container, props.style]} onPress={onPress}>
      {icon}
      <Text style={[styles.text, textStyle]}>{i18n.t(props.text)}</Text>
    </TouchableOpacity>
  ))
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
