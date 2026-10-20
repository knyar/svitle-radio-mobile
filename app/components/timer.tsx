import React, { useEffect } from "react"
import { useStores } from "../models/root-store"
import { nextRefreshDelay } from "../utils/refresh-schedule"
import { REFRESH_INTERVAL } from "../config/env"

export const Timer: React.FunctionComponent = () => {
  const { mainStore } = useStores()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    async function refresh() {
      let age = Date.now() - mainStore.streamsUpdated
      const schedule = nextRefreshDelay(age, REFRESH_INTERVAL)
      if (!schedule.refresh) {
        console.log("StreamInfo updated less than 5s ago. Retrying in 5s.")
      } else {
        await mainStore.updateStreamInfo()
      }
      timer = setTimeout(refresh, schedule.delay)
    }

    timer = setTimeout(refresh, REFRESH_INTERVAL)
    return () => {
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [mainStore])

  return null
}
