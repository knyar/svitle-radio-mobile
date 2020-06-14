import * as React from "react"
import { useObserver } from "mobx-react-lite"
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
const { WEBSITE } = require("../config/flavor")

export interface ContactsScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

const iconLinkComponent = (item: ContactItem) => {
  if (!item.url) { return null }
  const onPress = () => Linking.openURL(item.url)
  const icons = {
    skype: IconSkype,
    viber: IconViber,
  }
  if (!(item.text in icons)) { return null }
  const IconComponent = icons[item.text]

  return useObserver(() => (
    <TouchableOpacity key={item.url} style={styles.icon} onPress={onPress}>
      <IconComponent height={40} fill={colors.primary}/>
    </TouchableOpacity>
  ))
}

const textLinkComponent = (item: ContactItem) => {
  if (!item.url) { return null }
  const onPress = () => Linking.openURL(item.url)
  return useObserver(() => (
    <TouchableOpacity onPress={onPress} key={item.url}>
      <Text style={styles.text}>{item.text}</Text>
    </TouchableOpacity>
  ))
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
  return useObserver(() => (
    <View style={styles.container} key={block.title}>
      <Text style={styles.header}>{block.title}</Text>
      {icons}
      {block.text_links.map(textLinkComponent)}
    </View>
  ))
}

export const ContactsScreen: React.FunctionComponent<ContactsScreenProps> = (props) => {
  const { mainStore } = useStores()
  const openWebsite = () => Linking.openURL("https://" + WEBSITE)
  return useObserver(() => (
    <Screen title={i18n.t("contacts_screen.title")}>
      <View style={styles.container}>
        <TouchableOpacity onPress={openWebsite}>
          <Text style={styles.website}>{WEBSITE}</Text>
        </TouchableOpacity>
      </View>
      {mainStore.preferences.contacts.map(blockComponent)}
    </Screen>
  ))
}

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
