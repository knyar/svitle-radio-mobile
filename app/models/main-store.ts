import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { PreferencesModel, PreferencesSnapshot } from "./preferences"
import { StreamInfo, StreamInfoModel } from "./stream-info"
import { Station } from "./station"
import { LocalSettingsModel } from "./local-settings"
import { withEnvironment} from "./with-environment"
import { GetStreamInfoResult, GetPreferencesResult } from "../services/api"
import { indefinitely } from "../utils/retry"

/**
 * Model description here for TypeScript hints.
 */
export const MainStoreModel = types
  .model("MainStore")
  .props({
    preferences: types.optional(PreferencesModel, {}),
    local: types.optional(LocalSettingsModel, {}),
    streams: types.map(StreamInfoModel),
    streamsUpdated: 0, // timestamp of last update
  })
  .extend(withEnvironment)
  .views(self => ({
    get current_station(): Station {
      const current = self.local.station
      for (const station of self.preferences.stations) {
        if (station.id == current) {
          return station
        }
      }
      return null
    },
    get current_stream(): StreamInfo {
      const current = self.local.station
      for (const [id, stream] of self.streams) {
        if (id == current) {
          return stream
        }
      }
      return {current_track: null, next_track: null, stream_url_low: null, stream_url: null}
    },
    get current_track(): string {
      const stream = this.current_stream
      return stream.current_track
    },
    get next_track(): string {
      const stream = this.current_stream
      return stream.next_track
    },
    get current_url(): string {
      const stream = this.current_stream
      if (self.local.low_quality && stream.stream_url_low) {
        return stream.stream_url_low
      }
      return stream.stream_url
    },
  }))
  .actions(self => ({
    savePreferences: (preferencesSnapshot: PreferencesSnapshot) => {
      self.preferences = PreferencesModel.create(preferencesSnapshot)
      
      // If we have a current station selected, check that it's still valid.
      for (const station of self.preferences.stations) {
        if (station.id == self.local.station) {
          return
        }
      }

      // If current station is invalid (or unset), choose the first one.
      if (self.preferences.stations.length > 0) {
        self.local.setStation(self.preferences.stations[0].id)
      }
    },
    saveStreamInfo: (streams: Map<string, StreamInfo>) => {
      self.streams.replace(streams)
      self.streamsUpdated = Date.now()
    },
  }))
  .actions(self => ({
    getPreferences: flow(function*() {
      indefinitely(async() => {
        const result: GetPreferencesResult = await self.environment.api.getPreferences()
        if (result.kind === "ok") {
          self.savePreferences(result.preferences)
          return
        } else {
          __DEV__ && console.tron.log(result.kind)
          throw "getPreferences error: " + result.kind
        }
      })
    }),
    updateStreamInfo: flow(function*() {
      const result: GetStreamInfoResult = yield self.environment.api.getStreamInfo()
      if (result.kind === "ok") {
        self.saveStreamInfo(result.streams)
      } else {
        __DEV__ && console.tron.log(result.kind)
      }
    }),
  }))

  /**
  * Un-comment the following to omit model attributes from your snapshots (and from async storage).
  * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

  * Note that you'll need to import `omit` from ramda, which is already included in the project!
  *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
  */

type MainStoreType = Instance<typeof MainStoreModel>
export interface MainStore extends MainStoreType {}
type MainStoreSnapshotType = SnapshotOut<typeof MainStoreModel>
export interface MainStoreSnapshot extends MainStoreSnapshotType {}
