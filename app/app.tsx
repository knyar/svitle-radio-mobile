import "./i18n"
import React from "react"
import { NavigationState } from "@react-navigation/native"
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context"

import { RootNavigator } from "./navigation"
import { RootStoreProvider } from "./models/root-store"
import * as storage from "./utils/storage"
import { useAppBoot } from "./utils/use-app-boot"
import { Timer } from "./components"
import * as Sentry from "@sentry/react-native"

Sentry.init({
  dsn: "https://aaea4257689efa06f26ca319e6404cf1@o405793.ingest.sentry.io/4505776273686528",
})

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

/**
 * This is the root component of our app.
 */
const App: React.FunctionComponent<{}> = () => {
  const { rootStore, initialNavigationState, ready } = useAppBoot(NAVIGATION_PERSISTENCE_KEY)

  const onNavigationStateChange = (state: NavigationState | undefined) => {
    storage.save(NAVIGATION_PERSISTENCE_KEY, state)
  }

  // Before we show the app, we have to wait for our state to be ready.
  // In the meantime, don't render anything. This will be the background
  // color set in native by rootView's background color.
  //
  // This step should be completely covered over by the splash screen though.
  //
  // You're welcome to swap in your own component to render if your boot up
  // sequence is too slow though.
  if (!ready || !rootStore) {
    return null
  }

  // otherwise, we're ready to render the app
  return (
    <RootStoreProvider value={rootStore}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <RootNavigator
          initialState={initialNavigationState}
          onStateChange={onNavigationStateChange}
        />
        <Timer />
      </SafeAreaProvider>
    </RootStoreProvider>
  )
}

export default App
