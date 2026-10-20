import App from "./app/app.tsx"
import { AppRegistry } from "react-native"
import TrackPlayer from "react-native-track-player"

const APP_NAME = "SvitleRadio"

AppRegistry.registerComponent(APP_NAME, () => App)
TrackPlayer.registerPlaybackService(() => require("./player-service"))
