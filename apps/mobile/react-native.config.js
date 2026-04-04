module.exports = {
  dependencies: {
    // Exclude from native autolinking — we use it as pure-JS font renderer
    // The MaterialIcons.ttf is bundled manually in android/app/src/main/assets/fonts/
    'react-native-vector-icons': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
