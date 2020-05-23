import { Instance, SnapshotOut, types } from "mobx-state-tree"

/**
 * Model description here for TypeScript hints.
 */
export const ContactItemModel = types
  .model("ContactItem")
  .props({
    text: types.string,
    url: types.string,
  })
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
  * Un-comment the following to omit model attributes from your snapshots (and from async storage).
  * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

  * Note that you'll need to import `omit` from ramda, which is already included in the project!
  *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
  */

type ContactItemType = Instance<typeof ContactItemModel>
export interface ContactItem extends ContactItemType {}
type ContactItemSnapshotType = SnapshotOut<typeof ContactItemModel>
export interface ContactItemSnapshot extends ContactItemSnapshotType {}
