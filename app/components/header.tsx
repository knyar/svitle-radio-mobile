import * as React from "react"
import { Text, View, StyleSheet} from "react-native"
import IconSvetloe from '../images/svetloe.icon.svg'
import { colors } from "../theme"

interface Props {
  title: string,
}

export const Header: React.FunctionComponent<Props> = props => {
  return (
    <View style={styles.header}>
      <IconSvetloe style={styles.icon} height={40} width={40} fill={colors.primary}/>
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
