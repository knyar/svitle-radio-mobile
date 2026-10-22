import BuildConfig from "react-native-build-config"

export interface Env {
  API_URL: string
  REFRESH_INTERVAL: number
}

export function resolveApiUrl(value: unknown, fallback: string): string {
  return typeof value === "string" && /^https?:\/\//.test(value) ? value : fallback
}

const API_URL = resolveApiUrl(BuildConfig?.API_URL, "https://m.svitle.org/v2")

const dev: Env = {
  API_URL,
  REFRESH_INTERVAL: 7000,
}

const prod: Env = {
  API_URL,
  REFRESH_INTERVAL: 30000,
}

export const env: Env = __DEV__ ? dev : prod
export const { REFRESH_INTERVAL } = env
export { API_URL }
