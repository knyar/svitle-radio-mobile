import { ApisauceInstance, create, ApiResponse } from "apisauce"
import { getGeneralApiProblem } from "./api-problem"
import { ApiConfig, DEFAULT_API_CONFIG } from "./api-config"
import { StationSnapshot, Station } from "../../models/station"
import * as Types from "./api.types"

/**
 * Manages all requests to the API.
 */
export class Api {
  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance

  /**
   * Configurable options.
   */
  config: ApiConfig

  /**
   * Creates the api.
   *
   * @param config The configuration to use.
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
  }

  /**
   * Sets up the API.  This will be called during the bootup
   * sequence and will happen before the first React component
   * is mounted.
   *
   * Be as quick as possible in here.
   */
  setup() {
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
        'Cache-Control': 'no-cache',
      },
    })
  }

  async getPreferences(): Promise<Types.GetPreferencesResult> {
    const response: ApiResponse<any> = await this.apisauce.get(`/preferences.js`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      return { kind: "ok", preferences: response.data }
    } catch {
      return { kind: "bad-data" }
    }
  }

  async getStations(): Promise<Types.GetStationsResult> {
    const response: ApiResponse<any> = await this.apisauce.get(`/v2/status?recent_tracks=0`)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      return { kind: "ok", stations: convertStations(response.data) }
    } catch (error) {
      console.log(error)
      return { kind: "bad-data" }
    }
  }
}

const convertStations = (raw: any): Map<string, StationSnapshot> => {
  let result = new Map()
  for (const name in raw.stations) {
    const station = raw.stations[name]
    let s: StationSnapshot = {
      current_track: station.current_track == "" ? undefined : station.current_track,
      next_track: station.next_track == "" ? undefined : station.next_track,
      stream_url: undefined,
      stream_url_low: undefined,
    }
    for (const stream of station.streams) {
      if (stream["name"] == "normal") {
        s.stream_url = stream["url"]
      } else if (stream["name"] == "low") {
        s.stream_url_low = stream["url"]
      }
    }
    result.set(name, s)
  }

  return result
}
