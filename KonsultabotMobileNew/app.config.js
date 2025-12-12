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

    assetBundlePatterns: ["**/*"],

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
      // Ngrok URL takes priority if set, otherwise fallback to local IP
      apiUrl: process.env.EXPO_PUBLIC_NGROK_URL 
        ? process.env.EXPO_PUBLIC_NGROK_URL
        : process.env.EXPO_PUBLIC_API_URL || "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev",
      ngrokUrl: process.env.EXPO_PUBLIC_NGROK_URL || "https://unmutated-nondeprecatively-bonnie.ngrok-free.dev",
      // LemonFox API Key for Speech-to-Text
      lemonfoxApiKey: process.env.EXPO_PUBLIC_LEMONFOX_API_KEY || "",
      eas: {
        projectId: "a026b613-0cb1-45f4-8057-b32705e327f6"
      }
    },

    plugins: [
      "expo-secure-store",
      [
        "expo-av",
        {
          microphonePermission:
            "Allow Konsultabot to access your microphone for voice input."
        }
      ],
      [
        "@react-native-voice/voice",
        {
          microphonePermission: "Allow Konsultabot to access your microphone for voice input."
        }
      ],

      // ✅ FIXES THE GRADLE MERGE CONFLICT - Duplicate META-INF files
      [
        "expo-build-properties",
        {
          android: {
            packagingOptions: {
              pickFirst: [
                "META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version",
                "META-INF/androidx.customview_customview.version",
                "META-INF/androidx.*.version"
              ],
              exclude: [
                "META-INF/com.android.support_*.version"
              ]
            }
          }
        }
      ]
    ]
  }
};
