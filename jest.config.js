module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: { "\\.svg$": "<rootDir>/__mocks__/svgMock.tsx" },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-track-player)/)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/", "/e2e/"],
  clearMocks: true,
}
