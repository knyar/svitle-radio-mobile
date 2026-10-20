import * as React from "react"
import { StyleSheet, ViewStyle, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Header } from "./header"

interface Props {
  title?: string
  children?: React.ReactNode
  style?: ViewStyle
  testID?: string
}

export const Screen: React.FunctionComponent<Props> = (props) => {
  const insets = useSafeAreaInsets()
  const style = props.style || {}
  const insetStyle = { paddingTop: insets.top }

  return (
    <View style={[styles.outer, insetStyle]} testID={props.testID}>
      {props.title ? <Header title={props.title} /> : <View />}
      <View style={[styles.inner, style]}>{props.children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "white",
    flex: 1,
    height: "100%",
    width: "100%",
  },
  inner: {
    flex: 1,
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
})
