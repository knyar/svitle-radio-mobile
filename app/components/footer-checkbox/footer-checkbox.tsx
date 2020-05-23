import * as React from "react"
import { useObserver } from "mobx-react-lite"
import { Text, Linking, StyleSheet, ViewStyle, TouchableOpacity } from "react-native"
import i18n from "i18n-js"
import { useStores } from "../../models/root-store"
import IconActive from '../../images/icon.check.active.svg'
import { colors } from "../../theme"

export interface FooterCheckboxProps {
  text: string
  style?: ViewStyle | ViewStyle[]
}

export const FooterCheckbox: React.FunctionComponent<FooterCheckboxProps> = props => {
  // const { someStore } = useStores()

  const onPress = () => Linking.openURL("")
  let icon = <IconActive height={18} style={styles.icon} fill={colors.primary}/>

  return useObserver(() => (
    <TouchableOpacity style={[styles.container, props.style]} onPress={onPress}>
      {icon}
      <Text style={styles.text}>{i18n.t(props.text)}</Text>
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
    padding: 6,
  },
})
