import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { omit } from "ramda"

/**
 * Model description here for TypeScript hints.
 */
export const StationModel = types
  .model("Station")
  .props({
    current_track: types.maybe(types.string),
    next_track: types.maybe(types.string),
    stream_url: types.maybe(types.string),
    stream_url_low: types.maybe(types.string),
  })
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  // track information gets outdated fast; don't save it into storage.
  .postProcessSnapshot(omit(["current_track", "next_track"]))

  /**
  * Un-comment the following to omit model attributes from your snapshots (and from async storage).
  * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

  * Note that you'll need to import `omit` from ramda, which is already included in the project!
  *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
  */

type StationType = Instance<typeof StationModel>
export interface Station extends StationType {}
type StationSnapshotType = SnapshotOut<typeof StationModel>
export interface StationSnapshot extends StationSnapshotType {}
