import { Instance, SnapshotOut, types } from "mobx-state-tree"

export const StreamInfoModel = types
  .model("StreamInfo")
  .props({
    current_track: types.maybe(types.string),
    next_track: types.maybe(types.string),
    stream_url: types.maybe(types.string),
    stream_url_low: types.maybe(types.string),
  })
  // track information gets outdated fast; don't save it into storage.
  .postProcessSnapshot(
    ({ current_track: _current_track, next_track: _next_track, ...rest }) => rest,
  )

type StreamInfoType = Instance<typeof StreamInfoModel>
export interface StreamInfo extends StreamInfoType {}
type StreamInfoSnapshotType = SnapshotOut<typeof StreamInfoModel>
export interface StreamInfoSnapshot extends StreamInfoSnapshotType {}
