import * as React from "react"
import { useObserver } from "mobx-react-lite"
import { Text, StyleSheet, ViewStyle, TouchableOpacity } from "react-native"
import i18n from "i18n-js"
import IconActive from '../../images/icon.check.active.svg'
import IconInactive from '../../images/icon.check.inactive.svg'
import { colors } from "../../theme"

export interface FooterCheckboxProps {
  visible: boolean
  active: boolean
  toggle: () => void
  text: string
  style?: ViewStyle | ViewStyle[]
}

export const FooterCheckbox: React.FunctionComponent<FooterCheckboxProps> = (props) => {
  const IconComponent = props.active ? IconActive : IconInactive
  if (!props.visible) { return null }
  return useObserver(() => (
    <TouchableOpacity style={[styles.container, props.style]} onPress={props.toggle}>
      <IconComponent height={18} style={styles.icon} fill={colors.primary}/>
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
