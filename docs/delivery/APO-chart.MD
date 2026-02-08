
# APO (Automation Potential Overview) Calculation Chart

## Overview
The APO calculation is a comprehensive AI-powered analysis that evaluates the automation potential of occupations across multiple dimensions. This document outlines the detailed calculation process, methodology, and visualization approach.

## Calculation Process Flow

### Step 1: Initial Data Collection
```
User Input → Occupation Search → O*NET Database Lookup → Selected Occupation
```

**Data Points Collected:**
- Occupation Code (O*NET Standard)
- Occupation Title
- Industry Classification
- Required Skills Matrix
- Task Descriptions
- Knowledge Requirements
- Ability Specifications
- Technology Dependencies

### Step 2: AI Analysis Engine (Gemini API)

#### Input Processing
```
Selected Occupation → Structured Prompt → Gemini 2.0 Flash Model → JSON Response
```

**Prompt Structure:**
1. **Context Setting**: Automation and AI technology expertise
2. **Occupation Analysis**: Detailed breakdown request
3. **Scoring Guidelines**: 0-100% scale with specific criteria
4. **Category Analysis**: 5 core dimensions
5. **Output Format**: Structured JSON response

#### Analysis Categories (5 Core Dimensions)

##### 1. Tasks Analysis
- **Weight**: 20% of overall APO
- **Evaluation Criteria**:
  - Routine vs. Creative tasks
  - Physical vs. Cognitive requirements
  - Decision complexity
  - Human interaction dependency
- **Scoring Range**: 0-100% per task
- **Output**: Average task APO + individual task scores

##### 2. Knowledge Analysis
- **Weight**: 20% of overall APO
- **Evaluation Criteria**:
  - Domain-specific knowledge requirements
  - Learning curve complexity
  - Knowledge application variability
  - Information processing patterns
- **Scoring Range**: 0-100% per knowledge area
- **Output**: Average knowledge APO + individual knowledge scores

##### 3. Skills Analysis
- **Weight**: 20% of overall APO
- **Evaluation Criteria**:
  - Cognitive skill complexity
  - Interpersonal skill requirements
  - Problem-solving demands
  - Adaptability needs
- **Scoring Range**: 0-100% per skill
- **Output**: Average skills APO + individual skill scores

##### 4. Abilities Analysis
- **Weight**: 20% of overall APO
- **Evaluation Criteria**:
  - Physical ability requirements
  - Mental processing capabilities
  - Sensory perception needs
  - Motor coordination demands
- **Scoring Range**: 0-100% per ability
- **Output**: Average abilities APO + individual ability scores

##### 5. Technologies Analysis
- **Weight**: 20% of overall APO
- **Evaluation Criteria**:
  - Current technology adoption
  - Automation tool availability
  - Digital transformation readiness
  - Technology dependency levels
- **Scoring Range**: 0-100% per technology
- **Output**: Average technology APO + individual technology scores

### Step 3: Score Calculation Algorithm

#### Individual Category Scores
```
Category APO = Σ(Individual Item APO) / Number of Items
```

#### Overall APO Calculation
```
Overall APO = (Tasks APO + Knowledge APO + Skills APO + Abilities APO + Technologies APO) / 5
```

#### Risk Classification
- **0-30%**: Low Automation Risk (Green)
  - Requires human creativity, empathy, complex problem-solving
- **31-60%**: Medium Automation Risk (Yellow/Orange)
  - Some automation possible, human oversight needed
- **61-100%**: High Automation Risk (Red)
  - Routine, predictable, data-driven tasks

### Step 4: Data Transformation and Visualization

#### Backend Processing
```
Gemini JSON Response → Data Validation → Structure Transformation → Frontend Response
```

#### Frontend Rendering
```
APO Data → Visualization Components → Interactive Charts → User Interface
```

## Calculation Example

### Sample: "Computer Programmers" (15-1251.00)

#### Input Data Flow
1. **Search Query**: "code" → O*NET Search → Multiple Results
2. **Selection**: "Computer Programmers (15-1251.00)"
3. **AI Analysis**: Gemini API processes occupation details

#### Sample Calculation Results
```json
{
  "tasks": {
    "categoryAPO": 65.2,
    "items": [
      {"description": "Write computer programs", "apo": 70.0},
      {"description": "Debug software applications", "apo": 60.4}
    ]
  },
  "knowledge": {
    "categoryAPO": 58.7,
    "items": [
      {"description": "Programming languages", "apo": 65.0},
      {"description": "Software engineering", "apo": 52.4}
    ]
  },
  "skills": {
    "categoryAPO": 42.1,
    "items": [
      {"description": "Critical thinking", "apo": 35.0},
      {"description": "Complex problem solving", "apo": 49.2}
    ]
  },
  "abilities": {
    "categoryAPO": 48.3,
    "items": [
      {"description": "Deductive reasoning", "apo": 45.0},
      {"description": "Information ordering", "apo": 51.6}
    ]
  },
  "technologies": {
    "categoryAPO": 75.8,
    "items": [
      {"description": "Development environments", "apo": 80.0},
      {"description": "Version control systems", "apo": 71.6}
    ]
  }
}
```

#### Overall APO Calculation
```
Overall APO = (65.2 + 58.7 + 42.1 + 48.3 + 75.8) / 5 = 58.0%
```

**Risk Level**: Medium Automation Risk

## Visualization Components

### 1. APOVisualization Chart
- **Type**: Responsive Bar Chart (Recharts)
- **Data**: Category-level APO scores
- **Color Coding**: 
  - Green (0-30%): Low risk
  - Orange (31-60%): Medium risk
  - Red (61-100%): High risk

### 2. Category Breakdown
- **Type**: Accordion-style expandable sections
- **Features**: Individual item scores with progress bars
- **Interaction**: Click to expand detailed analysis

### 3. Overall APO Display
- **Type**: Large score card with risk indicator
- **Visual Elements**: 
  - Percentage display
  - Trend icon (up/down arrow)
  - Color-coded background
  - Risk level text

## Technical Implementation

### Backend (Supabase Edge Function)
```typescript
// Gemini API Integration
const response = await fetch(geminiEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: structuredPrompt }] }],
    generationConfig: {
      temperature: 0.3,  // Low temperature for consistent results
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048
    }
  })
});
```

### Frontend (React Components)
```typescript
// APO Calculation Display
const calculateOverallAPO = (occupation: SelectedOccupation) => {
  const categoryAPOs = [
    calculateCategoryAPO(occupation.tasks),
    calculateCategoryAPO(occupation.knowledge),
    calculateCategoryAPO(occupation.skills),
    calculateCategoryAPO(occupation.abilities),
    calculateCategoryAPO(occupation.technologies)
  ];
  
  return categoryAPOs.reduce((sum, apo) => sum + apo, 0) / 5;
};
```

## Error Handling and Logging

### Edge Function Monitoring
- Request/response logging
- Error tracking with timestamps
- API call success/failure rates
- Response time monitoring

### Frontend Error Handling
- API call failure fallbacks
- Loading state management
- User-friendly error messages
- Retry mechanisms

## Data Flow Security

### API Key Management
- Gemini API key stored as Supabase secret
- No client-side exposure
- Secure edge function execution

### CORS Configuration
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Performance Considerations

### API Optimization
- Single API call per occupation analysis
- Efficient JSON parsing and validation
- Minimal payload sizes

### Frontend Optimization
- Component memoization for expensive calculations
- Efficient re-rendering with React hooks
- Progressive loading of chart components

## Future Enhancements

### Planned Improvements
1. **Caching**: Store calculated APO results for faster retrieval
2. **Batch Processing**: Analyze multiple occupations simultaneously
3. **Historical Tracking**: Track APO changes over time
4. **Custom Weights**: Allow users to adjust category importance
5. **Export Features**: PDF/CSV export of analysis results

This comprehensive calculation process ensures accurate, consistent, and meaningful automation potential assessments for all occupations in the O*NET database.
