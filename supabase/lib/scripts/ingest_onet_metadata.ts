// deno run -A supabase/lib/scripts/ingest_onet_metadata.ts <path-to-onet-csv-root> [onet-release-version]
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
  const [rootDir, onetReleaseVersion = "30.3"] = Deno.args;
  if (!rootDir) {
    console.error("Usage: deno run -A ingest_onet_metadata.ts <root-onet-folder> [onet-release-version]");
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

  const steps = Deno.env.get("ONET_TASK_RATINGS_ONLY") === "1"
    ? [ingestTaskStatementsAndRatings]
    : [
      ingestJobZones,
      ingestBrightOutlook,
      ingestStem,
      ingestCareerClusters,
      ingestIndustries,
      ingestDescriptors,
      ingestTaskStatementsAndRatings,
      ingestToolsTech,
    ];
  for (const step of steps) {
    try {
      const label = `STEP:${step.name}`;
      console.time(label);
      await step(client, rootDir, onetReleaseVersion);
      console.timeEnd(label);
    } catch (e) {
      console.error(`Step ${step.name} failed:`, e);
    }
  }
  console.log("✅ O*NET metadata ingest complete");
}

async function ingestJobZones(client: SupabaseClient, root: string, _onetReleaseVersion?: string) {
  const path = join(root, "Job Zones.txt");
  const rows = await readCsv(path);
  for (const r of rows) {
    const id = Number(r.JobZoneCode);
    await client.from("job_zones").upsert({ id, name: r.JobZoneTitle });
  }
  console.log(`→ job_zones: ${rows.length}`);
}

async function ingestBrightOutlook(client: SupabaseClient, root: string, _onetReleaseVersion?: string) {
  // Bright Outlook not present in O*NET 30.3; skip
  void client;
  void root;
  console.log("→ bright_outlook_flags: skipped (not present in O*NET 30.3)");
  return;
}

async function ingestStem(client: SupabaseClient, root: string, _onetReleaseVersion?: string) {
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

async function ingestCareerClusters(client: SupabaseClient, root: string, _onetReleaseVersion?: string) {
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

async function ingestIndustries(client: SupabaseClient, root: string, _onetReleaseVersion?: string) {
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

async function ingestDescriptors(client: SupabaseClient, root: string, _onetReleaseVersion?: string) {
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
    const familyRecord = fam as DescriptorFamilyRecord | null;
    logDebug("descriptor_families upsert result", { fam, famUpsertErr, hasId: !!familyRecord?.id });
    let familyId = familyRecord?.id;
    if (!familyId) {
      const { data: fam2, error: famSelErr } = await client
        .from("descriptor_families")
      .select("id, slug, name")
      .eq("slug", "abilities")
      .maybeSingle();
      logWarn("descriptor_families select fallback", { fam2, famSelErr });
      familyId = (fam2 as DescriptorFamilyRecord | null)?.id;
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

type OnetRatingRow = {
  dataValue: number | null;
  n: number | null;
  standardError: number | null;
  lowerCiBound: number | null;
  upperCiBound: number | null;
  recommendSuppress: string | null;
  date: string | null;
  domainSource: string | null;
};

type DominantFrequencyRating = OnetRatingRow & {
  category: number | null;
  label: string | null;
};

type DescriptorFamilyRecord = {
  id?: string | number | null;
};

function readField(row: Record<string, string>, ...names: string[]): string {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined) return value;
  }
  return "";
}

function parseNumber(value: string | undefined | null): number | null {
  if (!value || value === "n/a") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | undefined | null): number | null {
  const parsed = parseNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

function ratingMetadata(row: Record<string, string>): OnetRatingRow {
  return {
    dataValue: parseNumber(readField(row, "Data Value")),
    n: parseInteger(readField(row, "N")),
    standardError: parseNumber(readField(row, "Standard Error")),
    lowerCiBound: parseNumber(readField(row, "Lower CI Bound")),
    upperCiBound: parseNumber(readField(row, "Upper CI Bound")),
    recommendSuppress: readField(row, "Recommend Suppress") || null,
    date: readField(row, "Date") || null,
    domainSource: readField(row, "Domain Source") || null,
  };
}

async function ingestTaskStatementsAndRatings(client: SupabaseClient, root: string, onetReleaseVersion = "30.3") {
  const statementsPath = join(root, "Task Statements.txt");
  const ratingsPath = join(root, "Task Ratings.txt");
  const categoriesPath = join(root, "Task Categories.txt");

  try {
    const [statements, ratings, categories] = await Promise.all([
      readCsv(statementsPath),
      readCsv(ratingsPath),
      readCsv(categoriesPath),
    ]);
    const categoryLabels = new Map<string, string>();
    for (const category of categories) {
      const scaleId = readField(category, "Scale ID");
      const categoryId = readField(category, "Category");
      const description = readField(category, "Category Description");
      if (scaleId && categoryId && description) categoryLabels.set(`${scaleId}:${categoryId}`, description);
    }

    const ratingsByTask = new Map<string, {
      importance?: OnetRatingRow;
      relevance?: OnetRatingRow;
      frequency?: DominantFrequencyRating;
    }>();

    for (const rating of ratings) {
      const onetCode = readField(rating, "O*NET-SOC Code", "ONET-SOC Code");
      const taskId = readField(rating, "Task ID");
      const scaleId = readField(rating, "Scale ID");
      if (!onetCode || !taskId || !scaleId) continue;

      const key = `${onetCode}:${taskId}`;
      const current = ratingsByTask.get(key) || {};
      const metadata = ratingMetadata(rating);

      if (scaleId === "IM") {
        current.importance = metadata;
      } else if (scaleId === "RT") {
        current.relevance = metadata;
      } else if (scaleId === "FT") {
        const category = parseInteger(readField(rating, "Category"));
        const frequencyCandidate: DominantFrequencyRating = {
          ...metadata,
          category,
          label: category === null ? null : categoryLabels.get(`FT:${category}`) || null,
        };
        if (
          !current.frequency ||
          (frequencyCandidate.dataValue ?? -1) > (current.frequency.dataValue ?? -1)
        ) {
          current.frequency = frequencyCandidate;
        }
      }

      ratingsByTask.set(key, current);
    }

    const now = new Date().toISOString();
    let upserted = 0;
    let missingRatings = 0;
    const batchSize = 500;
    const batch: Record<string, unknown>[] = [];

    async function flushBatch() {
      if (!batch.length) return;
      const currentBatch = batch.splice(0, batch.length);
      const { error } = await client.from("onet_detailed_tasks").upsert(currentBatch, {
        onConflict: "occupation_code,task_id",
      });

      if (error) {
        logWarn("onet_detailed_tasks batch upsert error", {
          batchSize: currentBatch.length,
          firstTask: {
            occupation_code: currentBatch[0]?.occupation_code,
            task_id: currentBatch[0]?.task_id,
          },
          error,
        });
        return;
      }

      upserted += currentBatch.length;
      if (upserted % 2500 === 0 || upserted === statements.length) {
        console.log(`→ onet_detailed_tasks progress: ${upserted}/${statements.length}`);
      }
    }

    for (const statement of statements) {
      const onetCode = readField(statement, "O*NET-SOC Code", "ONET-SOC Code");
      const taskId = readField(statement, "Task ID");
      if (!onetCode || !taskId) continue;
      const taskRatings = ratingsByTask.get(`${onetCode}:${taskId}`);
      if (!taskRatings) missingRatings += 1;

      batch.push({
        occupation_code: onetCode,
        task_id: taskId,
        task_description: readField(statement, "Task"),
        task_type: readField(statement, "Task Type") || null,
        importance: taskRatings?.importance?.dataValue ?? null,
        frequency: taskRatings?.frequency?.label ?? null,
        data_source: "onet",
        onet_release_version: onetReleaseVersion,
        relevance_value: taskRatings?.relevance?.dataValue ?? null,
        relevance_n: taskRatings?.relevance?.n ?? null,
        relevance_standard_error: taskRatings?.relevance?.standardError ?? null,
        relevance_lower_ci_bound: taskRatings?.relevance?.lowerCiBound ?? null,
        relevance_upper_ci_bound: taskRatings?.relevance?.upperCiBound ?? null,
        relevance_recommend_suppress: taskRatings?.relevance?.recommendSuppress ?? null,
        relevance_date: taskRatings?.relevance?.date ?? (readField(statement, "Date") || null),
        relevance_domain_source: taskRatings?.relevance?.domainSource ?? (readField(statement, "Domain Source") || null),
        importance_n: taskRatings?.importance?.n ?? null,
        importance_standard_error: taskRatings?.importance?.standardError ?? null,
        importance_lower_ci_bound: taskRatings?.importance?.lowerCiBound ?? null,
        importance_upper_ci_bound: taskRatings?.importance?.upperCiBound ?? null,
        importance_recommend_suppress: taskRatings?.importance?.recommendSuppress ?? null,
        importance_date: taskRatings?.importance?.date ?? (readField(statement, "Date") || null),
        importance_domain_source: taskRatings?.importance?.domainSource ?? (readField(statement, "Domain Source") || null),
        frequency_category: taskRatings?.frequency?.category ?? null,
        frequency_percent: taskRatings?.frequency?.dataValue ?? null,
        frequency_n: taskRatings?.frequency?.n ?? null,
        frequency_standard_error: taskRatings?.frequency?.standardError ?? null,
        frequency_lower_ci_bound: taskRatings?.frequency?.lowerCiBound ?? null,
        frequency_upper_ci_bound: taskRatings?.frequency?.upperCiBound ?? null,
        frequency_recommend_suppress: taskRatings?.frequency?.recommendSuppress ?? null,
        frequency_date: taskRatings?.frequency?.date ?? (readField(statement, "Date") || null),
        frequency_domain_source: taskRatings?.frequency?.domainSource ?? (readField(statement, "Domain Source") || null),
        task_ratings_ingested_at: now,
      });

      if (batch.length >= batchSize) {
        await flushBatch();
      }
    }
    await flushBatch();

    console.log(`→ onet_detailed_tasks: ${upserted} task statements, ${ratings.length} rating rows, ${missingRatings} task(s) missing ratings`);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log("→ onet_detailed_tasks: skipped (Task Statements.txt, Task Ratings.txt, or Task Categories.txt not found)");
    } else {
      throw e;
    }
  }
}

async function ingestToolsTech(client: SupabaseClient, root: string, _onetReleaseVersion?: string) {
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
        const parsed = await parse(header + "\n" + line, { skipFirstRow: true, separator: "\t" });
        if (parsed && parsed.length > 0) goodRows.push(parsed[0] as unknown as Record<string, string>);
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
