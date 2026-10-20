module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: { "\\.svg$": "<rootDir>/__mocks__/svgMock.tsx" },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-track-player|mobx(?:-react-lite)?)/)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  clearMocks: true,
}
