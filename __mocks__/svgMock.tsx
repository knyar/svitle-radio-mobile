import React from "react"
import { View } from "react-native"
import { SvgProps } from "react-native-svg"

const SvgMock = (props: SvgProps) => <View testID="svg" {...props} />

export { SvgMock }
export default SvgMock
