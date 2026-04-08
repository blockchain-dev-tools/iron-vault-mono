const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");

const monoRoot = path.resolve(__dirname, "../..");
const packages = path.resolve(monoRoot, "packages");

const config = {
  watchFolders: [packages, path.resolve(monoRoot, "node_modules")],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, "node_modules"),
      path.resolve(monoRoot, "node_modules"),
    ],
    resolveRequest: (context, moduleName, platform) => {
      // Force react and react-native to resolve from apps/mobile to prevent duplicates
      if (moduleName === "react" || moduleName === "react-native") {
        return context.resolveRequest(
          { ...context, originModulePath: path.resolve(__dirname, "index.js") },
          moduleName,
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
