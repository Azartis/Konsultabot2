# LemonFox Speech-to-Text Setup

This app now uses **LemonFox API** for speech-to-text transcription, which provides better reliability and accuracy than the backend transcription service.

## 🎯 Benefits

- ✅ **No backend dependencies** - Works independently of your Django backend
- ✅ **High accuracy** - Powered by advanced speech recognition models
- ✅ **Fast transcription** - Low latency API responses
- ✅ **Multiple language support** - Supports 100+ languages
- ✅ **Free tier available** - 30 hours of free transcription

## 📝 Setup Instructions

### Step 1: Get Your LemonFox API Key

1. Visit [https://www.lemonfox.ai/](https://www.lemonfox.ai/)
2. Sign up for a free account
3. Navigate to your API keys section
4. Copy your API key

### Step 2: Configure the API Key

You have two options:

#### Option A: Environment Variable (Recommended)

Create a `.env` file in the `KonsultabotMobileNew` directory:

```bash
EXPO_PUBLIC_LEMONFOX_API_KEY=your_api_key_here
```

Then restart your Expo development server:

```bash
npm start
```

#### Option B: Update Config File Directly

Edit `KonsultabotMobileNew/src/config/speechConfig.js`:

```javascript
export const LEMONFOX_API_KEY = 'your_api_key_here';
```

**Note:** This method is not recommended for production as it exposes your API key in the code.

### Step 3: Test the Integration

1. Start the app: `npm start`
2. Navigate to the chat screen
3. Tap the microphone button
4. Speak your message
5. Tap stop - the audio will be transcribed using LemonFox API

## 🔄 How It Works

1. **Recording**: The app records audio using `expo-av` (mobile) or Web Speech API (web)
2. **Transcription**: Audio is sent to LemonFox API for transcription
3. **Fallback**: If LemonFox fails, it automatically falls back to the backend transcription service

## 📊 API Usage

- **Endpoint**: `https://api.lemonfox.ai/v1/audio/transcriptions`
- **Method**: POST
- **Authentication**: Bearer token (your API key)
- **Format**: Multipart form data with audio file

## 💰 Pricing

- **Free Tier**: 30 hours of transcription
- **Paid**: $0.17 per hour of transcription after free tier

## 🐛 Troubleshooting

### Error: "LemonFox API key not configured"

**Solution**: Make sure you've set the `EXPO_PUBLIC_LEMONFOX_API_KEY` environment variable and restarted the Expo server.

### Error: "LemonFox API key is invalid"

**Solution**: 
1. Verify your API key is correct
2. Check if your LemonFox account is active
3. Ensure you haven't exceeded your usage limits

### Transcription fails, falls back to backend

**Solution**: 
- Check your internet connection
- Verify your API key is valid
- Check LemonFox API status at [status.lemonfox.ai](https://status.lemonfox.ai)

## 📚 Additional Resources

- [LemonFox API Documentation](https://www.lemonfox.ai/apis/speech-to-text)
- [LemonFox Pricing](https://www.lemonfox.ai/pricing)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

## ✅ Verification

After setup, you should see in the console:
```
🍋 Transcribing audio with LemonFox API: [audio file path]
✅ LemonFox transcription response: { text: "your transcribed text" }
```

If you see this, the integration is working correctly! 🎉

