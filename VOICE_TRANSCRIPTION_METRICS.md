# Voice Transcription Metrics Implementation

## Overview
Added comprehensive metrics tracking for voice/microphone transcription functionality.

## New Model: `VoiceTranscriptionMetrics`

### Location
`backend/django_konsultabot/analytics/models.py`

### Key Features

1. **Accuracy Metrics**
   - Word Error Rate (WER)
   - Character Error Rate (CER)
   - Overall Accuracy Score
   - Calculated automatically when ground truth is provided

2. **Performance Metrics**
   - Processing time (latency)
   - Audio duration
   - Transcription method used

3. **Quality Metrics**
   - Confidence scores from transcription service
   - Audio format, file size, sample rate, channels
   - Language detection

4. **Error Tracking**
   - Error types (network, authentication, API, audio format, etc.)
   - Error messages and codes
   - Success/failure status

5. **Method Comparison**
   - Tracks which transcription method was used:
     - LemonFox API
     - Google Speech-to-Text REST API
     - Google Cloud Speech
     - OpenAI Whisper
     - Backend Fallback

### Model Fields

```python
- user: ForeignKey to User (optional)
- session_id: CharField
- transcript: TextField
- ground_truth: TextField (optional, for accuracy calculation)
- success: BooleanField
- word_error_rate: FloatField (0.0 to 1.0+)
- character_error_rate: FloatField (0.0 to 1.0+)
- accuracy_score: FloatField (0.0 to 1.0)
- processing_time: FloatField (seconds)
- audio_duration: FloatField (seconds)
- transcription_method: CharField (choices)
- confidence_score: FloatField (0.0 to 1.0)
- error_type: CharField (choices)
- error_message: TextField
- error_code: CharField
- audio_format: CharField (wav, mp3, m4a, etc.)
- audio_file_size: IntegerField (bytes)
- sample_rate: IntegerField (Hz)
- channels: IntegerField (1=mono, 2=stereo)
- language: CharField
- detected_language: CharField
- metadata: JSONField
- created_at: DateTimeField
```

## Integration

### Automatic Tracking
The `transcribe_audio_view` in `backend/chat/views.py` now automatically logs:
- All transcription attempts (successful and failed)
- Processing times
- Error details
- Method used
- Audio metadata

### API Endpoints

#### 1. Get Transcription Statistics
```
GET /api/analytics/voice-transcription-metrics/
```

Query Parameters:
- `days`: Number of days to look back (default: 30)
- `method`: Filter by transcription method (optional)

Response:
```json
{
  "success": true,
  "period_days": 30,
  "method_filter": "all",
  "statistics": {
    "total_transcriptions": 150,
    "successful": 142,
    "failed": 8,
    "success_rate": 94.67,
    "avg_processing_time": 2.34,
    "avg_confidence": 0.89,
    "avg_accuracy": 0.92,
    "method_breakdown": {
      "lemonfox": 120,
      "google_speech_api": 20,
      "openai_whisper": 10
    },
    "error_breakdown": {
      "network": 3,
      "api_error": 2,
      "audio_format": 3
    },
    "language_breakdown": {
      "en-US": 100,
      "tl-PH": 30,
      "ceb-PH": 20
    }
  }
}
```

#### 2. Get Detailed Transcription Records
```
GET /api/analytics/voice-transcription-details/
```

Requires authentication.

Query Parameters:
- `days`: Number of days to look back (default: 7)
- `method`: Filter by transcription method (optional)
- `success`: Filter by success status (true/false, optional)
- `limit`: Limit number of results (default: 100, max: 1000)

Response:
```json
{
  "success": true,
  "count": 50,
  "total_available": 150,
  "records": [
    {
      "id": 1,
      "transcript": "Hello, how are you?",
      "success": true,
      "processing_time": 2.34,
      "transcription_method": "lemonfox",
      "confidence_score": 0.95,
      "error_type": "none",
      "error_message": "",
      "audio_format": "m4a",
      "audio_file_size": 245678,
      "language": "en-US",
      "word_error_rate": 0.05,
      "character_error_rate": 0.03,
      "accuracy_score": 0.95,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Usage Examples

### Recording a Transcription (Automatic)
The system automatically records metrics when transcription is performed via `/api/v1/chat/transcribe/`.

Optional parameters you can include:
- `session_id`: For session tracking
- `ground_truth`: For accuracy calculation

### Manual Recording
```python
from django_konsultabot.analytics.models import VoiceTranscriptionMetrics

# Record a successful transcription
metric = VoiceTranscriptionMetrics.record_transcription(
    transcript="Hello, how are you?",
    success=True,
    processing_time=2.34,
    transcription_method='lemonfox',
    confidence_score=0.95,
    audio_format='m4a',
    audio_file_size=245678,
    language='en-US',
    user=request.user,
    session_id='session_123',
    ground_truth="Hello, how are you?"  # For accuracy calculation
)
```

### Getting Statistics
```python
from django_konsultabot.analytics.models import VoiceTranscriptionMetrics

# Get overall stats
stats = VoiceTranscriptionMetrics.get_transcription_stats(days=30)

# Get stats for specific method
lemonfox_stats = VoiceTranscriptionMetrics.get_transcription_stats(
    days=30,
    method='lemonfox'
)
```

## Database Migration

To apply the new model, run:

```bash
cd backend
python manage.py makemigrations analytics
python manage.py migrate analytics
```

**Note**: If you encounter a Unicode encoding error during migration (related to emoji in print statements), you can:
1. Set environment variable: `PYTHONIOENCODING=utf-8`
2. Or temporarily comment out emoji print statements in `backend/chat/views.py`

## Benefits

1. **Performance Monitoring**: Track transcription latency and identify bottlenecks
2. **Quality Assurance**: Measure accuracy and confidence scores
3. **Method Comparison**: Compare performance of different transcription services
4. **Error Analysis**: Identify common failure modes
5. **User Analytics**: Track usage patterns by language, format, etc.
6. **Cost Optimization**: Monitor which methods are most cost-effective

## Future Enhancements

Potential additions:
- Real-time metrics dashboard
- Automated alerts for high error rates
- Cost tracking per transcription method
- User satisfaction ratings for transcriptions
- Audio quality scoring
- Automatic method selection based on historical performance

