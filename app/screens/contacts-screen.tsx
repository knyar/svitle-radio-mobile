import React, { useState, useEffect } from "react"
import { useObserver } from "mobx-react-lite"
import { TouchableOpacity, Text, View, StyleSheet, Linking } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
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

const allLinksEnabled = __DEV__

const iconLinkComponent = (item: ContactItem) => {
  const [supported, setSupported] = useState(allLinksEnabled)

  useEffect(() => {
    ;(async () => {
      setSupported(await Linking.canOpenURL(item.url) || allLinksEnabled)
    })()
  }, [])

  const icons = {
    // If you add more icon types here, also adjust LSApplicationQueriesSchemes
    // in info.plist
    skype: IconSkype,
    viber: IconViber,
  }
  if (!(item.text in icons) || !item.url) { return <View key={item.url}/> }
  const IconComponent = icons[item.text]

  if (!supported) {
    console.log("Link '" + item.url + "' is not supported")
    return <View key={item.url}/>
  }
  const onPress = () => Linking.openURL(item.url)
  return (
    <TouchableOpacity key={item.url} style={styles.icon} onPress={onPress}>
      <IconComponent height={40} fill={colors.primary} />
    </TouchableOpacity>
  )
}

const textLinkComponent = (item: ContactItem) => {
  const [supported, setSupported] = useState(allLinksEnabled)

  useEffect(() => {
    ;(async () => {
      setSupported(await Linking.canOpenURL(item.url) || allLinksEnabled)
    })()
  }, [])

  if (!item.url) { return <View key={item.url}/> }
  if (!supported) {
    console.log("Link '" + item.url + "' is not supported")
    return <Text key={item.url} style={styles.text}>{item.text}</Text>
  }
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
      <Text style={styles.header}>{i18n.t(block.title)}</Text>
      {icons}
      {block.text_links.map(textLinkComponent)}
    </View>
  )
}

export const ContactsScreen: React.FunctionComponent<ContactsScreenProps> = (props) => {
  const { mainStore } = useStores()
  return useObserver(() => (
    <Screen title={i18n.t("contacts_screen.title")}>
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
  website: {
    fontSize: 35,
    fontWeight: "300",
    color: colors.primary,
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
