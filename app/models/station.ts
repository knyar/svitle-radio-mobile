import { Instance, SnapshotOut, types } from "mobx-state-tree"

export type LogoId = "svitle" | "svetloe" | "kids"

// One entry of `stations` in the preferences API. `lang` is optional: when the API omits it, the
// Streams screen shows no language line under the station name.
export const StationModel = types.model("Station").props({
  id: types.string,
  name: types.string,
  logo: types.string,
  lang: types.maybe(types.string),
})

type StationType = Instance<typeof StationModel>
export interface Station extends StationType {}
type StationSnapshotType = SnapshotOut<typeof StationModel>
export interface StationSnapshot extends StationSnapshotType {}
