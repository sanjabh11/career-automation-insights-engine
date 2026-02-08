// deno run -A supabase/lib/scripts/ingest_onet_metadata.ts <path-to-onet-csv-root>
// Ingest O*NET classification, descriptor, crosswalk and T2 taxonomy CSVs into Supabase.
// Requires SUPABASE_SERVICE_ROLE_KEY & SUPABASE_URL env vars.
// Focuses on Phase-II high-priority tables.

import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { parse } from "https://deno.land/std@0.224.0/csv/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

// Debug utilities
const DEBUG = Deno.env.get("INGEST_DEBUG") === "1";
const logDebug = (...args: unknown[]) => {
  if (DEBUG) console.debug("[INGEST][DEBUG]", ...args);
};
const logInfo = (...args: unknown[]) => console.log("[INGEST]", ...args);
const logWarn = (...args: unknown[]) => console.warn("[INGEST][WARN]", ...args);

if (import.meta.main) {
  const [rootDir] = Deno.args;
  if (!rootDir) {
    console.error("Usage: deno run -A ingest_onet_metadata.ts <root-onet-folder>");
    Deno.exit(1);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE env vars");
    Deno.exit(1);
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const steps = [
    ingestJobZones,
    ingestBrightOutlook,
    ingestStem,
    ingestCareerClusters,
    ingestIndustries,
    ingestDescriptors,
    ingestToolsTech,
  ];
  for (const step of steps) {
    try {
      const label = `STEP:${step.name}`;
      console.time(label);
      await step(client, rootDir);
      console.timeEnd(label);
    } catch (e) {
      console.error(`Step ${step.name} failed:`, e);
    }
  }
  console.log("✅ O*NET metadata ingest complete");
}

async function ingestJobZones(client: SupabaseClient, root: string) {
  const path = join(root, "Job Zones.txt");
  const rows = await readCsv(path);
  for (const r of rows) {
    const id = Number(r.JobZoneCode);
    await client.from("job_zones").upsert({ id, name: r.JobZoneTitle });
  }
  console.log(`→ job_zones: ${rows.length}`);
}

async function ingestBrightOutlook(client: SupabaseClient, root: string) {
  // Bright Outlook not present in O*NET 29.3; skip
  console.log("→ bright_outlook_flags: skipped (not present in O*NET 29.3)");
  return;
  const rows = await readCsv(path);
  for (const r of rows) {
    const id = Number(r.BrightOutlookCode);
    await client
      .from("bright_outlook_flags")
      .upsert({ id, slug: r.BrightOutlookFlag, description: r.Description });
  }
  console.log(`→ bright_outlook_flags: ${rows.length}`);
}

async function ingestStem(client: SupabaseClient, root: string) {
  const path = join(root, "Stem.txt");
  try {
    const rows = await readCsv(path);
    for (const r of rows) {
      const id = Number(r.StemCode);
      await client.from("stem_categories").upsert({ id, name: r.StemTitle });
    }
    console.log(`→ stem_categories: ${rows.length}`);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log("→ stem_categories: skipped (Stem.txt not found)");
    } else {
      throw e;
    }
  }
}

async function ingestCareerClusters(client: SupabaseClient, root: string) {
  const path = join(root, "Career Clusters.txt");
  try {
    const rows = await readCsv(path);
    for (const r of rows) {
      const id = Number(r.ClusterCode);
      await client
        .from("career_clusters")
        .upsert({ id, name: r.ClusterTitle });
    }
    console.log(`→ career_clusters: ${rows.length}`);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log("→ career_clusters: skipped (Career Clusters.txt not found)");
    } else {
      throw e;
    }
  }
}

async function ingestIndustries(client: SupabaseClient, root: string) {
  const path = join(root, "Industries.txt");
  try {
    const rows = await readCsv(path);
    for (const r of rows) {
      const id = Number(r.NAICSCode);
      await client
        .from("industries")
        .upsert({ id, naics_code: r.NAICSCode, name: r.IndustryTitle });
    }
    console.log(`→ industries: ${rows.length}`);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log("→ industries: skipped (Industries.txt not found)");
    } else {
      throw e;
    }
  }
}

async function ingestDescriptors(client: SupabaseClient, root: string) {
  // Example for Abilities.txt; extend similarly for each descriptor family
  const abilityPath = join(root, "Abilities.txt");
  try {
    const abilities = await readCsv(abilityPath);
    logDebug("abilities sample row keys", abilities[0] ? Object.keys(abilities[0]) : []);
    // Ensure family row
    const { data: fam, error: famUpsertErr } = await client
      .from("descriptor_families")
      .upsert({ slug: "abilities", name: "Abilities" })
      .select()
      .single();
    logDebug("descriptor_families upsert result", { fam, famUpsertErr, hasId: !!(fam as any)?.id });
    let familyId = (fam as any)?.id;
    if (!familyId) {
      const { data: fam2, error: famSelErr } = await client
        .from("descriptor_families")
        .select("id, slug, name")
        .eq("slug", "abilities")
        .maybeSingle();
      logWarn("descriptor_families select fallback", { fam2, famSelErr });
      familyId = (fam2 as any)?.id;
    }
    if (!familyId) {
      console.log("→ descriptors.abilities: skipped (descriptor family id unresolved)");
      return;
    }
    for (const a of abilities) {
      const { error: descErr } = await client.from("descriptors").upsert({
        family_id: familyId,
        code: a.ElementID,
        name: a.ElementName,
        description: a.Description,
      });
      if (descErr) {
        logWarn("descriptor upsert error", { code: a?.ElementID, name: a?.ElementName, error: descErr });
      }
    }
    console.log(`→ descriptors.abilities: ${abilities.length}`);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log("→ descriptors.abilities: skipped (Abilities.txt not found)");
    } else {
      throw e;
    }
  }
}

async function ingestToolsTech(client: SupabaseClient, root: string) {
  const path = join(root, "Tools Used.txt");
  try {
    const rows = await readCsv(path);
    logDebug("tools_technology sample row keys", rows[0] ? Object.keys(rows[0]) : []);
    for (const r of rows) {
      await client.from("tools_technology").upsert({
        onet_code: r.ONETCode,
        tool_name: r.Tool,
        category: r.Category,
      });
    }
    console.log(`→ tools_technology: ${rows.length}`);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log("→ tools_technology: skipped (Tools Used.txt not found)");
    } else {
      throw e;
    }
  }
}

async function readCsv(filePath: string) {
  logDebug("readCsv start", { filePath });
  const text = await Deno.readTextFile(filePath);
  try {
    const rows = await parse(text, { skipFirstRow: true, separator: "\t" });
    logDebug("readCsv parsed (normal)", { filePath, rows: Array.isArray(rows) ? rows.length : 0 });
    return rows as Record<string, string>[];
  } catch (e) {
    logWarn("readCsv parser error; attempting line-by-line recovery", { filePath, error: String(e) });
    // Try to recover by parsing line by line, skipping bad lines
    const lines = text.split("\n");
    const header = lines[0];
    const goodRows: Record<string, string>[] = [];
    let badCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      try {
        const parsed = await parse(header + "\n" + line, { skipFirstRow: false, separator: "\t" });
        if (parsed && parsed.length > 0) goodRows.push(parsed[0] as Record<string, string>);
      } catch (rowErr) {
        badCount++;
        if (badCount <= 3) {
          logWarn(`Skipping bad row ${i + 1}`, { snippet: line.slice(0, 120), error: String(rowErr) });
        }
      }
    }
    logWarn("readCsv recovery summary", { filePath, good: goodRows.length, bad: badCount, total: lines.length - 1 });
    return goodRows;
  }
}
