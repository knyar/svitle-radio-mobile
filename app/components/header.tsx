import * as React from "react"
import { Text, View, StyleSheet} from "react-native"
import IconSvetloe from '../images/header.svetloe.svg'
import IconSvitle from '../images/header.svitle.svg'
import { colors } from "../theme"
const { FLAVOR } = require("../config/flavor")

interface Props {
  title: string,
}

export const Header: React.FunctionComponent<Props> = props => {
  const IconComponent = {
    svetloe: IconSvetloe,
    svitle: IconSvitle,
  }[FLAVOR]
  return (
    <View style={styles.header}>
      <IconComponent style={styles.icon} height={40} width={40} fill={colors.primary}/>
      <Text style={styles.text}>{props.title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    margin: 10,
  },
  text: {
    fontSize: 22,
    fontWeight: "300",
    color: colors.text,
  },
})
