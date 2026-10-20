import { Instance, SnapshotOut, types } from "mobx-state-tree"

export const LocalSettingsModel = types
  .model("LocalSettings")
  .props({
    low_quality: false,
    station: types.maybe(types.string),
  })
  .actions((self) => ({
    setStation(station: string) {
      self.station = station
    },
    toggleQuality() {
      self.low_quality = !self.low_quality
    },
  }))

type LocalSettingsType = Instance<typeof LocalSettingsModel>
export interface LocalSettings extends LocalSettingsType {}
type LocalSettingsSnapshotType = SnapshotOut<typeof LocalSettingsModel>
export interface LocalSettingsSnapshot extends LocalSettingsSnapshotType {}
