import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { ContactItemModel } from "./contact-item"

/**
 * Model description here for TypeScript hints.
 */
export const ContactBlockModel = types
  .model("ContactBlock")
  .props({
    title: types.maybe(types.string),
    icon_links: types.array(ContactItemModel),
    text_links: types.array(ContactItemModel),
  })
  .views(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions(self => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
  * Un-comment the following to omit model attributes from your snapshots (and from async storage).
  * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

  * Note that you'll need to import `omit` from ramda, which is already included in the project!
  *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
  */

type ContactBlockType = Instance<typeof ContactBlockModel>
export interface ContactBlock extends ContactBlockType {}
type ContactBlockSnapshotType = SnapshotOut<typeof ContactBlockModel>
export interface ContactBlockSnapshot extends ContactBlockSnapshotType {}
