import * as React from "react"
import { Image, StyleSheet, View, ViewStyle } from "react-native"
import { NumberProp, SvgUri } from "react-native-svg"
import { LogoId, Station } from "../models/station"
import SvetloeLogo from "../images/svetloe.svg"
import SvitleLogo from "../images/svitle.svg"
import KidsLogo from "../images/kids.svg"
import { isRemoteLogo, isSvgUrl } from "../utils/logo-source"

export interface LogoProps {
  station: Station | null
  width?: NumberProp
  height?: NumberProp
  style?: ViewStyle | ViewStyle[]
}

type LogoBoxProps = Omit<LogoProps, "station">

const DEFAULT_LOGO: LogoId = "svetloe"
// A remote logo has no intrinsic size before it loads. When the caller leaves the height open, the
// box takes the Svitle wordmark's ratio and the image is contained in it.
const REMOTE_LOGO_ASPECT_RATIO = 274 / 126

export function lookup<T>(map: Record<LogoId, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key as LogoId] : undefined
}

const logos: Record<LogoId, React.FC<React.ComponentProps<typeof SvitleLogo>>> = {
  svitle: SvitleLogo,
  svetloe: SvetloeLogo,
  kids: KidsLogo,
}

// A bundled SVG keeps its own width or height when the caller leaves one out; an explicit undefined
// would discard it.
const BundledLogo: React.FunctionComponent<LogoBoxProps & { id: LogoId }> = (props) => {
  const LogoComponent = logos[props.id]
  let pr: LogoBoxProps = { style: props.style }
  if (props.width) {
    pr.width = props.width
  }
  if (props.height) {
    pr.height = props.height
  }
  return <LogoComponent testID={"logo." + props.id} {...pr} />
}

const RemoteLogo: React.FunctionComponent<LogoBoxProps & { uri: string }> = (props) => {
  const { uri, width, height, style } = props
  const [loaded, setLoaded] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  // SvgUri fetches again whenever a callback identity changes, so both stay stable.
  const onLoad = React.useCallback(() => setLoaded(true), [])
  const onError = React.useCallback(() => setFailed(true), [])

  if (failed) {
    return <BundledLogo id={DEFAULT_LOGO} width={width} height={height} style={style} />
  }

  const sized = width !== undefined && height !== undefined
  const box: ViewStyle =
    height !== undefined
      ? { width: width as ViewStyle["width"], height: height as ViewStyle["height"] }
      : { width: (width ?? 274) as ViewStyle["width"], aspectRatio: REMOTE_LOGO_ASPECT_RATIO }
  const media = isSvgUrl(uri) ? (
    <SvgUri
      uri={uri}
      width={sized ? width : undefined}
      height={sized ? height : undefined}
      style={styles.media}
      onLoad={onLoad}
      onError={onError}
    />
  ) : (
    <Image
      source={{ uri }}
      resizeMode="contain"
      style={styles.media}
      onLoad={onLoad}
      onError={onError}
    />
  )

  // The wrapper keeps the stable id for the whole life of the logo; the marker appears once the
  // image has arrived so a flow can assert the load itself, not just the layout.
  return (
    <View testID="logo.remote" collapsable={false} style={[box, style]}>
      {media}
      {loaded ? (
        <View testID="logo.remote.loaded" pointerEvents="none" style={StyleSheet.absoluteFill} />
      ) : null}
    </View>
  )
}

export const Logo: React.FunctionComponent<LogoProps> = (props) => {
  const { station, ...box } = props
  const logoid = station ? station.logo : DEFAULT_LOGO
  if (isRemoteLogo(logoid)) {
    return <RemoteLogo key={logoid} uri={logoid} {...box} />
  }
  const resolved = lookup(logos, logoid) ? (logoid as LogoId) : DEFAULT_LOGO
  return <BundledLogo id={resolved} {...box} />
}

const styles = StyleSheet.create({
  media: {
    width: "100%",
    height: "100%",
  },
})
