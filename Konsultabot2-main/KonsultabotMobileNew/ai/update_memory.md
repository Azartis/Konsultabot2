# Memory Update Logic

## When to Update Memory

Update memory.json whenever the bot encounters:

1. **New question** that wasn't in KB
2. **New fix** that worked for a user
3. **Failed answer** - bot gave wrong/irrelevant response
4. **User correction** - user corrected the bot's information
5. **Repeated question** - same question asked multiple times
6. **New IT issue** - issue not covered in KB

## Update Process

### Step 1: Extract Key Details

From the conversation, extract:
- **Missing knowledge detected**: What did the bot not know?
- **Corrected information**: What did the user correct?
- **New IT issue**: What new problem was reported?
- **Repeated questions**: What questions keep coming up?

### Step 2: Update memory.json

#### Add to "general_facts" when:
- User provides factual information about EVSU Dulag Campus
- User corrects bot's understanding of something
- Bot learns new general information

**Format:**
```json
{
  "fact": "EVSU Dulag Campus has a new computer lab",
  "source": "user_correction",
  "date": "2025-11-27"
}
```

#### Add to "common_questions" when:
- Same question asked 3+ times
- Question pattern appears frequently

**Format:**
```json
{
  "question": "How do I reset my password?",
  "frequency": 5,
  "last_asked": "2025-11-27"
}
```

#### Add to "learned_fixes" when:
- User confirms a fix worked
- New troubleshooting step discovered
- Alternative solution found

**Format:**
```json
{
  "issue": "Laptop won't turn on",
  "solution": "Hold power button for 30 seconds, then try again",
  "success_rate": 0.8,
  "verified": true,
  "date": "2025-11-27"
}
```

#### Add to "past_failures" when:
- Bot gave wrong answer
- Bot gave irrelevant answer
- Bot misunderstood user intent

**Format:**
```json
{
  "user_message": "My laptop is slow",
  "bot_response": "Check your printer settings",
  "issue": "Wrong intent classification - should be IT_ISSUE not OUT_OF_SCOPE",
  "correct_response": "Check Task Manager for high CPU usage",
  "date": "2025-11-27"
}
```

### Step 3: Auto-generate KB File

If a new IT issue appears and bot didn't know it:

1. **Create KB file**: `/kb/<category>/<issue_slug>.md`
2. **Category**: hardware, software, or network
3. **Issue slug**: lowercase, hyphens, e.g., "laptop-wont-charge.md"

**Template:**
```markdown
# Problem Title
Short explanation of the problem.

## Symptoms
- Symptom 1
- Symptom 2

## Causes
- Cause 1
- Cause 2

## Step-by-Step Fix
1. Step 1
2. Step 2
3. Step 3

## When to escalate
- If steps fail
- If hardware is damaged
```

## Learning Pipeline

### For Every Improvement Request:

1. **Read recent chat conversation**
   - Last 10 messages
   - User feedback
   - Bot responses

2. **Detect Issues:**
   - Was the bot wrong?
   - Did the bot miss information?
   - Did the bot give irrelevant answer?
   - Was the user correcting the bot?

3. **If Issues Found:**
   - Update memory.json
   - Add/modify KB entries
   - Improve intent rules if necessary
   - Update system prompt if needed

4. **Re-run bot reasoning:**
   - Test with updated KB + memory
   - Verify improvements

## Continuous Improvement

The bot should:
- Learn from every conversation
- Remember successful solutions
- Avoid repeating past mistakes
- Expand KB with new issues
- Improve intent detection over time

