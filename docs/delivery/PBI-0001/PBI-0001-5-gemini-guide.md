# Gemini 2.5 Flash API Usage Guide

**Date:** 2025-07-04
**Source:** [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)

## Endpoint
`POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

## Request Example
```json
{
  "contents": [{ "parts": [{ "text": "YOUR_PROMPT_HERE" }] }],
  "generationConfig": {
    "temperature": 0.2,
    "topK": 1,
    "topP": 0.8,
    "maxOutputTokens": 4096
  }
}
```

## Auth
- API Key: `GEMINI_API_KEY` (server-side, never exposed to browser)

## Response Example
```json
{
  "candidates": [
    {
      "content": {
        "parts": [ { "text": "...response..." } ]
      }
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 37,
    "candidatesTokenCount": 128,
    "totalTokens": 165
  }
}
```

## Best Practices
- Use concise prompts for fastest response
- Log all calls for audit and analytics
- Handle errors and empty candidates

## Sources
- [Gemini API Reference](https://ai.google.dev/gemini-api/docs/reference/rest/v1beta/models/generateContent)
- [Gemini Model Card](https://ai.google.dev/gemini-api/docs/models/gemini)
