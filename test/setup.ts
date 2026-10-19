// Jest setup (loaded via setupFilesAfterEnv). Native modules that have no JS fallback are mocked here.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
)
