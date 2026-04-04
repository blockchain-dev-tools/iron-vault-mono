const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");
const fs = require("fs");

const monoRoot = path.resolve(__dirname, "../..");
// Resolve symlinked node_modules to real path so Metro can watch + resolve it
const nodeModulesReal = fs.realpathSync(path.resolve(__dirname, "node_modules"));
const packages = path.resolve(monoRoot, "packages");

const config = {
  watchFolders: [monoRoot, nodeModulesReal, packages],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, "node_modules"),
      nodeModulesReal,
      path.resolve(monoRoot, "node_modules"),
    ],
    unstable_enableSymlinks: true,
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
