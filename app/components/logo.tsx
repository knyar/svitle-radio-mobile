import * as React from "react"
import { ViewStyle } from "react-native"
import { useObserver } from "mobx-react-lite"
import { NumberProp } from "react-native-svg"
import SvetloeLogo from "../images/svetloe.svg"
import SvitleLogo from "../images/svitle.svg"

export interface LogoProps {
  id: string
  width?: NumberProp
  height?: NumberProp
  style?: ViewStyle | ViewStyle[]
}

export const Logo: React.FunctionComponent<LogoProps> = props => {
  const logos = {
    svitle: SvitleLogo,
    svetloe: SvetloeLogo,
  }
  const LogoComponent = logos[props.id] || SvetloeLogo
  
  let pr = {style: props.style}
  if (props.width) { pr["width"] = props.width }
  if (props.height) { pr["height"] = props.height }

  return useObserver(() => <LogoComponent {...pr}/>)
}