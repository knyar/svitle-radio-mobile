import React, { useEffect } from "react"
import { useStores } from "../../models/root-store"
const { REFRESH_INTERVAL } = require("../../config/env")

export const Timer: React.FunctionComponent = props => {
  const { mainStore } = useStores()

  useEffect(() => {
    let timer = null

    async function refresh() {
      let next = REFRESH_INTERVAL
      if ((Date.now() - mainStore.streamsUpdated) < 5000) {
        console.log("StreamInfo last updated less than 5 seconds ago, skipping")
        // If refresh happened recently, retry in 5-6 seconds.
        next = 5000 + 1000 * Math.random()
      } else {
        await mainStore.updateStreamInfo()
      }
      timer = setTimeout(refresh, next)
    }

    timer = setTimeout(refresh, REFRESH_INTERVAL)
    return () => clearTimeout(timer)
  }, [])

  return null
}
