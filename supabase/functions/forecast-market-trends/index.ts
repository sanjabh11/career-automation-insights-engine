import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ReqSchema = z.object({
  occupation_code: z.string().min(1),
  horizon_months: z.number().min(1).max(36).default(12),
  metric: z.enum(["job_postings_count", "median_salary", "search_volume"]).default("job_postings_count"),
});

interface TimeSeriesRow {
  snapshot_date: string;
  job_postings_count: number | null;
  median_salary: number | null;
  search_volume: number | null;
}

/**
 * Holt-Winters Triple Exponential Smoothing
 *
 * Level:     L[t] = α * (Y[t] / S[t-p]) + (1-α) * (L[t-1] + T[t-1])
 * Trend:     T[t] = β * (L[t] - L[t-1]) + (1-β) * T[t-1]
 * Seasonal:  S[t] = γ * (Y[t] / L[t]) + (1-γ) * S[t-p]
 * Forecast:  F[t+h] = (L[t] + h*T[t]) * S[t-p+h]
 *
 * Returns forecast array + confidence intervals based on residuals
 */
function holtWinters(
  data: number[],
  horizon: number,
  period: number = 12,
  alpha: number = 0.3,
  beta: number = 0.1,
  gamma: number = 0.3,
): { forecast: number[]; residuals: number[]; trendDirection: string; seasonalityDetected: boolean } {
  const n = data.length;
  if (n < period * 2) {
    // Not enough data for seasonal — use simple exponential smoothing
    return simpleExponentialSmoothing(data, horizon);
  }

  // Initialize
  const L = new Array(n).fill(0);
  const T = new Array(n).fill(0);
  const S = new Array(n + period).fill(1);

  // Initial level = average of first period
  L[0] = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  // Initial trend = (avg of second period - avg of first period) / period
  const firstAvg = L[0];
  const secondAvg = data.slice(period, 2 * period).reduce((a, b) => a + b, 0) / period;
  T[0] = (secondAvg - firstAvg) / period;
  // Initial seasonal indices
  for (let i = 0; i < period; i++) {
    S[i] = data[i] / firstAvg;
  }

  const fitted = new Array(n).fill(0);
  const residuals: number[] = [];

  for (let t = 0; t < n; t++) {
    const prevL = t > 0 ? L[t - 1] : L[0];
    const prevT = t > 0 ? T[t - 1] : T[0];
    const seasonalIdx = S[t];

    if (t >= period) {
      L[t] = alpha * (data[t] / seasonalIdx) + (1 - alpha) * (prevL + prevT);
      T[t] = beta * (L[t] - prevL) + (1 - beta) * prevT;
      S[t + period] = gamma * (data[t] / L[t]) + (1 - gamma) * seasonalIdx;
    }

    fitted[t] = (L[t] + T[t]) * seasonalIdx;
    residuals.push(data[t] - fitted[t]);
  }

  // Forecast
  const forecast: number[] = [];
  const lastL = L[n - 1];
  const lastT = T[n - 1];

  for (let h = 1; h <= horizon; h++) {
    const seasonalIdx = S[(n - 1) + ((h - 1) % period) + 1] || 1;
    const f = (lastL + h * lastT) * seasonalIdx;
    forecast.push(Math.max(0, f));
  }

  // Detect trend direction
  const trendSlope = lastT;
  const trendDirection = trendSlope > 0.01 * lastL ? "increasing" : trendSlope < -0.01 * lastL ? "decreasing" : "stable";

  // Detect seasonality (variance in seasonal indices)
  const seasonalVariance = S.slice(0, period).reduce((sum, s) => sum + Math.pow(s - 1, 2), 0) / period;
  const seasonalityDetected = seasonalVariance > 0.01;

  return { forecast, residuals, trendDirection, seasonalityDetected };
}

function simpleExponentialSmoothing(data: number[], horizon: number): { forecast: number[]; residuals: number[]; trendDirection: string; seasonalityDetected: boolean } {
  const alpha = 0.3;
  let level = data[0];
  const fitted: number[] = [data[0]];
  const residuals: number[] = [0];

  for (let t = 1; t < data.length; t++) {
    level = alpha * data[t] + (1 - alpha) * level;
    fitted.push(level);
    residuals.push(data[t] - level);
  }

  const forecast = new Array(horizon).fill(level);
  const recentAvg = data.slice(-Math.min(5, data.length)).reduce((a, b) => a + b, 0) / Math.min(5, data.length);
  const earlyAvg = data.slice(0, Math.min(5, data.length)).reduce((a, b) => a + b, 0) / Math.min(5, data.length);
  const trendDirection = recentAvg > earlyAvg * 1.05 ? "increasing" : recentAvg < earlyAvg * 0.95 ? "decreasing" : "stable";

  return { forecast, residuals, trendDirection, seasonalityDetected: false };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.text();
    let body: z.infer<typeof ReqSchema>;
    try {
      body = ReqSchema.parse(JSON.parse(raw));
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch historical time series data
    const { data: tsRows } = await supabase
      .from("market_time_series")
      .select("snapshot_date, job_postings_count, median_salary, search_volume")
      .eq("occupation_code", body.occupation_code)
      .order("snapshot_date", { ascending: true })
      .limit(200) as { data: TimeSeriesRow[] | null; error: unknown };

    if (!tsRows || tsRows.length < 3) {
      return new Response(JSON.stringify({
        error: "Insufficient historical data for forecasting",
        occupation_code: body.occupation_code,
        data_points: tsRows?.length ?? 0,
        minimum_required: 3,
        suggestion: "Run seed-market-snapshot to populate time series data",
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the requested metric
    const data = tsRows
      .map((r) => {
        if (body.metric === "job_postings_count") return r.job_postings_count;
        if (body.metric === "median_salary") return r.median_salary;
        return r.search_volume;
      })
      .filter((v): v is number => v !== null && v !== undefined && v > 0);

    if (data.length < 3) {
      return new Response(JSON.stringify({
        error: `Insufficient non-null data for metric: ${body.metric}`,
        data_points: data.length,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run Holt-Winters forecasting
    const result = holtWinters(data, body.horizon_months);

    // Compute confidence intervals from residuals
    const residualStd = stdDev(result.residuals);
    const lastValue = data[data.length - 1];
    const ciWidth = 1.96 * residualStd;

    const forecastWithCI = result.forecast.map((f, i) => {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + i + 1);
      return {
        month: monthDate.toISOString().substring(0, 7),
        forecast: Math.round(f * 100) / 100,
        lower_ci: Math.round(Math.max(0, f - ciWidth) * 100) / 100,
        upper_ci: Math.round((f + ciWidth) * 100) / 100,
      };
    });

    const response = {
      occupation_code: body.occupation_code,
      metric: body.metric,
      model: "holt_winters_triple_exponential_smoothing",
      historical_data_points: data.length,
      horizon_months: body.horizon_months,
      forecast: forecastWithCI,
      trend_direction: result.trendDirection,
      seasonality_detected: result.seasonalityDetected,
      confidence_level: "95%",
      last_observed_value: lastValue,
      forecast_change_pct: Math.round(
        ((result.forecast[result.forecast.length - 1] - lastValue) / lastValue) * 1000,
      ) / 10,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("forecast-market-trends error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
