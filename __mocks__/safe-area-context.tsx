import { View } from "react-native"

const insets = { top: 0, right: 0, bottom: 0, left: 0 }

export const SafeAreaProvider = ({ children }) => children
export const SafeAreaView = View
export const useSafeArea = () => insets
export const useSafeAreaInsets = () => insets
export const initialWindowSafeAreaInsets = insets
export const initialWindowMetrics = { frame: { x: 0, y: 0, width: 0, height: 0 }, insets }
