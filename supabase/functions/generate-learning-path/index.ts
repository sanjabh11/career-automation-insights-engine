import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient, getEnvModel } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface LearningPathRequest {
  profileId?: string;
  targetOccupationCode: string;
  userSkills: Array<{
    name: string;
    currentLevel: number;
    targetLevel: number;
    category: string;
  }>;
  targetRole: string;
  currentRole: string;
  yearsExperience?: number;
  timeCommitment: string; // hours per week
  learningStyle: string;
  budget: string;
  currentSalary?: number;
  targetSalary?: number;
  saveToDB?: boolean;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  skills: string[];
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  skills: string[];
  estimatedDuration: string;
  milestones: Milestone[];
  difficulty: string;
  prerequisites: string[];
}

const resolveEnv = (...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = Deno.env.get(k);
    if (v && v.trim().length > 0) return v.trim();
  }
  return undefined;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = resolveEnv('SUPABASE_URL', 'PROJECT_URL', 'VITE_SUPABASE_URL', 'PUBLIC_SUPABASE_URL') || '';
    const supabaseKey = resolveEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY') || '';
    const canDb = !!supabaseUrl && !!supabaseKey;
    const supabaseClient = canDb ? createClient(supabaseUrl, supabaseKey) : null as any;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader && canDb) {
      const result = await supabaseClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      user = result.data?.user;
    }

    const body: LearningPathRequest = await req.json();
    const { 
      profileId, 
      targetOccupationCode,
      userSkills, 
      targetRole, 
      currentRole, 
      yearsExperience,
      timeCommitment, 
      learningStyle, 
      budget,
      currentSalary,
      targetSalary,
      saveToDB = false
    } = body;
    
    console.log('Received request:', { targetRole, currentRole, skillGaps: userSkills.length });

    const skillGaps = userSkills.filter(skill => skill.targetLevel > skill.currentLevel);
    
    console.log('Skill gaps identified:', skillGaps);
    
    const prompt = `
Create a comprehensive, timeline-based learning path for career transition:

CURRENT SITUATION:
- Role: ${currentRole}
- Years Experience: ${yearsExperience || 'Not specified'}
- Current Salary: ${currentSalary ? `$${currentSalary}` : 'Not provided'}

TARGET:
- Role: ${targetRole}
- Occupation Code: ${targetOccupationCode}
- Target Salary: ${targetSalary ? `$${targetSalary}` : 'Not provided'}

CONSTRAINTS:
- Time Commitment: ${timeCommitment} hours/week
- Learning Style: ${learningStyle}
- Budget: ${budget}

SKILL GAPS:
${skillGaps.map(skill => `- ${skill.name}: Level ${skill.currentLevel} → ${skill.targetLevel} (${skill.category})`).join('\n')}

Create a detailed learning path with:
1. Name and description
2. Ordered milestones with specific skills, duration, resources, and cost
3. Each milestone should have:
   - Name (action-oriented)
   - Skills to acquire
   - Duration in weeks
   - Learning resources (courses, certifications, projects)
   - Estimated cost
   - Priority (Critical/High/Medium)
4. Total estimated duration in months
5. Prerequisites

Return JSON:
{
  "name": string,
  "description": string,
  "estimatedDurationMonths": number,
  "totalCostEstimate": number,
  "milestones": [{
    "name": string,
    "skills": string[],
    "duration_weeks": number,
    "resources": [{
      "name": string,
      "type": "course"|"certification"|"project"|"book",
      "url": string,
      "cost": number
    }],
    "cost_estimate": number,
    "priority": "Critical"|"High"|"Medium"
  }],
  "prerequisites": string[]
}`;

    console.log('Generating learning path with Gemini...');

    const gemini = new GeminiClient();
    const startTime = Date.now();

    const response = await gemini.generateContent(
      prompt,
      { temperature: 0.5 }
    );

    const generatedContent = response.text;
    const duration = Date.now() - startTime;
    console.log('Gemini response received in', duration, 'ms');

    // Parse the JSON response
    let learningPath: LearningPath;
    let parsedAI: any = {};
    let parsedOk = false;
    try {
      parsedAI = JSON.parse(generatedContent);
      parsedOk = true;
      
      // Add missing fields and ensure proper structure
      learningPath = {
        id: `path_${Date.now()}`,
        name: parsedAI.name || `${targetRole} Learning Path`,
        description: parsedAI.description || 'Personalized learning path generated by AI',
        skills: parsedAI.skills || skillGaps.map(s => s.name),
        estimatedDuration: parsedAI.estimatedDuration || `${parsedAI.estimatedDurationMonths ?? 6} months`,
        difficulty: parsedAI.difficulty || 'Intermediate',
        prerequisites: parsedAI.prerequisites || [],
        milestones: (parsedAI.milestones || []).map((milestone: any, index: number) => ({
          id: `milestone_${Date.now()}_${index}`,
          title: milestone.title || milestone.name || `Milestone ${index + 1}`,
          description: milestone.description || 'Complete learning objectives',
          targetDate: milestone.targetDate || getTargetDate(index + 1, timeCommitment),
          completed: false,
          skills: milestone.skills || []
        }))
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', generatedContent);
      
      // Fallback learning path
      learningPath = createFallbackLearningPath(skillGaps, targetRole, timeCommitment);
    }

    console.log('Final learning path:', learningPath);

    // Calculate ROI
    const salaryIncrease = (targetSalary && currentSalary) 
      ? targetSalary - currentSalary 
      : 0;
    
    const lifetimeEarningIncrease = salaryIncrease * 30; // 30 years career
    
    const totalCost = parsedOk ? (parsedAI.totalCostEstimate || 0) : 0;
    const roiMonths = salaryIncrease > 0 
      ? Math.ceil((totalCost / salaryIncrease) * 12)
      : null;

    // Save to database if requested and user is authenticated
    let savedPathId = null;
    if (saveToDB && user && canDb) {
      try {
        const { data: savedPath, error: saveError } = await supabaseClient
          .from("learning_paths")
          .insert({
            user_id: user.id,
            profile_id: profileId,
            path_name: learningPath.name,
            description: learningPath.description,
            target_occupation_code: targetOccupationCode,
            target_occupation_title: targetRole,
            estimated_duration_months: parsedOk ? (parsedAI.estimatedDurationMonths || 6) : 6,
            milestones: parsedOk ? (parsedAI.milestones || []) : [],
            total_cost_estimate: totalCost,
            current_salary_estimate: currentSalary,
            target_salary_estimate: targetSalary,
            roi_months: roiMonths,
            lifetime_earning_increase: lifetimeEarningIncrease,
            generated_by_model: getEnvModel(),
            status: 'draft',
          })
          .select()
          .single();

        if (saveError) {
          console.error("Failed to save learning path:", saveError);
        } else {
          savedPathId = (savedPath as any)?.id ?? null;
          console.log("Learning path saved to database:", savedPathId);
        }
      } catch (error) {
        console.error("Error saving to database:", error);
      }
    }

    return new Response(JSON.stringify({
      learningPath,
      savedPathId,
      financials: {
        totalCost,
        currentSalary,
        targetSalary,
        salaryIncrease,
        roiMonths,
        lifetimeEarningIncrease,
        breakEvenYears: roiMonths ? (roiMonths / 12).toFixed(1) : null,
      },
      generatedAt: new Date().toISOString(),
      metadata: {
        skillGapsAddressed: skillGaps.length,
        estimatedWeeksToComplete: calculateWeeksToComplete(learningPath.estimatedDuration, timeCommitment),
        modelUsed: getEnvModel(),
        generationTimeMs: duration,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating learning path:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error stack:', errorStack);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorStack?.split('\n').slice(0, 3).join('\n'),
      learningPath: null,
      timestamp: new Date().toISOString(),
      function: 'generate-learning-path'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getTargetDate(milestoneNumber: number, timeCommitment: string): string {
  const weeksPerMilestone = getWeeksPerMilestone(timeCommitment);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (milestoneNumber * weeksPerMilestone * 7));
  return targetDate.toISOString().split('T')[0];
}

function getWeeksPerMilestone(timeCommitment: string): number {
  const hours = parseInt(timeCommitment) || 5;
  if (hours >= 20) return 2; // Full-time learning
  if (hours >= 10) return 3; // Part-time intensive
  if (hours >= 5) return 4;  // Regular part-time
  return 6; // Casual learning
}

function calculateWeeksToComplete(duration: string, timeCommitment: string): number {
  const months = parseInt(duration) || 6;
  const hours = parseInt(timeCommitment) || 5;
  
  // Rough calculation based on time commitment
  const baseWeeks = months * 4;
  if (hours >= 20) return Math.floor(baseWeeks * 0.5);
  if (hours >= 10) return Math.floor(baseWeeks * 0.75);
  return baseWeeks;
}

function createFallbackLearningPath(skillGaps: any[], targetRole: string, timeCommitment: string): LearningPath {
  const milestones: Milestone[] = skillGaps.map((skill, index) => ({
    id: `milestone_${Date.now()}_${index}`,
    title: `Master ${skill.name}`,
    description: `Develop ${skill.name} skills from level ${skill.currentLevel} to ${skill.targetLevel}`,
    targetDate: getTargetDate(index + 1, timeCommitment),
    completed: false,
    skills: [skill.name]
  }));

  return {
    id: `path_${Date.now()}`,
    name: `${targetRole} Career Development Path`,
    description: `A structured learning path to transition from your current role to ${targetRole}, focusing on closing key skill gaps.`,
    skills: skillGaps.map(s => s.name),
    estimatedDuration: `${Math.max(3, skillGaps.length * 2)} months`,
    difficulty: 'Intermediate',
    prerequisites: ['Basic understanding of relevant domain'],
    milestones
  };
}
