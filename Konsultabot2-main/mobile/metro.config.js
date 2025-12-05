const { getDefaultConfig } = require("@expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.assetExts.push("pem");

defaultConfig.server = {
  ...defaultConfig.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      return middleware(req, res, next);
    };
  },
};

module.exports = defaultConfig;
