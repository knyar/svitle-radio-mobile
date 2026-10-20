import { InitialState } from "@react-navigation/native"
import { useEffect, useState } from "react"

import { PRIMARY_ROUTE_NAMES } from "../navigation/types"
import { RootStore, setupRootStore } from "../models/root-store"
import * as storage from "./storage"

type AppBootState = {
  rootStore: RootStore | undefined
  initialNavigationState: InitialState | undefined
  ready: boolean
}

export function restorableNavigationState(loaded: unknown): InitialState | undefined {
  if (!loaded || typeof loaded !== "object" || !("routes" in loaded)) {
    return undefined
  }

  const { routes } = loaded
  if (!Array.isArray(routes) || routes.length === 0) {
    return undefined
  }

  const routeNames: readonly string[] = PRIMARY_ROUTE_NAMES
  if (!routes.every((route) => route && routeNames.includes(route.name))) {
    return undefined
  }

  return loaded as InitialState
}

export function useAppBoot(navigationPersistenceKey: string): AppBootState {
  const [rootStore, setRootStore] = useState<RootStore>()
  const [initialNavigationState, setInitialNavigationState] = useState<InitialState>()
  const [navigationReady, setNavigationReady] = useState(false)

  useEffect(() => {
    setupRootStore().then(setRootStore)
  }, [])

  useEffect(() => {
    storage
      .load(navigationPersistenceKey)
      .then((state) => setInitialNavigationState(restorableNavigationState(state)))
      .catch(() => setInitialNavigationState(undefined))
      .finally(() => setNavigationReady(true))
  }, [navigationPersistenceKey])

  return {
    rootStore,
    initialNavigationState,
    ready: !!rootStore && navigationReady,
  }
}
