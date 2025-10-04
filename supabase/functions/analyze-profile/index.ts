import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeProfileRequest {
  profileId?: string;
  analysisType: 'automation_risk' | 'gap_analysis' | 'career_match' | 'skill_assessment';
  targetOccupationCode?: string;
  profileData?: {
    currentOccupation?: string;
    yearsExperience?: number;
    educationLevel?: string;
    technicalSkills?: string[];
    softSkills?: string[];
    certifications?: string[];
  };
}

interface ProfileAnalysisResult {
  analysisId: string;
  analysisType: string;
  automationRiskScore?: number;
  automationRiskCategory?: string;
  skillGaps?: Array<{
    skill: string;
    importance: string;
    currentLevel: string;
    targetLevel: string;
    estimatedTimeToAcquire: string;
  }>;
  recommendations?: Array<{
    title: string;
    description: string;
    priority: string;
    estimatedCost?: number;
    estimatedDuration?: string;
  }>;
  matchScore?: number;
  matchFactors?: Record<string, any>;
  estimatedTransitionMonths?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const body: AnalyzeProfileRequest = await req.json();
    const { profileId, analysisType, targetOccupationCode, profileData } = body;

    if (!analysisType) {
      throw new Error("analysisType is required");
    }

    // Fetch profile data if profileId provided
    let profile = profileData;
    let dbProfileId = profileId;

    if (profileId) {
      const { data: dbProfile, error: profileError } = await supabaseClient
        .from("user_profiles")
        .select("*")
        .eq("id", profileId)
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      profile = {
        currentOccupation: dbProfile.current_occupation_title,
        yearsExperience: dbProfile.years_experience,
        educationLevel: dbProfile.education_level,
        technicalSkills: dbProfile.technical_skills || [],
        softSkills: dbProfile.soft_skills || [],
        certifications: dbProfile.certifications || [],
      };
      dbProfileId = dbProfile.id;
    }

    if (!profile) {
      throw new Error("Profile data is required");
    }

    // Fetch target occupation data if provided
    let targetOccupation = null;
    if (targetOccupationCode) {
      const { data: enrichmentData } = await supabaseClient.functions.invoke(
        "onet-enrichment",
        {
          body: { occupationCode: targetOccupationCode },
        }
      );
      targetOccupation = enrichmentData;
    }

    // Initialize Gemini client
    const gemini = new GeminiClient();
    const startTime = Date.now();

    // Build prompt based on analysis type
    let prompt = "";
    let systemInstruction = `You are an expert career analyst specializing in automation risk assessment, skill gap analysis, and career transition planning. Analyze the provided profile data and provide detailed, actionable insights in JSON format.`;

    switch (analysisType) {
      case "automation_risk":
        prompt = `Analyze the automation risk for this professional profile:

Current Occupation: ${profile.currentOccupation || "Not specified"}
Years of Experience: ${profile.yearsExperience || 0}
Education: ${profile.educationLevel || "Not specified"}
Technical Skills: ${profile.technicalSkills?.join(", ") || "None listed"}
Soft Skills: ${profile.softSkills?.join(", ") || "None listed"}

Provide a comprehensive automation risk assessment including:
1. Automation risk score (0-100, where 100 is highest risk)
2. Risk category (Low, Medium, High, Very High)
3. Specific tasks most at risk
4. Tasks least at risk
5. Recommended upskilling areas
6. Timeline for potential automation impact

Return as JSON: { "automationRiskScore": number, "automationRiskCategory": string, "riskyTasks": string[], "safeTasks": string[], "recommendations": [{"title": string, "description": string, "priority": string, "estimatedDuration": string}], "timelineYears": number }`;
        break;

      case "gap_analysis":
        if (!targetOccupation) {
          throw new Error(
            "Target occupation is required for gap analysis"
          );
        }

        prompt = `Perform a skill gap analysis for career transition:

CURRENT PROFILE:
- Occupation: ${profile.currentOccupation || "Not specified"}
- Years of Experience: ${profile.yearsExperience || 0}
- Education: ${profile.educationLevel || "Not specified"}
- Technical Skills: ${profile.technicalSkills?.join(", ") || "None"}
- Soft Skills: ${profile.softSkills?.join(", ") || "None"}
- Certifications: ${profile.certifications?.join(", ") || "None"}

TARGET OCCUPATION:
- Title: ${targetOccupation.occupation_title}
- Code: ${targetOccupation.occupation_code}
- Education Required: ${targetOccupation.education_level || "Not specified"}
- Job Zone: ${targetOccupation.job_zone || "Not specified"}

Provide a detailed gap analysis including:
1. Skill gaps (technical and soft skills)
2. Experience gaps
3. Education/certification gaps
4. Prioritized recommendations
5. Estimated transition timeline
6. Cost estimates for training/education

Return as JSON: { "skillGaps": [{"skill": string, "importance": string, "currentLevel": string, "targetLevel": string, "estimatedTimeToAcquire": string}], "experienceGaps": {"description": string, "monthsNeeded": number}, "educationGaps": {"description": string, "programs": string[]}, "recommendations": [{"title": string, "description": string, "priority": string, "estimatedCost": number, "estimatedDuration": string}], "estimatedTransitionMonths": number }`;
        break;

      case "career_match":
        if (!targetOccupation) {
          throw new Error("Target occupation is required for career match");
        }

        prompt = `Assess career match compatibility:

PROFILE:
- Current: ${profile.currentOccupation || "Not specified"}
- Experience: ${profile.yearsExperience || 0} years
- Education: ${profile.educationLevel || "Not specified"}
- Skills: ${[...(profile.technicalSkills || []), ...(profile.softSkills || [])].join(", ")}

TARGET:
- ${targetOccupation.occupation_title} (${targetOccupation.occupation_code})

Calculate a match score (0-100) and provide:
1. Overall match score
2. Match factors (skills, experience, education, interests)
3. Strengths (transferable skills/experience)
4. Challenges (gaps to overcome)
5. Success probability and timeline

Return as JSON: { "matchScore": number, "matchFactors": {"skills": number, "experience": number, "education": number, "overall": number}, "strengths": string[], "challenges": string[], "successProbability": string, "recommendedTimeline": string }`;
        break;

      case "skill_assessment":
        prompt = `Conduct a comprehensive skill assessment:

PROFILE:
- Occupation: ${profile.currentOccupation || "Not specified"}
- Experience: ${profile.yearsExperience || 0} years
- Technical Skills: ${profile.technicalSkills?.join(", ") || "None"}
- Soft Skills: ${profile.softSkills?.join(", ") || "None"}
- Certifications: ${profile.certifications?.join(", ") || "None"}

Provide:
1. Skill strength analysis
2. In-demand skills match
3. Skill gaps vs market trends
4. Upskilling priorities
5. Certification recommendations

Return as JSON: { "skillStrengths": [{"skill": string, "level": string, "marketDemand": string}], "inDemandMatch": number, "skillGaps": string[], "priorities": [{"skill": string, "importance": string, "timeToAcquire": string}], "certifications": string[] }`;
        break;
    }

    // Call Gemini API
    const response = await gemini.generateContent({
      prompt,
      systemInstruction,
      temperature: 0.3, // Lower temperature for more consistent analysis
      responseFormat: { type: "json_object" },
    });

    const analysisResult = JSON.parse(response.text);
    const duration = Date.now() - startTime;

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabaseClient
      .from("profile_analyses")
      .insert({
        user_id: user.id,
        profile_id: dbProfileId,
        analysis_type: analysisType,
        target_occupation_code: targetOccupationCode,
        target_occupation_title: targetOccupation?.occupation_title,
        automation_risk_score: analysisResult.automationRiskScore,
        automation_risk_category: analysisResult.automationRiskCategory,
        skill_gaps: analysisResult.skillGaps || [],
        experience_gaps: analysisResult.experienceGaps || {},
        education_gaps: analysisResult.educationGaps || {},
        recommendations: analysisResult.recommendations || [],
        match_score: analysisResult.matchScore,
        match_factors: analysisResult.matchFactors || {},
        estimated_transition_months: analysisResult.estimatedTransitionMonths,
        model_used: gemini.getModelName(),
        tokens_used: response.usage?.totalTokens || 0,
        analysis_duration_ms: duration,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save analysis:", saveError);
    }

    const result: ProfileAnalysisResult = {
      analysisId: savedAnalysis?.id || "unsaved",
      analysisType,
      ...analysisResult,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Profile analysis error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to analyze profile",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
