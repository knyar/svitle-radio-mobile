import * as React from "react"
import { ViewStyle } from "react-native"
import { useObserver } from "mobx-react-lite"
import { NumberProp } from "react-native-svg"
import { Station } from "../models/station"
import SvetloeLogo from "../images/svetloe.svg"
import SvitleLogo from "../images/svitle.svg"

export interface LogoProps {
  station: Station,
  width?: NumberProp
  height?: NumberProp
  style?: ViewStyle | ViewStyle[]
}

export const Logo: React.FunctionComponent<LogoProps> = props => {
  const defaultid = 'svetloe'
  const logoid = props.station ? props.station.id : defaultid
  const logos = {
    svitle: SvitleLogo,
    svetloe: SvetloeLogo,
  }
  const LogoComponent = logos[logoid] || logos[defaultid]
  
  let pr = {style: props.style}
  if (props.width) { pr["width"] = props.width }
  if (props.height) { pr["height"] = props.height }

  return useObserver(() => <LogoComponent {...pr}/>)
}
