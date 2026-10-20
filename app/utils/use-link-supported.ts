import { useEffect, useState } from "react"
import { link_supported } from "./links"

export function useLinkSupported(url?: string): boolean {
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    let cancelled = false

    setSupported(false)
    link_supported(url).then((result) => {
      if (!cancelled) {
        setSupported(result)
      }
    })

    return () => {
      cancelled = true
    }
  }, [url])

  return supported
}
