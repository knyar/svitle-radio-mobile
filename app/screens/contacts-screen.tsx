import * as React from "react"
import { observer, useObserver } from "mobx-react-lite"
import { TouchableOpacity, Text, View, StyleSheet, Linking } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { Screen } from "../components"
import { ContactBlock } from "../models/contact-block"
import i18n from "i18n-js"
import IconSkype from '../images/icon.skype.svg'
import IconViber from '../images/icon.viber.svg'
import { colors } from "../theme"
import { useStores } from "../models/root-store"
import { ContactItem } from "../models/contact-item"

export interface ContactsScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

const iconLinkComponent = (item: ContactItem) => {
  if (!item.url) { return null }
  const onPress = () => Linking.openURL(item.url)
  let icon = null
  switch (item.text) {
    case "skype":
      icon = <IconSkype height={40} fill={colors.primary}/>
      break
    case "viber":
      icon = <IconViber height={40} fill={colors.primary}/>
      break
    default:
      return null
  }
  return <TouchableOpacity key={item.url} style={styles.icon} onPress={onPress}>{icon}</TouchableOpacity>
}

const textLinkComponent = (item: ContactItem) => {
  if (!item.url) { return null }
  const onPress = () => Linking.openURL(item.url)
  return (
    <TouchableOpacity onPress={onPress} key={item.url}>
      <Text style={styles.text}>{item.text}</Text>
    </TouchableOpacity>
  )
}

const blockComponent = (block: ContactBlock) => {
  let icons = null
  if (block.icon_links.length > 0) {
    icons = (
      <View style={styles.icons}>
        {block.icon_links.map(iconLinkComponent)}
      </View>
    )
  }
  return (
    <View style={styles.container} key={block.title}>
      <Text style={styles.header}>{block.title}</Text>
      {icons}
      {block.text_links.map(textLinkComponent)}
    </View>
  )
}

export const ContactsScreen: React.FunctionComponent<ContactsScreenProps> = observer((props) => {
  const { preferencesStore } = useStores()
  return useObserver(() => (
    <Screen title={i18n.t("contacts_screen.title")}>
      <View style={styles.container}>
        <TouchableOpacity><Text style={styles.website}>svetloe.org</Text></TouchableOpacity>
      </View>
      {preferencesStore.preferences.contacts.map(blockComponent)}
    </Screen>
  ))
})

const spacing = 7
const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: spacing,
  },
  website: {
    fontSize: 35,
    fontWeight: "300",
    color: colors.primary,
  },
  header: {
    margin: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  icons: {
    flexDirection: "row",
    margin: spacing,
  },
  icon: {},
  text: {
    margin: spacing,
    color: colors.text,
  },
})