import { Instance, SnapshotOut, types } from "mobx-state-tree"

export const ContactItemModel = types.model("ContactItem").props({
  text: types.string,
  url: types.string,
})

type ContactItemType = Instance<typeof ContactItemModel>
export interface ContactItem extends ContactItemType {}
type ContactItemSnapshotType = SnapshotOut<typeof ContactItemModel>
export interface ContactItemSnapshot extends ContactItemSnapshotType {}
