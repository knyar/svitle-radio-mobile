import { Instance, SnapshotOut, types, flow, getParent } from "mobx-state-tree"
import { StationModel, StationSnapshot, Station } from "../station/station"
import { withEnvironment} from "../extensions"
import { GetStationsResult } from "../../services/api"
import { RootStoreModel } from "../root-store"

/**
 * Model description here for TypeScript hints.
 */
export const StationsStoreModel = types
  .model("StationsStore")
  .props({
    stations: types.map(StationModel),
  })
  .extend(withEnvironment)
  .views(self => ({
    get current_station(): Station {
      const prefsStore = getParent<typeof RootStoreModel>(self).preferencesStore
      const current = prefsStore.local.station
      if (self.stations.has(current)) {
        return self.stations.get(current)
      }
      return null
    },
    get current_track(): string {
      const station = this.current_station
      if (!station) { return null }
      return station.current_track
    },
    get next_track(): string {
      const station = this.current_station
      if (!station) { return null }
      return station.next_track
    },
  }))
  .actions(self => ({
    saveStations: (stations: Map<string, StationSnapshot>) => {
      self.stations.replace(stations)
    },
  }))
  .actions(self => ({
    getStations: flow(function*() {
      const result: GetStationsResult = yield self.environment.api.getStations()
      if (result.kind === "ok") {
        self.saveStations(result.stations)
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

type StationsStoreType = Instance<typeof StationsStoreModel>
export interface StationsStore extends StationsStoreType {}
type StationsStoreSnapshotType = SnapshotOut<typeof StationsStoreModel>
export interface StationsStoreSnapshot extends StationsStoreSnapshotType {}
