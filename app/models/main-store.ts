import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { PreferencesModel, PreferencesSnapshot } from "./preferences"
import { StreamInfo, StreamInfoModel } from "./stream-info"
import { Station } from "./station"
import { LocalSettingsModel } from "./local-settings"
import { withEnvironment } from "./with-environment"
import { GetStreamInfoResult, GetPreferencesResult } from "../services/api"
import { indefinitely } from "../utils/retry"

const EMPTY_STREAM = {
  current_track: undefined,
  next_track: undefined,
  stream_url: undefined,
  stream_url_low: undefined,
}

export const MainStoreModel = types
  .model("MainStore")
  .props({
    preferences: types.optional(PreferencesModel, {}),
    local: types.optional(LocalSettingsModel, {}),
    streams: types.map(StreamInfoModel),
    streamsUpdated: 0, // timestamp of last update
  })
  .extend(withEnvironment)
  .views((self) => ({
    get current_station(): Station | null {
      return self.preferences.stations.find((station) => station.id === self.local.station) ?? null
    },
    get current_stream(): StreamInfo {
      return self.local.station
        ? self.streams.get(self.local.station) ?? EMPTY_STREAM
        : EMPTY_STREAM
    },
    get current_track(): string | undefined {
      const stream = this.current_stream
      return stream.current_track
    },
    get next_track(): string | undefined {
      const stream = this.current_stream
      return stream.next_track
    },
    get current_url(): string | undefined {
      const stream = this.current_stream
      if (self.local.low_quality && stream.stream_url_low) {
        return stream.stream_url_low
      }
      return stream.stream_url
    },
  }))
  .actions((self) => ({
    savePreferences: (preferencesSnapshot: PreferencesSnapshot) => {
      self.preferences = PreferencesModel.create(preferencesSnapshot)

      // If we have a current station selected, check that it's still valid.
      if (self.preferences.stations.some((station) => station.id === self.local.station)) {
        return
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
  .actions((self) => ({
    getPreferences: () =>
      indefinitely(async () => {
        const result: GetPreferencesResult = await self.environment.api.getPreferences()
        if (result.kind === "ok") {
          self.savePreferences(result.preferences)
          return
        } else {
          __DEV__ && console.log(result.kind)
          throw new Error("getPreferences error: " + result.kind)
        }
      }),
    updateStreamInfo: flow(function* () {
      const result: GetStreamInfoResult = yield self.environment.api.getStreamInfo()
      if (result.kind === "ok") {
        self.saveStreamInfo(result.streams)
      } else {
        __DEV__ && console.log(result.kind)
      }
    }),
  }))

type MainStoreType = Instance<typeof MainStoreModel>
export interface MainStore extends MainStoreType {}
type MainStoreSnapshotType = SnapshotOut<typeof MainStoreModel>
export interface MainStoreSnapshot extends MainStoreSnapshotType {}
