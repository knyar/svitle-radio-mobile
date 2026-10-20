import BuildConfig from "react-native-build-config"

export const FLAVORS = ["svitle", "svetloe"] as const
export type Flavor = (typeof FLAVORS)[number]

export function isFlavor(value: unknown): value is Flavor {
  return FLAVORS.includes(value as Flavor)
}

const configured = BuildConfig?.FLAVOR
if (!isFlavor(configured)) {
  throw new Error(`Unknown FLAVOR build config: ${String(configured)}`)
}

export const FLAVOR: Flavor = configured
