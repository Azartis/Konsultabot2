module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin removed - app uses standard React Native Animated API
      // 'react-native-reanimated/plugin',
    ],
  };
};
