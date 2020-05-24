import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"
import { PreferencesModel, PreferencesSnapshot } from "../preferences"
import { LocalSettingsModel } from "../local-settings"
import { withEnvironment} from "../extensions"
import { GetPreferencesResult } from "../../services/api"

/**
 * Model description here for TypeScript hints.
 */
export const PreferencesStoreModel = types
  .model("PreferencesStore")
  .props({
    preferences: types.optional(PreferencesModel, {}),
    local: types.optional(LocalSettingsModel, {})
  })
  .extend(withEnvironment)
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({
    savePreferences: (preferencesSnapshot: PreferencesSnapshot) => {
      self.preferences = PreferencesModel.create(preferencesSnapshot)
      if (!self.local.station && self.preferences.stations.length > 0) {
        self.local.setStation(self.preferences.stations[0])
      } 
    },
  }))
  .actions(self => ({
    getPreferences: flow(function*() {
      const result: GetPreferencesResult = yield self.environment.api.getPreferences()
      if (result.kind === "ok") {
        self.savePreferences(result.preferences)
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

type PreferencesStoreType = Instance<typeof PreferencesStoreModel>
export interface PreferencesStore extends PreferencesStoreType {}
type PreferencesStoreSnapshotType = SnapshotOut<typeof PreferencesStoreModel>
export interface PreferencesStoreSnapshot extends PreferencesStoreSnapshotType {}
