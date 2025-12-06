module.exports = function(api) {
  api.cache(true);
  
  const plugins = [];
  
  // Conditionally add reanimated plugin (only if available)
  // This prevents errors when using Expo Go which doesn't support native modules
  try {
    require.resolve('react-native-reanimated/plugin');
    plugins.push('react-native-reanimated/plugin');
  } catch (error) {
    // Reanimated plugin not available - this is OK for Expo Go
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ react-native-reanimated plugin not available (Expo Go mode)');
    }
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins: plugins, // Reanimated plugin must be last if present
  };
};
