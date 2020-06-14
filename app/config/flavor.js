const BuildConfig = require('react-native-build-config')

module.exports = {
    "svitle": require("./flavor.svitle"),
    "svetloe": require("./flavor.svetloe"),
}[BuildConfig.default.FLAVOR]
