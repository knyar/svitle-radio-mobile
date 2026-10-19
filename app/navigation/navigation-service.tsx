import React from "react"
import { PartialState, NavigationState, NavigationContainerRef } from "@react-navigation/native"
import { RootParamList } from "./types"

export const RootNavigation = {
  navigate(name: string) {
    name
  },
  goBack() {},
  resetRoot(_state?: PartialState<NavigationState> | NavigationState) {},
  getRootState(): NavigationState {
    return {} as any
  },
}

export const setRootNavigation = (
  ref: React.RefObject<NavigationContainerRef<RootParamList> | null>,
) => {
  for (const method in RootNavigation) {
    RootNavigation[method] = (...args: any) => {
      if (ref.current) {
        return ref.current[method](...args)
      }
    }
  }
}
