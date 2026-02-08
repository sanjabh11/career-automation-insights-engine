# APO Calculation Prompt

**Version**: 2.0.0  
**Last Updated**: 2025-10-19  
**Model**: gemini-2.5-flash  
**Temperature**: 0.3  
**JSON Mode**: Enabled

## Purpose

Calculate Automation Potential Overview (APO) scores for occupations across multiple dimensions: tasks, knowledge, skills, abilities, and technologies.

## Input Format

```typescript
{
  occupation: {
    code: string;          // O*NET SOC code
    title: string;         // Occupation title
    description?: string;  // Optional description
  };
  context?: {
    tasks?: string[];      // Top tasks from onet_detailed_tasks
    knowledge?: string[];  // Knowledge areas from onet_knowledge
    skills?: string[];     // Skills from onet_skills
    abilities?: string[];  // Abilities from onet_abilities
    technologies?: string[]; // Technologies from onet_technologies
  };
}
```

## System Prompt

```
You are an AI automation analyst specializing in assessing how artificial intelligence and automation technologies might impact different occupations.

Your task is to analyze the provided occupation and generate structured assessments for each category: Tasks, Knowledge, Skills, Abilities, and Technologies.

For each category, provide:
1. **items**: Array of specific items with automation potential scores (0-100)
2. **reasoning**: Brief explanation of the overall automation potential for this category
3. **confidence**: Your confidence in this assessment (0.0-1.0)

Scoring Guidelines:
- **80-100**: Highly automatable (routine, repetitive, rule-based)
- **50-79**: Partially automatable (requires AI augmentation)
- **20-49**: Difficult to automate (requires human judgment, creativity)
- **0-19**: Not automatable (requires human empathy, complex decision-making)

Consider:
- Current AI capabilities (LLMs, computer vision, robotics)
- Complexity of human judgment required
- Need for creativity, empathy, or interpersonal skills
- Physical vs. cognitive nature of work
- Regulatory and ethical constraints

Output strict JSON matching this schema:
{
  "tasks": {
    "items": [{"name": string, "score": number, "reasoning": string}],
    "overallScore": number,
    "reasoning": string,
    "confidence": number
  },
  "knowledge": { /* same structure */ },
  "skills": { /* same structure */ },
  "abilities": { /* same structure */ },
  "technologies": { /* same structure */ },
  "overallAPO": number,
  "timeline": "Short-term (1-3 years)" | "Medium-term (3-7 years)" | "Long-term (7+ years)",
  "riskLevel": "Low" | "Medium" | "High",
  "confidence": number
}
```

## User Prompt Template

```
Analyze the automation potential for this occupation:

**Occupation**: {{occupation.title}} ({{occupation.code}})
{{#if occupation.description}}
**Description**: {{occupation.description}}
{{/if}}

{{#if context.tasks}}
**Key Tasks**:
{{#each context.tasks}}
- {{this}}
{{/each}}
{{/if}}

{{#if context.knowledge}}
**Required Knowledge**:
{{#each context.knowledge}}
- {{this}}
{{/each}}
{{/if}}

{{#if context.skills}}
**Required Skills**:
{{#each context.skills}}
- {{this}}
{{/each}}
{{/if}}

{{#if context.abilities}}
**Required Abilities**:
{{#each context.abilities}}
- {{this}}
{{/each}}
{{/if}}

{{#if context.technologies}}
**Technologies Used**:
{{#each context.technologies}}
- {{this}}
{{/each}}
{{/if}}

Provide a comprehensive automation potential analysis.
```

## Output Schema (Zod)

```typescript
const APOAnalysisSchema = z.object({
  tasks: z.object({
    items: z.array(z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      reasoning: z.string()
    })),
    overallScore: z.number().min(0).max(100),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1)
  }),
  knowledge: z.object({ /* same */ }),
  skills: z.object({ /* same */ }),
  abilities: z.object({ /* same */ }),
  technologies: z.object({ /* same */ }),
  overallAPO: z.number().min(0).max(100),
  timeline: z.enum(["Short-term (1-3 years)", "Medium-term (3-7 years)", "Long-term (7+ years)"]),
  riskLevel: z.enum(["Low", "Medium", "High"]),
  confidence: z.number().min(0).max(1)
});
```

## Post-Processing

After receiving LLM output:

1. **Validate** against Zod schema
2. **Apply weights** from `apo_config` table:
   - tasks_weight (default: 0.35)
   - knowledge_weight (default: 0.20)
   - skills_weight (default: 0.20)
   - abilities_weight (default: 0.15)
   - technologies_weight (default: 0.10)
3. **Calculate final APO**:
   ```
   finalAPO = (tasks.overallScore * tasks_weight) +
              (knowledge.overallScore * knowledge_weight) +
              (skills.overallScore * skills_weight) +
              (abilities.overallScore * abilities_weight) +
              (technologies.overallScore * technologies_weight)
   ```
4. **Log to telemetry** (`apo_logs` table)

## Example Output

```json
{
  "tasks": {
    "items": [
      {
        "name": "Data entry and record keeping",
        "score": 95,
        "reasoning": "Highly repetitive and rule-based, easily automated with RPA"
      },
      {
        "name": "Customer consultation",
        "score": 35,
        "reasoning": "Requires empathy and complex problem-solving"
      }
    ],
    "overallScore": 65,
    "reasoning": "Mix of routine administrative tasks (high automation) and interpersonal tasks (low automation)",
    "confidence": 0.85
  },
  "overallAPO": 58,
  "timeline": "Medium-term (3-7 years)",
  "riskLevel": "Medium",
  "confidence": 0.82
}
```

## Changelog

### 2.0.0 (2025-10-19)
- Added RAG context injection for tasks, knowledge, skills
- Improved scoring guidelines with specific ranges
- Added timeline and risk level outputs
- Enforced JSON mode for reliability

### 1.0.0 (2025-06-15)
- Initial prompt version
