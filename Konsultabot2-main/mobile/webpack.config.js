const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const path = require("path");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ["@codler/react-native-keyboard-aware-scroll-view"]
    }
  }, argv);

  // Configure WebSocket properly
  config.devServer = {
    ...config.devServer,
    port: 19006,
    host: "localhost",
    hot: true,
    allowedHosts: "all",
    client: {
      webSocketURL: "auto://0.0.0.0:0/ws",
      overlay: true,
    },
    webSocketServer: {
      type: "ws",
      options: {
        path: "/ws"
      }
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  };

  // Add resolve aliases
  config.resolve.alias = {
    ...config.resolve.alias,
    "@": path.resolve(__dirname, "src"),
    "react-native$": "react-native-web"
  };

  return config;
};
