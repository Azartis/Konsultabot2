# F1 Score and Accuracy Metrics Implementation Guide

## Overview

This document describes the implementation of **F1 Score** and **Accuracy/Factual Correctness** as core performance metrics for Konsultabot.

---

## 📊 Metrics Definitions

### F1 Score
The F1 score is the harmonic mean of precision and recall, providing a balanced measure of model performance.

**Formula:**
```
F1 Score = 2 × (Precision × Recall) / (Precision + Recall)
```

Where:
- **Precision** = True Positives / (True Positives + False Positives)
- **Recall** = True Positives / (True Positives + False Negatives)

**Classification Definitions:**
- **True Positive (TP)**: Response is factually correct AND relevant
- **False Positive (FP)**: Response is not factually correct (provided wrong information)
- **False Negative (FN)**: Response is relevant but not factually correct (should have answered correctly)
- **True Negative (TN)**: Response is not relevant and correctly didn't answer (or shouldn't have answered)

### Accuracy (Factual Correctness)
The percentage of responses that are factually correct.

**Formula:**
```
Accuracy = (Correct Responses / Total Responses) × 100
```

---

## 🗄️ Database Models

### ResponseEvaluation Model
Stores evaluation results for each query/response pair.

**Key Fields:**
- `query_log`: Link to the QueryLog entry
- `is_factually_correct`: Boolean indicating factual correctness
- `is_relevant`: Boolean indicating relevance
- `is_complete`: Boolean indicating completeness
- `classification`: TP, FP, FN, or TN (auto-calculated)
- `factual_correctness_score`: Score from 0.0 to 1.0
- `ground_truth`: The correct/expected answer

### QueryLog Model (Updated)
Added evaluation fields:
- `is_factually_correct`: Boolean for quick accuracy calculation
- `evaluation_score`: Overall evaluation score (0.0 to 1.0)

---

## 🔌 API Endpoints

### 1. Submit Evaluation
**POST** `/api/analytics/evaluate/`

Submit an evaluation for a query/response pair.

**Request Body:**
```json
{
  "query_log_id": 123,
  "is_factually_correct": true,
  "is_relevant": true,
  "is_complete": true,
  "ground_truth": "The correct answer should be...",
  "factual_correctness_score": 0.95,
  "relevance_score": 0.90,
  "completeness_score": 0.85,
  "evaluation_notes": "Additional notes",
  "evaluator_type": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Evaluation submitted successfully",
  "evaluation_id": 456,
  "classification": "tp"
}
```

### 2. Get Comprehensive Metrics
**GET** `/api/analytics/metrics/`

Get F1 score, accuracy, and other metrics.

**Query Parameters:**
- `days`: Number of days to look back (default: 30)
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `source`: Filter by response source (optional)

**Response:**
```json
{
  "f1_score": {
    "f1_score": 0.8750,
    "precision": 0.9000,
    "recall": 0.8500,
    "true_positives": 90,
    "false_positives": 10,
    "false_negatives": 15,
    "true_negatives": 5,
    "total_evaluations": 120
  },
  "accuracy": {
    "accuracy": 87.50,
    "accuracy_decimal": 0.8750,
    "correct_responses": 105,
    "incorrect_responses": 15,
    "total_responses": 120
  },
  "evaluation_coverage": 75.5,
  "total_queries": 159,
  "evaluated_queries": 120
}
```

### 3. Get F1 Score
**GET** `/api/analytics/f1-score/`

Get F1 score metrics only.

**Query Parameters:**
- `days`: Number of days (default: 30)
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)

**Response:**
```json
{
  "f1_score": 0.8750,
  "precision": 0.9000,
  "recall": 0.8500,
  "true_positives": 90,
  "false_positives": 10,
  "false_negatives": 15,
  "true_negatives": 5,
  "total_evaluations": 120
}
```

### 4. Get Accuracy
**GET** `/api/analytics/accuracy/`

Get accuracy metrics only.

**Query Parameters:**
- `days`: Number of days (default: 30)
- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `use_query_log`: Use QueryLog.is_factually_correct instead of ResponseEvaluation (default: false)

**Response:**
```json
{
  "accuracy": 87.50,
  "accuracy_decimal": 0.8750,
  "correct_responses": 105,
  "incorrect_responses": 15,
  "total_responses": 120
}
```

### 5. Get Evaluation Statistics
**GET** `/api/analytics/evaluation-stats/`

Get detailed evaluation statistics (requires authentication).

**Response:**
```json
{
  "total_evaluations": 120,
  "evaluated": 100,
  "pending": 20,
  "evaluator_breakdown": [
    {"evaluator_type": "user", "count": 80},
    {"evaluator_type": "expert", "count": 20}
  ],
  "classification_breakdown": [
    {"classification": "tp", "count": 90},
    {"classification": "fp", "count": 10},
    {"classification": "fn", "count": 15},
    {"classification": "tn", "count": 5}
  ]
}
```

---

## 💻 Usage Examples

### Python Example
```python
import requests

# Submit an evaluation
response = requests.post('https://your-backend.com/api/analytics/evaluate/', json={
    'query_log_id': 123,
    'is_factually_correct': True,
    'is_relevant': True,
    'is_complete': True,
    'ground_truth': 'The WiFi password is "EVSU2024"',
    'factual_correctness_score': 0.95,
    'evaluator_type': 'user'
})

# Get metrics
metrics = requests.get('https://your-backend.com/api/analytics/metrics/?days=30')
print(metrics.json())
```

### JavaScript/React Native Example
```javascript
// Submit evaluation
const submitEvaluation = async (queryLogId, isCorrect, groundTruth) => {
  const response = await fetch('https://your-backend.com/api/analytics/evaluate/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query_log_id: queryLogId,
      is_factually_correct: isCorrect,
      is_relevant: true,
      is_complete: true,
      ground_truth: groundTruth,
      evaluator_type: 'user',
    }),
  });
  return await response.json();
};

// Get F1 score
const getF1Score = async (days = 30) => {
  const response = await fetch(
    `https://your-backend.com/api/analytics/f1-score/?days=${days}`
  );
  return await response.json();
};

// Get accuracy
const getAccuracy = async (days = 30) => {
  const response = await fetch(
    `https://your-backend.com/api/analytics/accuracy/?days=${days}`
  );
  return await response.json();
};
```

---

## 🔧 Implementation Details

### Metrics Calculator
The `MetricsCalculator` class provides static methods for calculating metrics:

- `calculate_f1_score()`: Calculate F1 score, precision, and recall
- `calculate_accuracy()`: Calculate accuracy percentage
- `calculate_comprehensive_metrics()`: Get all metrics at once
- `get_metrics_by_source()`: Get metrics broken down by response source

### Auto-Classification
The `ResponseEvaluation` model automatically calculates classification (TP/FP/FN/TN) based on:
- `is_factually_correct`: Must be set
- `is_relevant`: Must be set

Classification logic:
- **TP**: `is_factually_correct=True` AND `is_relevant=True`
- **FP**: `is_factually_correct=False`
- **FN**: `is_relevant=True` AND `is_factually_correct=False`
- **TN**: Otherwise

---

## 📝 Database Migration

To apply the new models and fields, run:

```bash
cd backend
python manage.py makemigrations analytics
python manage.py migrate
```

---

## 🎯 Best Practices

### 1. Evaluation Collection
- **User Feedback**: Collect evaluations from users (thumbs up/down, ratings)
- **Expert Review**: Have domain experts review responses periodically
- **Automated Evaluation**: Use automated checks where possible (e.g., fact-checking APIs)

### 2. Ground Truth
- Maintain a ground truth database for common queries
- Update ground truth as knowledge base evolves
- Use expert-validated answers as ground truth

### 3. Evaluation Coverage
- Aim for at least 20-30% evaluation coverage
- Prioritize evaluating:
  - High-traffic queries
  - Critical/technical queries
  - Queries with low confidence scores

### 4. Metrics Interpretation
- **F1 Score > 0.8**: Excellent performance
- **F1 Score 0.6-0.8**: Good performance
- **F1 Score < 0.6**: Needs improvement
- **Accuracy > 90%**: Excellent factual correctness
- **Accuracy 80-90%**: Good factual correctness
- **Accuracy < 80%**: Needs improvement

---

## 📊 Dashboard Integration

### Recommended Dashboard Metrics:
1. **F1 Score** (primary metric)
2. **Accuracy** (primary metric)
3. **Precision** (secondary)
4. **Recall** (secondary)
5. **Evaluation Coverage** (tracking)
6. **Metrics by Source** (Gemini vs Knowledge Base)

### Sample Dashboard Query:
```python
from django_konsultabot.analytics.metrics_calculator import MetricsCalculator

# Get last 30 days metrics
metrics = MetricsCalculator.calculate_comprehensive_metrics(days=30)

print(f"F1 Score: {metrics['f1_score']['f1_score']:.4f}")
print(f"Accuracy: {metrics['accuracy']['accuracy']:.2f}%")
print(f"Coverage: {metrics['evaluation_coverage']:.2f}%")
```

---

## 🔍 Troubleshooting

### No Evaluations Found
- Ensure evaluations are being submitted via `/api/analytics/evaluate/`
- Check that `query_log_id` exists in QueryLog
- Verify evaluation status is 'evaluated'

### Zero F1 Score
- Check that evaluations have `classification` set
- Ensure `is_factually_correct` and `is_relevant` are set
- Verify there are TP, FP, or FN classifications

### Low Accuracy
- Review incorrect responses to identify patterns
- Check if specific response sources (Gemini vs KB) have lower accuracy
- Consider improving knowledge base or prompt engineering

---

## 📚 Additional Resources

- [F1 Score on Wikipedia](https://en.wikipedia.org/wiki/F-score)
- [Precision and Recall](https://en.wikipedia.org/wiki/Precision_and_recall)
- [Django ORM Aggregation](https://docs.djangoproject.com/en/stable/topics/db/aggregation/)

---

**Last Updated:** 2024
**Status:** ✅ Implemented and Ready for Use

