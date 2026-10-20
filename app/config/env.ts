export interface Env {
  API_URL: string
  REFRESH_INTERVAL: number
}

const dev: Env = {
  API_URL: "https://m.svitle.org/v2",
  REFRESH_INTERVAL: 7000,
}

const prod: Env = {
  API_URL: "https://m.svitle.org/v2",
  REFRESH_INTERVAL: 30000,
}

export const env: Env = __DEV__ ? dev : prod
export const { API_URL, REFRESH_INTERVAL } = env
