import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { LiveScreen, StreamsScreen, ContactsScreen } from "../screens"
import i18n from "i18n-js"
import IconLive from '../images/tab.live.svg'
import IconContacts from '../images/tab.contacts.svg'
import IconStreams from '../images/tab.streams.svg'
import { colors } from '../theme';

const Tab = createBottomTabNavigator()

export function PrimaryNavigator() {
  return (
    <Tab.Navigator
    initialRouteName="streams"
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const c = focused ? colors.active : colors.primary;
        switch (route.name) {
          case "contacts":
            return <IconContacts width={size} height={size} fill={c}/>
          case "streams":
            return <IconStreams width={size} height={size} fill={c}/>
          default:
            return <IconLive width={size} height={size} fill={c}/>
        }
      },
      headerShown: false,
      tabBarActiveTintColor: colors.active,
      tabBarInactiveTintColor: colors.primary,
      tabBarActiveBackgroundColor: colors.menuBackgroundActive,
      tabBarInactiveBackgroundColor: colors.menuBackground,
      tabBarLabelPosition: "below-icon",
      tabBarStyle: [{ "display": "flex" }, null],
    })}>
      <Tab.Screen name="live" component={LiveScreen} options={{
        tabBarLabel: i18n.t("live_screen.title")
      }}/>
      <Tab.Screen name="streams" component={StreamsScreen} options={{
        tabBarLabel: i18n.t("streams_screen.title")
      }}/>
      <Tab.Screen name="contacts" component={ContactsScreen} options={{
        tabBarLabel: i18n.t("contacts_screen.menu_title")
      }}/>
    </Tab.Navigator>
  )
}