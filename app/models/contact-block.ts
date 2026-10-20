import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { ContactItemModel } from "./contact-item"

export const ContactBlockModel = types.model("ContactBlock").props({
  title: types.maybe(types.string),
  icon_links: types.array(ContactItemModel),
  text_links: types.array(ContactItemModel),
})

type ContactBlockType = Instance<typeof ContactBlockModel>
export interface ContactBlock extends ContactBlockType {}
type ContactBlockSnapshotType = SnapshotOut<typeof ContactBlockModel>
export interface ContactBlockSnapshot extends ContactBlockSnapshotType {}
