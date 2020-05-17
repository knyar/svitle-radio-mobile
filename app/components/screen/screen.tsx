import * as React from "react"
import { StyleSheet, ViewStyle, StatusBar, View } from "react-native"
import { useSafeArea } from "react-native-safe-area-context"
import { Header } from "../../components"

interface Props {
  title?: string,
  children?: React.ReactNode,
  style?: ViewStyle,
}

export const Screen: React.FunctionComponent<Props> = props => {
  const insets = useSafeArea()
  const style = props.style || {}
  const insetStyle = { paddingTop: insets.top }

  let header = (<View/>)
  if (props.title) {
    header = <Header title={props.title}/>
  }

  return (
    <View style={[styles.outer, insetStyle]}>
      <StatusBar barStyle="light-content"/>
      {header}
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