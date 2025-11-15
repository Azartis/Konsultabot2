export default {
  expo: {
    name: "Konsultabot",
    slug: "konsultabot-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.evsu.konsultabot"
    },
    android: {
      package: "com.evsu.konsultabot",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "https",
              host: "*.evsu.edu.ph"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "single"
    },
    extra: {
      apiUrl: "http://localhost:8000/api"
    },
    plugins: [
      "expo-secure-store",
      [
        "expo-av",
        {
          microphonePermission: "Allow Konsultabot to access your microphone for voice input."
        }
      ],
      [
        "expo-speech-recognition",
        {
          microphonePermission: "Allow Konsultabot to access your microphone for voice input."
        }
      ]
    ]
  }
};
