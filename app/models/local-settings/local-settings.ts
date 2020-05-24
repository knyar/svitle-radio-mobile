import { Instance, SnapshotOut, types } from "mobx-state-tree"

/**
 * Model description here for TypeScript hints.
 */
export const LocalSettingsModel = types
  .model("LocalSettings")
  .props({
    low_quality: false,
    station: types.maybe(types.string),
  })
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({
    setStation(station: string) {
      self.station = station
    },
    toggleQuality() {
      self.low_quality = !self.low_quality
    },
  })) // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
  * Un-comment the following to omit model attributes from your snapshots (and from async storage).
  * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

  * Note that you'll need to import `omit` from ramda, which is already included in the project!
  *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
  */

type LocalSettingsType = Instance<typeof LocalSettingsModel>
export interface LocalSettings extends LocalSettingsType {}
type LocalSettingsSnapshotType = SnapshotOut<typeof LocalSettingsModel>
export interface LocalSettingsSnapshot extends LocalSettingsSnapshotType {}
