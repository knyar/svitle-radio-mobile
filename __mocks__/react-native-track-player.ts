jest.mock("react-native-track-player/lib/src/TrackPlayerModule", () => ({
  __esModule: true,
  default: new Proxy({}, { get: (_target, property) => property }),
}))

const constants = jest.requireActual("react-native-track-player/lib/src/constants")

export const {
  State,
  Event,
  Capability,
  AppKilledPlaybackBehavior,
  TrackType,
  RepeatMode,
  PitchAlgorithm,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
} = constants

const resolved = () => jest.fn().mockResolvedValue(undefined)

const TrackPlayer = {
  setupPlayer: resolved(),
  updateOptions: resolved(),
  add: resolved(),
  play: resolved(),
  pause: resolved(),
  stop: resolved(),
  reset: resolved(),
  getState: resolved(),
  getPlaybackState: resolved(),
  getActiveTrack: jest.fn().mockResolvedValue(undefined),
  getCurrentTrack: jest.fn().mockResolvedValue(null),
  updateMetadataForTrack: resolved(),
  isServiceRunning: jest.fn().mockResolvedValue(true),
  setVolume: resolved(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  registerPlaybackService: jest.fn(),
  getQueue: resolved(),
  skip: resolved(),
}

export const usePlaybackState = jest.fn(() => ({ state: State.None }))
export const useTrackPlayerEvents = jest.fn()
export const useProgress = jest.fn(() => ({ position: 0, duration: 0, buffered: 0 }))

export function resetTrackPlayerMock() {
  for (const name of [
    "setupPlayer",
    "updateOptions",
    "add",
    "play",
    "pause",
    "stop",
    "reset",
    "getState",
    "getPlaybackState",
    "updateMetadataForTrack",
    "setVolume",
    "getQueue",
    "skip",
  ] as (keyof typeof TrackPlayer)[]) {
    const mock = TrackPlayer[name] as jest.Mock<Promise<unknown>, unknown[]>
    mock.mockReset().mockResolvedValue(undefined)
  }
  TrackPlayer.getActiveTrack.mockReset().mockResolvedValue(undefined)
  TrackPlayer.getCurrentTrack.mockReset().mockResolvedValue(null)
  TrackPlayer.isServiceRunning.mockReset().mockResolvedValue(true)
  TrackPlayer.addEventListener.mockReset().mockImplementation(() => ({ remove: jest.fn() }))
  TrackPlayer.registerPlaybackService.mockReset()
  usePlaybackState.mockReset().mockReturnValue({ state: State.None })
  useTrackPlayerEvents.mockReset()
  useProgress.mockReset().mockReturnValue({ position: 0, duration: 0, buffered: 0 })
}

export default TrackPlayer
