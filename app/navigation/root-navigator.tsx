import React from "react"
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native"

import { PrimaryParamList } from "./types"
import { PrimaryNavigator } from "./primary-navigator"

export const RootNavigator = React.forwardRef<
  NavigationContainerRef<PrimaryParamList>,
  Partial<React.ComponentProps<typeof NavigationContainer>>
>((props, ref) => {
  return (
    <NavigationContainer<PrimaryParamList> {...props} ref={ref}>
      <PrimaryNavigator />
    </NavigationContainer>
  )
})

RootNavigator.displayName = "RootNavigator"
