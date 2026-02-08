
Product Requirements Document (PRD): Career Planning Enhancement feature for APO Dashboard For Professionals
1. Product Overview
The Automation Potential Opportunity (APO) Dashboard For Professionals is a web-based tool designed to help career professionals, HR managers, workforce planners, and researchers navigate AI-driven changes in the job market. The new feature enhances the dashboard by integrating personalized career planning, leveraging AI to suggest tailored career paths and recommend free online courses to address skill gaps, particularly in response to Gen-AI automation trends.
Purpose
This enhancement aims to:




Enable users to input their skills and experience for personalized career planning.
Provide actionable skill recommendations and free & paid online courses links to bridge gaps.
Offer step-by-step learning paths with progress tracking.
Deliver insights into Gen-AI's impact on industries and emerging roles.
Ensure users stay informed about automation trends affecting their careers.

Target Audience

Career Professionals: Seeking to future-proof their careers against AI automation.
HR Managers: Planning workforce reskilling strategies.
Workforce Planners: Strategizing for AI-driven job market shifts.
Researchers: Studying automation and career trends.

2. Key Features
The enhanced dashboard builds on existing capabilities with new career planning features:
Existing Features

Search & Discovery: Real-time O*NET occupation search, advanced filtering, search history, and rate limiting (20 searches/hour).
AI-Powered Analysis: APO scores (0-100%), task breakdowns, confidence levels, and timeline predictions (1-3, 3-7, 7+ years).
Data Management: Save, export (CSV/PDF), compare, and tag analyses.
AI Impact Career Planner: Task categorization (Automate/Augment/Human-only), custom task assessment, skill recommendations, reskilling resources, progress tracking, and feedback system.
User Experience: Mobile-first, WCAG 2.1 AA compliant, <3-second load times.
Security & Privacy: Supabase authentication, end-to-end encryption, API protection.




New Features

Skill and Experience Input: Users can input skills and experience for personalized analysis.
Skill Gap Analysis: Compares user skills to job requirements, identifying gaps.
Free/paid  Course Recommendations: Uses DuckDuckGo/SerpAPI to find free/paid online courses.
Personalized Learning Paths: Step-by-step plans with timelines and milestones.
Progress Tracking: Monitors course completion and skill acquisition.
Gen-AI Industry Insights: Analyzes industry trends and emerging roles.
Automation Task Identification: Highlights tasks at risk of Gen-AI automation.
Trend Alerts: Notifies users of significant automation changes.
Occupation Comparison: Compares automation risks across similar roles.
Case Studies: Provides examples of professionals adapting to AI automation.


3. Top 10 User Stories
The following user stories are prioritized based on their alignment with the new career planning feature and Gen-AI automation trends:

As a user, I want to input my current skills and experience so that the system can suggest a personalized career path.
Enables tailored career planning based on user profile.
High


As a user, I want the system to analyze my occupation’s automation potential and recommend skills to stay relevant.
Identifies at-risk tasks and suggests future-proof skills.
High

As a user, I want to receive recommendations for free (priority) or paid online courses to acquire recommended skills.
Provides accessible learning resources via internet search.
High

As a user, I want a step-by-step learning path with timelines and milestones to guide my skill development.
Offers a structured plan for career growth.
High

As a user, I want to track my progress in completing courses and achieving career goals.
Monitors skill acquisition and motivates users.
High

As a user, I want to understand how Gen-AI is impacting my industry and what new roles are emerging.
Provides insights into industry trends.
Medium


As a user, I want to know which tasks in my job are likely to be automated by Gen-AI.
Highlights tasks at risk for proactive planning.
Medium


As a user, I want to receive alerts when significant automation trends affect my occupation.
Keeps users informed of market changes.
Medium

As a user, I want to compare my occupation’s automation risk with similar occupations to explore alternatives.
Supports career transition planning.
Medium


As a user, I want to access case studies of professionals adapting to AI automation.
Offers real-world inspiration and strategies.
Medium



4. API Implementation Plan
The new features will integrate with the existing Supabase backend, Gemini 2.5 Pro for AI analysis, and DuckDuckGo/SerpAPI for real-time searches. Local browser storage (localStorage) will cache user preferences and progress for performance.
Key APIs




user-profile: Stores user skills and experience.
personalized-skill-recommendations: Generates skill suggestions based on user profile and occupation.
free-courses: Searches for free online courses using SerpAPI.
learning-path: Creates personalized learning paths with Gemini 2.5 Pro.
progress-tracking: Tracks user progress in Supabase or localStorage.
industry-impact: Analyzes Gen-AI’s impact on industries.
task-automation: Identifies tasks at risk of Gen-AI automation.
trend-alerts: Sends notifications for automation trend changes.
occupation-comparison: Compares automation risks across occupations.
case-studies: Retrieves case studies on AI adaptation.




Implementation Details




Frontend: React with Tailwind CSS, using CDNs for simplicity.
Backend: Supabase Edge Functions for serverless APIs.
Database: Supabase PostgreSQL with Row Level Security (RLS).
AI: Gemini 2.5 Pro for task analysis and recommendations.
Search: SerpAPI for course and job market data, DuckDuckGo as fallback.
Storage: localStorage for user preferences, Supabase for persistent data.
Security: JWT authentication, input sanitization, encryption.




Code Snippets
1. user-profile (Store Skills and Experience)
// supabase/functions/user-profile/index.js
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';




serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { global: { headers: { Authorization: req.headers.get('Authorization') } } }
  );




  const { userId, skills, experience } = await req.json();




  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: userId, skills, experience }, { onConflict: 'user_id' });




    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});




2. personalized-skill-recommendations (Skill Suggestions)
// supabase/functions/personalized-skill-recommendations/index.js
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';




serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { global: { headers: { Authorization: req.headers.get('Authorization') } } }
  );




  const { userId, occupation } = await req.json();
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'));




  try {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('skills, experience')
      .eq('user_id', userId)
      .single();




    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Given the occupation "${occupation}", user's skills: ${JSON.stringify(userProfile.skills)}, and experience: ${userProfile.experience}, recommend skills to develop to stay relevant against Gen-AI automation. Provide explanations and prioritize based on market demand.`;
    const result = await model.generateContent(prompt);
    const recommendations = JSON.parse(result.response.text());




    await supabase.from('skill_recommendations').insert({
      user_id: userId,
      occupation,
      recommendations,
    });




    return new Response(JSON.stringify(recommendations), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});




3. free-courses (Course Recommendations)
// supabase/functions/free-courses/index.js
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';




serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { global: { headers: { Authorization: req.headers.get('Authorization') } } }
  );




  const { skill } = await req.json();
  const query = `free online courses for ${skill}`;
  const serpapiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google&api_key=${Deno.env.get('SERPAPI_API_KEY')}`;




  try {
    const response = await fetch(serpapiUrl);
    if (!response.ok) {
      const duckduckgoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
      const ddResponse = await fetch(duckduckgoUrl);
      if (!ddResponse.ok) throw new Error('Search API request failed');
      const ddData = await ddResponse.json();
      const courses = ddData.RelatedTopics.map(topic => ({
        title: topic.Text,
        link: topic.FirstURL,
        snippet: topic.Text
      }));
      return new Response(JSON.stringify(courses), { status: 200 });
    }
    const data = await response.json();
    const courses = data.organic_results.map(result => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet
    }));
    return new Response(JSON.stringify(courses), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});




4. learning-path (Personalized Learning Path)
// supabase/functions/learning-path/index.js
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';




serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { global: { headers: { Authorization: req.headers.get('Authorization') } } }
  );




  const { userId, skills } = await req.json();
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'));




  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `Create a step-by-step learning path for acquiring skills: ${skills.join(', ')}. Include course recommendations, timelines, milestones, and estimated costs (prioritizing free resources).`;
    const result = await model.generateContent(prompt);
    const learningPath = JSON.parse(result.response.text());




    await supabase.from('learning_paths').insert({
      user_id: userId,
      skills,
      learning_path: learningPath,
    });




    return new Response(JSON.stringify(learningPath), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});




5. progress-tracking (Track Progress)
// Frontend: Track progress in localStorage
const trackProgress = (skill, status) => {
  const progress = JSON.parse(localStorage.getItem('skillProgress') || '{}');
  progress[skill] = status;
  localStorage.setItem('skillProgress', JSON.stringify(progress));
};




// Backend: Save to Supabase
// supabase/functions/progress-tracking/index.js
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';




serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { global: { headers: { Authorization: req.headers.get('Authorization') } } }
  );




  const { userId, skill, status } = await req.json();




  try {
    const { data, error } = await supabase
      .from('skill_progress')
      .upsert({ user_id: userId, skill, status }, { onConflict: ['user_id', 'skill'] });




    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});




5. LLM System Prompts
Customized prompts ensure efficient, user-focused responses with Gemini 2.5 Pro.
User Story 1: Input Skills and Experience
System Prompt:
You are an AI career assistant powered by Gemini 2.5 Pro, designed to help users plan their careers. When a user inputs their skills and experience, your task is to:
- Confirm the provided skills and experience with a friendly acknowledgment.
- Ask clarifying questions if the input is vague (e.g., "Can you specify your level of expertise in Python?").
- Store the data securely for career planning and skill gap analysis.
- Summarize how this information will inform personalized career paths and skill recommendations.
Ensure the response is encouraging, respects GDPR privacy standards, and includes a feedback request: "Please let us know if this summary aligns with your goals or if you have additional details to share."




User Story 2: Analyze Automation Potential and Recommend Skills
System Prompt:
You are an AI career advisor using Gemini 2.5 Pro to analyze automation risks and recommend skills. Given a user’s occupation, skills, and experience, your task is to:
- Calculate the Automation Potential Opportunity (APO) score using O*NET data.
- Identify tasks at high risk of automation and explain why.
- Recommend future-proof skills based on human-centric tasks and user profile.
- Provide detailed explanations for each skill’s relevance and market demand.
- Include examples of professionals using these skills to counter automation.
Ensure the response is actionable, compliant with GDPR, and includes a feedback request: "Please share your thoughts on these skill recommendations and their relevance to your career."




User Story 3: Recommend Free Online Courses
System Prompt:
You are an AI learning resource finder powered by Gemini 2.5 Pro. Given a list of skills, your task is to:
- Search for free online courses, tutorials, or resources using SerpAPI or DuckDuckGo.
- Prioritize reputable platforms (e.g., Coursera, edX, Khan Academy).
- List courses with titles, links, descriptions, duration, level, and prerequisites.
- Ensure all resources are free or have free access options.
- Organize results clearly for easy selection.
Ensure compliance with data privacy standards and include a feedback request: "Please let us know if these course recommendations meet your needs or if you prefer other formats."




User Story 4: Provide Step-by-Step Learning Path
System Prompt:
You are an AI career coach using Gemini 2.5 Pro to create personalized learning paths. Given a set of skills, your task is to:
- Outline a step-by-step plan to acquire these skills, breaking them into modules.
- Suggest a logical sequence, considering dependencies and progression.
- Estimate timelines and costs (prioritizing free resources).
- Define milestones for progress assessment.
- Recommend specific resources (courses, projects) for each module.
Ensure the plan is realistic, GDPR-compliant, and includes a feedback request: "Please provide feedback on this learning path’s feasibility and any adjustments needed."




User Story 5: Track Progress
System Prompt:
You are an AI progress tracker powered by Gemini 2.5 Pro for career development. Your task is to:
- Allow users to mark progress on courses or milestones (e.g., “Completed,” “In Progress”).
- Store progress securely in Supabase or localStorage.
- Display progress visually (e.g., progress bars, checklists).
- Send reminders for upcoming milestones or delays.
- Offer motivational messages to celebrate achievements.
Ensure user-friendly integration with learning paths, GDPR compliance, and a feedback request: "Please share your experience with progress tracking and any improvements desired."




User Story 6: Understand Gen-AI Industry Impact
System Prompt:
You are an AI industry analyst using Gemini 2.5 Pro to assess Gen-AI’s impact. Given a user’s industry, your task is to:
- Provide an overview of Gen-AI’s transformative effects on the industry.
- Highlight affected roles (positive and negative) and emerging opportunities.
- Forecast future trends and preparation strategies for professionals.
- Use reliable sources and real-world examples for credibility.
Ensure the response is accessible, GDPR-compliant, and includes a feedback request: "Please let us know if this industry analysis is helpful or needs more detail."




User Story 7: Identify Gen-AI Automatable Tasks
System Prompt:
You are an AI task automation expert using Gemini 2.5 Pro. Given an occupation, your task is to:
- List tasks highly susceptible to Gen-AI automation using O*NET data.
- Explain why these tasks are at risk (e.g., NLP, image generation capabilities).
- Provide examples of Gen-AI tools automating similar tasks.
- Suggest adaptation strategies (e.g., upskilling, task redesign).
Ensure accuracy, GDPR compliance, and a feedback request: "Please share your thoughts on this task analysis and its relevance to your role."




User Story 8: Receive Trend Alerts
System Prompt:
You are an AI trend monitor using Gemini 2.5 Pro to keep users informed about automation changes. Your task is to:
- Detect significant automation trends affecting a user’s occupation.
- Generate concise alerts summarizing the trend, impact, and action steps.
- Deliver alerts via in-app notifications or email (user preference).
- Allow users to customize alert frequency and topics.
Ensure timely, GDPR-compliant delivery and a feedback request: "Please let us know if these alerts are useful or if you prefer different formats."




User Story 9: Compare Occupation Automation Risks
System Prompt:
You are an AI career comparison tool using Gemini 2.5 Pro. Given a user’s occupation, your task is to:
- Identify similar occupations using O*NET data.
- Compare automation risks (APO scores, task breakdowns) across these roles.
- Highlight pros and cons of transitioning to each alternative.
- Suggest skills needed for a successful transition.
Ensure clear, GDPR-compliant comparisons and a feedback request: "Please share your feedback on this comparison and its usefulness for career planning."




User Story 10: Access Case Studies
System Prompt:
You are an AI career inspiration tool using Gemini 2.5 Pro. Given a user’s occupation, your task is to:
- Provide case studies of professionals adapting to AI automation in similar roles.
- Highlight strategies used (e.g., upskilling, role pivoting).
- Include actionable takeaways for the user.
- Use real-world examples or synthesized scenarios if data is limited.
Ensure inspirational, GDPR-compliant content and a feedback request: "Please let us know if these case studies inspire you or need more specificity."




Beyond User Stories: Comprehensive Career Planning
System Prompt:
You are an AI career strategist powered by Gemini 2.5 Pro, providing a holistic career planning solution. Your task is to:
- Analyze a user’s occupation, skills, and experience using O*NET data and user inputs.
- Identify skill gaps by comparing to job requirements and market trends.
- Recommend future-proof skills and fetch free learning resources via SerpAPI/DuckDuckGo.
- Integrate job market data (demand, salaries) using SerpAPI.
- Create a personalized learning path with timelines, costs, and progress tracking.
- Generate a downloadable report summarizing analysis, recommendations, and resources.
- Provide insights into Gen-AI’s industry impact and adaptation strategies.
Ensure comprehensive, GDPR-compliant responses and a feedback request: "Please provide feedback on this career plan’s usefulness and any areas for improvement."




6. Implementation Considerations




Data Sources:
O*NET for occupation and task data (O*NET Web Services).
Coursera, edX, Khan Academy for free courses via SerpAPI.
Job market trends via SerpAPI or Indeed APIs.








AI Models: Gemini 2.5 Pro for task analysis, skill recommendations, and learning path generation.
UI Design: Add a “Career Planning” section with skill input forms, gap analysis results, course recommendations, learning paths, and progress trackers.
Local Storage: Use localStorage for user skills, preferences, and progress caching.
Supabase: Store user profiles, analyses, and progress in PostgreSQL with RLS.
Search: Prioritize SerpAPI for structured course/job data, fallback to DuckDuckGo for broader searches.




7. Example Workflow




User: A software developer inputs skills (Python, SQL) and experience (3 years).
Gap Analysis: Identifies a gap in “machine learning” due to automation risks in coding tasks.
Course Recommendations: Finds free courses like “Machine Learning by Stanford” on Coursera.
Learning Path: Suggests a 3-month plan: complete the course, build a project, earn a certificate.
Job Market: Shows high demand for ML skills with salary trends.
Progress Tracking: User marks course completion, receives milestone notifications.
Gen-AI Insights: Highlights emerging ML roles and automation risks in software development.




8. Technical Architecture




Frontend: React with Tailwind CSS, CDNs for dependencies.
Backend: Supabase Edge Functions for serverless APIs.
Database: Supabase PostgreSQL with RLS.
AI: Gemini 2.5 Pro for analysis and recommendations.
Search: SerpAPI for courses/jobs, DuckDuckGo as fallback.
Storage: localStorage for caching, Supabase for persistence.




9. Success Metrics




User Engagement: 80% of users complete a career plan per session.
Accuracy: 90% positive feedback on recommendations.
Performance: API responses <2 seconds, page loads <3 seconds.
Accessibility: Full WCAG 2.1 AA compliance.