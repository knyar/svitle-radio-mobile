import React, { useEffect } from "react"
import { useStores } from "../models/root-store"
const { REFRESH_INTERVAL } = require("../config/env")

export const Timer: React.FunctionComponent = () => {
  const { mainStore } = useStores()

  useEffect(() => {
    let timer = null

    async function refresh() {
      let next = REFRESH_INTERVAL
      let age = Date.now() - mainStore.streamsUpdated
      if (age < 5000 || age > 180000) {
        console.log("StreamInfo updated less than 5s or more than 3m ago. Retrying in 5s.")
        // Retry in 5-6 seconds.
        next = 5000 + 1000 * Math.random()
      } else {
        await mainStore.updateStreamInfo()
      }
      timer = setTimeout(refresh, next)
    }

    timer = setTimeout(refresh, REFRESH_INTERVAL)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO(M3): deps intentionally incomplete; fixing changes effect timing
  }, [])

  return null
}
