# Intent Detection Rules

## Intent Classification Rules

### IT_ISSUE
**Triggers:**
- Contains verbs: "not working", "broken", "can't open", "won't start", "crash", "freeze", "error"
- Contains problem indicators: "issue", "problem", "trouble", "help with", "fix"
- Contains device/software mentions: "laptop", "computer", "printer", "wifi", "internet", "app", "software"
- Contains technical terms: "blue screen", "slow", "overheating", "battery", "screen", "keyboard"

**Examples:**
- "My laptop won't turn on"
- "Printer is not working"
- "Internet connection is slow"
- "App keeps crashing"

### NO_PROBLEM
**Triggers:**
- Contains: "no issue", "no problem", "everything fine", "all good", "nothing wrong"
- Contains: "don't have problem", "don't have issue", "no trouble"
- Contains: "I'm fine", "I'm good", "no concerns"

**Examples:**
- "I don't have any issue"
- "No problem here"
- "Everything is fine"

### GENERAL_QUERY
**Triggers:**
- Questions about bot: "who are you", "what are you", "who made you", "who developed you"
- Questions about capabilities: "what can you do", "how do you work"
- General information requests not related to IT issues

**Examples:**
- "Who is your developer?"
- "What are you?"
- "Tell me about yourself"

### GREETINGS
**Triggers:**
- "hi", "hello", "hey", "good morning", "good afternoon", "good evening"
- "greetings", "how are you"

**Examples:**
- "Hello"
- "Hi there"
- "Good morning"

### GOODBYE
**Triggers:**
- "thanks", "thank you", "bye", "goodbye", "see you"
- "appreciate", "grateful", "helped", "worked", "fixed"

**Examples:**
- "Thank you"
- "Thanks for the help"
- "Bye"

### OUT_OF_SCOPE
**Triggers:**
- Non-IT topics: weather, time, date, general knowledge, entertainment, personal questions
- No tech context words present

**Examples:**
- "What's the weather?"
- "Who invented the telephone?" (unless asking about tech troubleshooting)
- "What's your favorite color?"

### UNKNOWN
**Triggers:**
- Message too short (< 3 characters)
- No clear intent detected
- Unclear or incomplete input

**Examples:**
- "???"
- "hmm"
- "idk"

## Intent Priority (if multiple match)

1. **IT_ISSUE** (highest priority)
2. **NO_PROBLEM**
3. **GENERAL_QUERY**
4. **GREETINGS**
5. **GOODBYE**
6. **OUT_OF_SCOPE**
7. **UNKNOWN** (lowest priority)

## Special Cases

- If message contains both IT_ISSUE and NO_PROBLEM indicators → Check negation first
  - "I don't have a problem with my laptop" → NO_PROBLEM (not IT_ISSUE)
  - "My laptop has no problem" → Could be IT_ISSUE if context suggests troubleshooting

- If message contains both IT_ISSUE and GENERAL_QUERY → IT_ISSUE takes priority
  - "What is a router and mine is not working" → IT_ISSUE

