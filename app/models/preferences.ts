import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { ContactBlockModel } from "./contact-block"
import { StationModel } from "./station"

/**
 * Model description here for TypeScript hints.
 */
export const PreferencesModel = types
  .model("Preferences")
  .props({
    stations: types.array(StationModel),
    url_support: types.maybe(types.string),
    url_archive: types.maybe(types.string),
    url_youtube: types.maybe(types.string),
    contacts: types.array(ContactBlockModel),
  })
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
  * Un-comment the following to omit model attributes from your snapshots (and from async storage).
  * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

  * Note that you'll need to import `omit` from ramda, which is already included in the project!
  *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
  */

type PreferencesType = Instance<typeof PreferencesModel>
export interface Preferences extends PreferencesType {}
type PreferencesSnapshotType = SnapshotOut<typeof PreferencesModel>
export interface PreferencesSnapshot extends PreferencesSnapshotType {}
