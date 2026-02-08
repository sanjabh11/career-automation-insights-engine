# LLM System Prompts Library

This directory contains versioned, reviewed prompts for all AI-powered features in the Career Automation Insights Engine.

## Prompt Versioning

Each prompt file follows semantic versioning:
- **Major**: Breaking changes to output format or behavior
- **Minor**: New capabilities or improvements
- **Patch**: Bug fixes or clarifications

## Prompt Files

| File | Purpose | Current Version | Last Updated |
|------|---------|-----------------|--------------|
| `apo-calculation.md` | APO scoring and analysis | 2.0.0 | 2025-10-19 |
| `task-assessment.md` | Task automation categorization | 1.2.0 | 2025-10-19 |
| `skill-recommendations.md` | Personalized skill suggestions | 1.1.0 | 2025-10-19 |
| `career-coaching.md` | AI career advisor responses | 1.0.0 | 2025-10-19 |
| `learning-path.md` | Learning path generation | 1.0.0 | 2025-10-19 |
| `market-intelligence.md` | Job market analysis | 1.0.0 | 2025-10-19 |

## Usage Guidelines

### 1. Schema Enforcement
All prompts must specify JSON output format with strict schema validation using Zod on the server side.

### 2. Grounding with RAG
When possible, inject relevant O*NET data snippets:
- Top-k tasks from `onet_detailed_tasks`
- Knowledge requirements from `onet_knowledge`
- Skills from `onet_skills`
- Work activities from `onet_work_activities`

### 3. Model Configuration
- **Primary Model**: `gemini-2.5-flash` (fast, cost-effective)
- **Fallback Model**: `gemini-2.0-flash-exp` (if primary unavailable)
- **JSON Mode**: Always enforce `responseMimeType: "application/json"`
- **Temperature**: 0.3 for deterministic outputs, 0.7 for creative responses

### 4. Error Handling
- Implement exponential backoff for 503 errors (5s, 10s, 20s)
- Parse and strip markdown code blocks from responses
- Validate all outputs against Zod schemas
- Log failures to `llm_logs` table

### 5. Telemetry
Log all LLM calls to `llm_logs` table with:
- Prompt hash (for deduplication)
- Model used
- Token counts (input/output)
- Latency
- Success/failure status
- Confidence scores

## Testing Prompts

Before deploying prompt changes:

1. **Unit Test**: Test with 10+ sample inputs
2. **Schema Validation**: Ensure 100% valid JSON outputs
3. **A/B Test**: Compare with previous version on 100+ real queries
4. **Review**: Get approval from product team

## Prompt Improvement Process

1. Identify issue or improvement opportunity
2. Create new version in this directory
3. Update version number and changelog
4. Test thoroughly
5. Deploy to staging
6. Monitor metrics for 24 hours
7. Deploy to production
8. Archive old version

## Metrics to Track

- **Accuracy**: User satisfaction ratings
- **Latency**: P50, P95, P99 response times
- **Cost**: Token usage per request
- **Reliability**: Success rate, retry rate
- **Confidence**: Distribution of confidence scores

## Contact

For prompt-related questions or improvements, contact the AI/ML team.
