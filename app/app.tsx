import "./i18n"
import React, { useState, useEffect, useRef } from "react"
import { YellowBox } from "react-native"
import { NavigationContainerRef } from "@react-navigation/native"
import { enableScreens } from "react-native-screens"
import { SafeAreaProvider, initialWindowSafeAreaInsets } from "react-native-safe-area-context"

import { RootNavigator, setRootNavigation } from "./navigation"
import { RootStore, RootStoreProvider, setupRootStore } from "./models/root-store"
import * as storage from "./utils/storage"
import getActiveRouteName from "./navigation/get-active-routename"
import { Timer } from "./components"
import * as Sentry from '@sentry/react-native';

Sentry.init({ 
  dsn: 'https://75271eed80a14b14943fd330406f1b3e@o405793.ingest.sentry.io/5272159', 
});

// https://github.com/mobxjs/mobx-react-lite#observer-batching
import 'mobx-react-lite/batchingForReactNative'

// This puts screens in a native ViewController or Activity. If you want fully native
// stack navigation, use `createNativeStackNavigator` in place of `createStackNavigator`:
// https://github.com/kmagiera/react-native-screens#using-native-stack-navigator
enableScreens()

/**
 * Ignore some yellowbox warnings. Some of these are for deprecated functions
 * that we haven't gotten around to replacing yet.
 */
YellowBox.ignoreWarnings([
  "componentWillMount is deprecated",
  "componentWillReceiveProps is deprecated",
  "Require cycle:",
  "not a valid TrackPlayer event: playback-metadata-received",
])

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

/**
 * This is the root component of our app.
 */
const App: React.FunctionComponent<{}> = () => {
  const navigationRef = useRef<NavigationContainerRef>()
  const [rootStore, setRootStore] = useState<RootStore | undefined>(undefined)
  const [initialNavigationState, setInitialNavigationState] = useState()
  const [isRestoringNavigationState, setIsRestoringNavigationState] = useState(true)

  setRootNavigation(navigationRef)

  /**
   * Keep track of state changes
   * Track Screens
   * Persist State
   */
  const routeNameRef = useRef()
  const onNavigationStateChange = state => {
    const previousRouteName = routeNameRef.current
    const currentRouteName = getActiveRouteName(state)

    if (previousRouteName !== currentRouteName) {
      // track screens.
      __DEV__ && console.log(currentRouteName)
    }

    // Save the current route name for later comparision
    routeNameRef.current = currentRouteName

    // Persist state to storage
    storage.save(NAVIGATION_PERSISTENCE_KEY, state)
  }

  useEffect(() => {
    ;(async () => {
      setupRootStore().then(setRootStore)
    })()
  }, [])

  useEffect(() => {
    const restoreState = async () => {
      try {
        const state = await storage.load(NAVIGATION_PERSISTENCE_KEY)

        if (state) {
          setInitialNavigationState(state)
        }
      } finally {
        setIsRestoringNavigationState(false)
      }
    }

    if (isRestoringNavigationState) {
      restoreState()
    }
  }, [isRestoringNavigationState])

  // Before we show the app, we have to wait for our state to be ready.
  // In the meantime, don't render anything. This will be the background
  // color set in native by rootView's background color.
  //
  // This step should be completely covered over by the splash screen though.
  //
  // You're welcome to swap in your own component to render if your boot up
  // sequence is too slow though.
  if (!rootStore) {
    return null
  }

  // otherwise, we're ready to render the app
  return (
    <RootStoreProvider value={rootStore}>
      <SafeAreaProvider initialSafeAreaInsets={initialWindowSafeAreaInsets}>
        <RootNavigator
          ref={navigationRef}
          initialState={initialNavigationState}
          onStateChange={onNavigationStateChange}
        />
        <Timer/>
      </SafeAreaProvider>
    </RootStoreProvider>
  )
}

export default App
