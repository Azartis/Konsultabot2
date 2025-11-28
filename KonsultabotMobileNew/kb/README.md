# Knowledge Base Directory

## 📚 Auto-Building KB

This directory is **initially empty**. The Knowledge Base is automatically built from user conversations with Gemini.

## How It Works

1. **User asks a question** → Gemini responds
2. **Response is automatically saved** → Creates a KB entry here
3. **Future similar questions** → Uses the saved KB entry (faster)

## Directory Structure

```
kb/
├── hardware/     # Hardware-related issues (laptops, printers, etc.)
├── software/     # Software-related issues (apps, programs, etc.)
└── network/      # Network-related issues (WiFi, internet, etc.)
```

## KB Entry Format

Each entry is automatically created as a markdown file:

```markdown
# [Problem Title]

## Symptoms
- [Extracted from user query]

## Step-by-Step Fix
1. [Step from Gemini response]
2. [Step from Gemini response]

## Full Response
[Complete Gemini response]

## When to escalate
- If steps don't work
- If hardware damaged
- etc.
```

## Storage

- **Web**: Saved to `localStorage`
- **Mobile**: Saved to document directory
- **Both**: Also cached in memory for fast access

## Notes

- KB starts **completely empty**
- Every Gemini response becomes a KB entry
- KB grows organically with usage
- No manual editing required

---

**The KB will populate automatically as users interact with the chatbot!** 🚀

