module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin - must be last in the plugins array
      'react-native-reanimated/plugin',
    ],
  };
};
