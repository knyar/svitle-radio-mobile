const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== "svg"),
      sourceExts: [...sourceExts, "svg"],
      resolveRequest: (context, moduleName, platform) => {
        // Force axios to use the browser version instead of Node.js version
        if (moduleName === "axios" || moduleName.startsWith("axios/")) {
          return {
            filePath: path.resolve(__dirname, "node_modules/axios/dist/browser/axios.cjs"),
            type: "sourceFile",
          };
        }
        // Use default resolution for other modules
        return context.resolveRequest(context, moduleName, platform);
      },
    }
};

module.exports = mergeConfig(defaultConfig, config);