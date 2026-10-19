module.exports = {
  root: true,
  extends: ["@react-native", "prettier"],
  rules: {
    // "smart" allows == only for null/undefined checks, typeof, and literal-vs-literal comparisons.
    eqeqeq: ["error", "smart"],
  },
}
