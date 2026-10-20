import React from "react"
import { useObserver } from "mobx-react-lite"
import { TouchableOpacity, Text, View, StyleSheet, Linking } from "react-native"
import { Screen } from "../components"
import { ContactBlock } from "../models/contact-block"
import i18n from "i18n-js"
import IconSkype from "../images/icon.skype.svg"
import IconViber from "../images/icon.viber.svg"
import { colors } from "../theme"
import { useStores } from "../models/root-store"
import { ContactItem } from "../models/contact-item"
import { useLinkSupported } from "../utils/use-link-supported"
import { SvgProps } from "react-native-svg"

const IconLink: React.FunctionComponent<{ item: ContactItem }> = ({ item }) => {
  const supported = useLinkSupported(item.url)
  const icons: Record<string, React.FC<SvgProps>> = {
    // If you add more icon types here, also adjust LSApplicationQueriesSchemes
    // in info.plist
    skype: IconSkype,
    viber: IconViber,
  }
  if (!(item.text in icons) || !item.url) {
    return <View />
  }
  const IconComponent = icons[item.text]

  if (!supported) {
    console.log("Link '" + item.url + "' is not supported")
    return <View />
  }
  const onPress = () => Linking.openURL(item.url)
  return (
    <TouchableOpacity style={styles.icon} onPress={onPress}>
      <IconComponent height={40} fill={colors.primary} />
    </TouchableOpacity>
  )
}

const TextLink: React.FunctionComponent<{ item: ContactItem }> = ({ item }) => {
  const supported = useLinkSupported(item.url)
  if (!item.url) {
    return <View />
  }
  if (!supported) {
    console.log("Link '" + item.url + "' is not supported")
    return <Text style={styles.text}>{item.text}</Text>
  }
  const onPress = () => Linking.openURL(item.url)
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.text}>{item.text}</Text>
    </TouchableOpacity>
  )
}

const blockComponent = (block: ContactBlock) => {
  let icons: React.ReactNode = null
  if (block.icon_links.length > 0) {
    icons = (
      <View style={styles.icons}>
        {block.icon_links.map((item) => (
          <IconLink key={item.url} item={item} />
        ))}
      </View>
    )
  }
  return (
    <View style={styles.container} key={block.title}>
      <Text style={styles.header}>{i18n.t(block.title ?? "")}</Text>
      {icons}
      {block.text_links.map((item) => (
        <TextLink key={item.url} item={item} />
      ))}
    </View>
  )
}

export const ContactsScreen: React.FunctionComponent = () => {
  const { mainStore } = useStores()
  return useObserver(() => (
    <Screen title={i18n.t("contacts_screen.title")} testID="screen.contacts">
      {mainStore.preferences.contacts.map(blockComponent)}
    </Screen>
  ))
}

const spacing = 3
const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: spacing,
  },
  header: {
    marginTop: 8,
    marginBottom: spacing,
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  icons: {
    flexDirection: "row",
  },
  icon: {
    marginBottom: spacing,
  },
  text: {
    marginBottom: spacing,
    color: colors.text,
    fontSize: 15,
  },
})
