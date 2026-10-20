import { Instance, SnapshotOut, types } from "mobx-state-tree"

export type LogoId = "svitle" | "svetloe" | "kids"

export const StationModel = types.model("Station").props({
  id: types.string,
  name: types.string,
  logo: types.string,
  lang: types.string,
})

type StationType = Instance<typeof StationModel>
export interface Station extends StationType {}
type StationSnapshotType = SnapshotOut<typeof StationModel>
export interface StationSnapshot extends StationSnapshotType {}
