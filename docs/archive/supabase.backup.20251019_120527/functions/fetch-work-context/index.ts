import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONET_USERNAME = Deno.env.get("ONET_USERNAME");
const ONET_PASSWORD = Deno.env.get("ONET_PASSWORD");
const ONET_BASE_URL = "https://services.onetcenter.org/ws";

const requestSchema = z.object({
  occupationCode: z.string().min(1),
});

function getAuthHeader(): string {
  if (!ONET_USERNAME || !ONET_PASSWORD) {
    throw new Error("O*NET credentials not configured");
  }
  return `Basic ${btoa(`${ONET_USERNAME}:${ONET_PASSWORD}`)}`;
}

async function fetchOnetData(path: string): Promise<any> {
  try {
    const response = await fetch(`${ONET_BASE_URL}/${path}`, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`O*NET API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error);
    return null;
  }
}

/**
 * Fetch Work Context Data
 * Includes physical conditions, social context, work setting
 */
async function getWorkContext(code: string): Promise<any> {
  const data = await fetchOnetData(`online/occupations/${code}/summary/work_context`);
  
  if (!data || !data.work_context) return {};

  const context = data.work_context;
  const contextMap: any = {};

  // Parse work context elements
  if (Array.isArray(context)) {
    context.forEach((item: any) => {
      const name = item.element_name || item.name;
      const value = item.scale_value || item.category || item.value;
      
      // Map to our schema
      if (name?.includes('Physical Proximity')) contextMap.physical_proximity = value;
      if (name?.includes('Contact With Others')) contextMap.contact_with_others = value;
      if (name?.includes('Work With Work Group')) contextMap.work_with_group = value === 'Yes';
      if (name?.includes('Deal With External Customers')) contextMap.deal_with_public = value === 'Yes';
      if (name?.includes('Work Schedule')) contextMap.work_schedule = value;
      if (name?.includes('Indoors')) contextMap.work_indoors = value;
      if (name?.includes('Exposed to Hazards')) contextMap.exposed_to_hazards = value;
      if (name?.includes('Sounds, Noise')) contextMap.sounds_noise_levels = value;
      if (name?.includes('Wear Common')) contextMap.protective_equipment = value;
    });
  }

  return contextMap;
}

/**
 * Fetch Detailed Tasks (up to 100 per occupation)
 */
async function getDetailedTasks(code: string): Promise<any[]> {
  const data = await fetchOnetData(`online/occupations/${code}/summary/tasks`);
  
  if (!data || !data.task) return [];

  const tasks = Array.isArray(data.task) ? data.task : [data.task];
  
  return tasks.map((task: any, index: number) => ({
    task_id: task.id || `T${index + 1}`,
    task_description: task.statement || task.description || task.task,
    task_type: task.type || 'Core',
    importance: task.im_value ? parseFloat(task.im_value) : null,
    frequency: task.frequency || null,
  }));
}

/**
 * Fetch Work Activities
 */
async function getWorkActivities(code: string): Promise<any[]> {
  const data = await fetchOnetData(`online/occupations/${code}/summary/work_activities`);
  
  if (!data || !data.work_activity) return [];

  const activities = Array.isArray(data.work_activity) ? data.work_activity : [data.work_activity];
  
  return activities.map((activity: any) => ({
    activity_id: activity.id,
    activity_name: activity.name || activity.title,
    activity_description: activity.description,
    level: activity.level_value ? parseFloat(activity.level_value) : null,
    importance: activity.im_value ? parseFloat(activity.im_value) : null,
    category: activity.element_name || 'General',
  }));
}

/**
 * Fetch Technologies (Software, Tools, Equipment)
 */
async function getTechnologies(code: string): Promise<any[]> {
  const data = await fetchOnetData(`online/occupations/${code}/summary/technology`);
  
  if (!data || !data.technology) return [];

  const technologies = Array.isArray(data.technology) ? data.technology : [data.technology];
  
  return technologies.map((tech: any) => ({
    technology_id: tech.id || tech.code,
    technology_name: tech.title || tech.name,
    technology_type: tech.category || 'Software',
    category: tech.hot_technology ? 'Hot Technology' : (tech.category || 'General'),
    is_hot_technology: tech.hot_technology === 'Y' || tech.hot_technology === true,
    example_products: tech.example ? [tech.example] : [],
  }));
}

/**
 * Main handler
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = await req.json();
    const { occupationCode } = requestSchema.parse(json);

    console.log(`Fetching work context for: ${occupationCode}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("onet_work_context")
      .select("*")
      .eq("occupation_code", occupationCode)
      .maybeSingle();

    if (cached) {
      console.log("Returning cached work context");
      
      // Get associated data
      const { data: tasks } = await supabase
        .from("onet_detailed_tasks")
        .select("*")
        .eq("occupation_code", occupationCode)
        .order("importance", { ascending: false })
        .limit(20);

      const { data: activities } = await supabase
        .from("onet_work_activities")
        .select("*")
        .eq("occupation_code", occupationCode)
        .order("importance", { ascending: false });

      const { data: technologies } = await supabase
        .from("onet_technologies")
        .select("*")
        .eq("occupation_code", occupationCode);

      return new Response(
        JSON.stringify({
          workContext: cached,
          tasks: tasks || [],
          activities: activities || [],
          technologies: technologies || [],
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch fresh data from O*NET
    console.log("Fetching fresh data from O*NET...");

    const [workContext, tasks, activities, technologies] = await Promise.all([
      getWorkContext(occupationCode),
      getDetailedTasks(occupationCode),
      getWorkActivities(occupationCode),
      getTechnologies(occupationCode),
    ]);

    // Store work context
    if (Object.keys(workContext).length > 0) {
      await supabase.from("onet_work_context").upsert({
        occupation_code: occupationCode,
        ...workContext,
      }, { onConflict: "occupation_code" });
    }

    // Store tasks
    if (tasks.length > 0) {
      const taskInserts = tasks.map((task) => ({
        occupation_code: occupationCode,
        ...task,
      }));
      await supabase.from("onet_detailed_tasks").upsert(taskInserts, { 
        onConflict: "occupation_code,task_id",
        ignoreDuplicates: true 
      });
    }

    // Store activities
    if (activities.length > 0) {
      const activityInserts = activities.map((activity) => ({
        occupation_code: occupationCode,
        ...activity,
      }));
      await supabase.from("onet_work_activities").upsert(activityInserts, { 
        onConflict: "occupation_code,activity_id",
        ignoreDuplicates: true 
      });
    }

    // Store technologies
    if (technologies.length > 0) {
      const techInserts = technologies.map((tech) => ({
        occupation_code: occupationCode,
        ...tech,
      }));
      await supabase.from("onet_technologies").upsert(techInserts, { 
        onConflict: "occupation_code,technology_id",
        ignoreDuplicates: true 
      });

      // Update hot technologies master list
      const hotTechs = technologies.filter(t => t.is_hot_technology);
      if (hotTechs.length > 0) {
        for (const tech of hotTechs) {
          await supabase.from("onet_hot_technologies_master").upsert({
            technology_name: tech.technology_name,
            category: tech.category,
            related_occupations_count: 1, // Will be incremented
          }, { 
            onConflict: "technology_name",
            ignoreDuplicates: false 
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        workContext,
        tasks,
        activities,
        technologies,
        cached: false,
        fetchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-work-context error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
