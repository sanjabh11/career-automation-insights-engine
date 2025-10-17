// supabase/lib/promptSchemas.ts
// Reusable JSON schema literal strings for LLM responses
// These align with Zod validation schemas and ensure consistent structured output

export const SCHEMA_CAREER_COACH_RESPONSE = `{
  "response": "string (main response text)",
  "followUpQuestions": ["string (question 1)", "string (question 2)"],
  "actionItems": ["string (action 1)", "string (action 2)"],
  "insights": ["string (insight 1)", "string (insight 2)"]
}`;

export const SCHEMA_TASK_ASSESSMENT = `{
  "category": "Automate|Augment|Human-only",
  "explanation": "string (max 280 chars)",
  "confidence": "number (0.0-1.0)"
}`;

export const SCHEMA_SKILL_RECOMMENDATION = `[
  {
    "skill_name": "string (specific skill)",
    "explanation": "string (max 280 chars)",
    "priority": "number (1-3, where 1=highest)"
  }
]`;

export const SCHEMA_OCCUPATION_TASKS = `{
  "tasks": [
    {
      "description": "string (task description)",
      "category": "Automate|Augment|Human-only",
      "explanation": "string (max 280 chars)",
      "confidence": "number (0.0-1.0)"
    }
  ]
}`;

export const SCHEMA_MARKET_INTELLIGENCE = `{
  "supply_demand": {
    "current_supply": "string",
    "current_demand": "string",
    "trend": "growing|stable|declining",
    "outlook_years": "number"
  },
  "automation_risk": {
    "risk_level": "low|medium|high|very_high",
    "timeline_years": "number",
    "key_factors": ["string"]
  },
  "opportunities": {
    "emerging_roles": ["string"],
    "growth_areas": ["string"],
    "geographic_hotspots": ["string"]
  },
  "recommendations": [
    {
      "target": "workers|employers|policymakers",
      "action": "string",
      "priority": "high|medium|low"
    }
  ]
}`;

export const SCHEMA_LEARNING_PATH = `{
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "duration_weeks": "number",
      "duration_hours": "number (optional)",
      "cost_usd": "number (optional, 0 for free)",
      "prerequisites": ["string (milestone titles)"],
      "resources": [
        {
          "title": "string",
          "type": "course|book|certification|project|video",
          "url": "string (optional)",
          "provider": "string (optional)"
        }
      ],
      "success_criteria": ["string"]
    }
  ],
  "total_duration_weeks": "number",
  "estimated_cost_usd": "number"
}`;

export const SCHEMA_PROFILE_ANALYSIS_AUTOMATION_RISK = `{
  "automationRiskScore": "number (0-100)",
  "automationRiskCategory": "Low|Medium|High|Very High",
  "riskyTasks": ["string"],
  "safeTasks": ["string"],
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "priority": "high|medium|low",
      "estimatedDuration": "string (e.g., '3-6 months')"
    }
  ],
  "timelineYears": "number"
}`;

export const SCHEMA_PROFILE_ANALYSIS_GAP = `{
  "skillGaps": [
    {
      "skill": "string",
      "currentLevel": "beginner|intermediate|advanced",
      "targetLevel": "intermediate|advanced|expert",
      "priority": "high|medium|low",
      "learningPath": "string"
    }
  ],
  "strengthAreas": ["string"],
  "developmentPriorities": ["string"]
}`;

export const SCHEMA_PROFILE_ANALYSIS_CAREER_MATCH = `{
  "matchScore": "number (0-100)",
  "matchCategory": "Excellent|Good|Fair|Poor",
  "alignedSkills": ["string"],
  "missingSkills": ["string"],
  "transitionDifficulty": "easy|moderate|challenging",
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "priority": "high|medium|low"
    }
  ]
}`;

export const SCHEMA_PROFILE_ANALYSIS_SKILL_ASSESSMENT = `{
  "technicalSkills": [
    {
      "skill": "string",
      "level": "beginner|intermediate|advanced|expert",
      "marketDemand": "high|medium|low",
      "futureRelevance": "growing|stable|declining"
    }
  ],
  "softSkills": [
    {
      "skill": "string",
      "level": "beginner|intermediate|advanced|expert",
      "importance": "critical|high|medium|low"
    }
  ],
  "overallAssessment": "string",
  "developmentPriorities": ["string"]
}`;
