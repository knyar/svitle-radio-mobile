import * as React from "react"
import { observer } from "mobx-react-lite"
import { TouchableOpacity, Text, View, StyleSheet } from "react-native"
import { ParamListBase } from "@react-navigation/native"
import { NativeStackNavigationProp } from "react-native-screens/native-stack"
import { Screen } from "../components"
import i18n from "i18n-js"
import IconSkype from '../images/icon.skype.svg'
import IconViber from '../images/icon.viber.svg'
import { colors } from "../theme"
// import { useStores } from "../models/root-store"

export interface ContactsScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>
}

export const ContactsScreen: React.FunctionComponent<ContactsScreenProps> = observer((props) => {
  // const { someStore } = useStores()
  return (
    <Screen title={i18n.t("contacts_screen.title")}>
      <View style={styles.container}>
        <TouchableOpacity><Text style={styles.website}>svetloe.org</Text></TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.header}>{i18n.t("contacts_screen.live")}</Text>
        <View style={styles.icons}>
          <TouchableOpacity style={styles.icon}><IconSkype height={40} fill={colors.primary}/></TouchableOpacity>
          <TouchableOpacity style={styles.icon}><IconViber height={40} fill={colors.primary}/></TouchableOpacity>
        </View>
        <TouchableOpacity><Text style={styles.text}>+38 (044) 383-67-28</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.text}>+38 (067) 123-75-75</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.text}>+38 (094) 928-37-28</Text></TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.header}>{i18n.t("contacts_screen.editor")}</Text>
        <TouchableOpacity><Text style={styles.text}>+38 (044) 221-54-20</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.text}>radio@svitle.org</Text></TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.header}>{i18n.t("contacts_screen.accounting")}</Text>
        <TouchableOpacity><Text style={styles.text}>+38 (044) 222-67-28</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.text}>+38 (099) 207-58-22</Text></TouchableOpacity>
      </View>
    </Screen>
  )
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