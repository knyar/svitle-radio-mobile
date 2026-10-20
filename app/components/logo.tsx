import * as React from "react"
import { ViewStyle } from "react-native"
import { NumberProp } from "react-native-svg"
import { LogoId, Station } from "../models/station"
import SvetloeLogo from "../images/svetloe.svg"
import SvitleLogo from "../images/svitle.svg"
import KidsLogo from "../images/kids.svg"

export interface LogoProps {
  station: Station | null
  width?: NumberProp
  height?: NumberProp
  style?: ViewStyle | ViewStyle[]
}

export function lookup<T>(map: Record<LogoId, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key as LogoId] : undefined
}

export const Logo: React.FunctionComponent<LogoProps> = (props) => {
  const defaultid = "svetloe"
  const logoid = props.station ? props.station.id : defaultid
  const logos: Record<LogoId, React.FC<React.ComponentProps<typeof SvitleLogo>>> = {
    svitle: SvitleLogo,
    svetloe: SvetloeLogo,
    kids: KidsLogo,
  }
  const LogoComponent = lookup(logos, logoid) || logos[defaultid]

  let pr: { style?: ViewStyle | ViewStyle[]; width?: NumberProp; height?: NumberProp } = {
    style: props.style,
  }
  if (props.width) {
    pr.width = props.width
  }
  if (props.height) {
    pr.height = props.height
  }

  return <LogoComponent {...pr} />
}
