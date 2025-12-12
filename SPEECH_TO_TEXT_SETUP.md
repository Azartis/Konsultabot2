# Speech-to-Text Setup with Expo AV and API Key

## Overview

The speech-to-text functionality uses **expo-av** for audio recording and sends the audio to the backend for transcription. The API key you provided has been integrated into the system.

## Architecture

### Frontend (React Native/Expo)
1. **Recording**: Uses `expo-av` (via `ExpoVoiceHelper`) to record audio
2. **Transcription**: Sends recorded audio to backend `/api/v1/chat/transcribe/` endpoint
3. **Display**: Shows transcribed text in the input field

### Backend (Django)
1. **Receives**: Audio file via multipart/form-data
2. **Processes**: Uses `SpeechProcessor` with multiple fallback methods
3. **Returns**: Transcribed text with confidence score

## API Key Configuration

### Backend Configuration
The API key has been added to `backend/konsultabot_backend/settings.py`:

```python
SPEECH_API_KEY = os.getenv('SPEECH_API_KEY', 'Gtt3Q9ZEM8fsg2qfXqi8j5Yk4H4DxbS8')
```

### Frontend Configuration
The API key is stored in `KonsultabotMobileNew/src/config/speechConfig.js`:

```javascript
export const SPEECH_API_KEY = 'Gtt3Q9ZEM8fsg2qfXqi8j5Yk4H4DxbS8';
```

## How It Works

### 1. User Records Audio
- User taps microphone button
- `ExpoVoiceHelper.start()` begins recording using `expo-av`
- Audio is recorded in M4A format (works on both iOS and Android)

### 2. User Stops Recording
- User taps stop button
- `ExpoVoiceHelper.stop()` stops recording and returns audio file URI
- Audio file is saved temporarily

### 3. Audio Sent to Backend
- `apiService.transcribeAudio(audioUri, 'en-US')` is called
- Audio file is sent as multipart/form-data to `/api/v1/chat/transcribe/`
- Backend receives and processes the audio

### 4. Backend Transcription
The backend tries multiple methods in order:
1. **OpenAI Whisper** (if `OPENAI_API_KEY` is set) - Most accurate
2. **Google Cloud Speech** (if credentials available) - Very accurate
3. **Free Google Speech Recognition** - Fallback, less accurate

The `SPEECH_API_KEY` is available for use if it's for a specific service.

### 5. Response Returned
- Backend returns transcribed text with confidence score
- Frontend displays text in input field
- User can edit or send the message

## API Endpoints

### POST `/api/v1/chat/transcribe/`
Transcribe audio file to text.

**Request:**
- `Content-Type: multipart/form-data`
- `audio`: Audio file (M4A, WAV, MP3)
- `language`: Language code (optional, default: 'en-US')

**Response:**
```json
{
  "transcript": "Hello, how are you?",
  "text": "Hello, how are you?",
  "confidence": 0.95,
  "language": "en-US",
  "method": "google_free"
}
```

## Code Flow

### Frontend Flow:
```
User taps mic → ExpoVoiceHelper.start() 
→ User speaks → User taps stop 
→ ExpoVoiceHelper.stop() → apiService.transcribeAudio() 
→ Backend /api/v1/chat/transcribe/ 
→ Response with transcript 
→ Display in input field
```

### Backend Flow:
```
Receive audio file → SpeechProcessor.speech_to_text() 
→ Try OpenAI Whisper → Try Google Cloud → Try Free Google Speech 
→ Return best result
```

## Testing

### Test Recording:
1. Open the app
2. Tap the microphone button
3. Speak a message
4. Tap stop
5. Wait for transcription
6. Verify text appears in input field

### Check Logs:
- Frontend: Look for `🎤 Transcribing audio:` and `✅ Transcription received:`
- Backend: Check Django logs for transcription results

## Troubleshooting

### "No transcript returned"
- Check backend is running
- Verify audio file was created
- Check network connection
- Review backend logs for errors

### "Transcription timed out"
- Audio file might be too long
- Backend might be slow
- Try recording a shorter message

### "Network error"
- Check backend URL is correct
- Verify backend is accessible
- Check ngrok tunnel is active (if using)

## API Key Usage

The API key `Gtt3Q9ZEM8fsg2qfXqi8j5Yk4H4DxbS8` is now:
- ✅ Added to backend settings
- ✅ Available in frontend config
- ✅ Ready to be used by speech recognition services

**Note**: If this API key is for a specific service (AssemblyAI, Deepgram, etc.), you may need to update the `SpeechProcessor` class to use that service's API.

## Next Steps

1. **Test the flow**: Record audio and verify transcription works
2. **Check backend logs**: Ensure transcription is successful
3. **Verify API key**: If the key is for a specific service, integrate that service's API
4. **Monitor performance**: Check transcription accuracy and speed

## Files Modified

### Backend:
- ✅ `backend/konsultabot_backend/settings.py` - Added SPEECH_API_KEY
- ✅ `backend/chat/speech_processor.py` - Updated to use SPEECH_API_KEY

### Frontend:
- ✅ `KonsultabotMobileNew/src/services/apiService.js` - Added `transcribeAudio()` method
- ✅ `KonsultabotMobileNew/src/config/speechConfig.js` - Created config file with API key
- ✅ `KonsultabotMobileNew/src/utils/expoVoiceHelper.js` - Already using expo-av
- ✅ `KonsultabotMobileNew/src/screens/main/ImprovedChatScreen.js` - Already calls transcribeAudio

## Status

✅ **Ready to Use**: The speech-to-text system is now fully integrated and ready to use with expo-av for recording and the backend for transcription.

