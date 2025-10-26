import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type EconRow = {
  industry_sector: string | null;
  task_category: string | null;
  wef_adoption_score: number | null;
  payback_months: number | null;
  technology_maturity: string | null;
  as_of_year: number | null;
  source: string | null;
  source_url: string | null;
  region: string | null;
  country: string | null;
  implementation_cost_low: number | null;
  implementation_cost_high: number | null;
  roi_timeline_months: number | null;
  regulatory_friction: string | null;
  min_org_size: number | null;
  annual_labor_cost_threshold: number | null;
};

export default function EconomicsBrowser() {
  const [rows, setRows] = useState<EconRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sector, setSector] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const supabase = createClient(supabaseUrl, supabaseAnon);
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("automation_economics")
          .select("industry_sector,task_category,wef_adoption_score,payback_months,technology_maturity,as_of_year,source,source_url,region,country,implementation_cost_low,implementation_cost_high,roi_timeline_months,regulatory_friction,min_org_size,annual_labor_cost_threshold")
          .order("industry_sector", { ascending: true })
          .limit(1000);
        if (error) setError(error.message);
        else setRows((data as EconRow[]) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sectors = useMemo(() => {
    return Array.from(new Set(rows.map(r => (r.industry_sector || "").trim()).filter(Boolean))).sort();
  }, [rows]);
  const categories = useMemo(() => {
    return Array.from(new Set(rows.map(r => (r.task_category || "").trim()).filter(Boolean))).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const sOk = !sector || (r.industry_sector || "").toLowerCase() === sector.toLowerCase();
      const cOk = !category || (r.task_category || "").toLowerCase() === category.toLowerCase();
      const text = [r.industry_sector, r.task_category, r.source, r.region, r.country, r.technology_maturity].map(x => (x || "").toLowerCase()).join(" ");
      const qOk = !q || text.includes(q.toLowerCase());
      return sOk && cOk && qOk;
    });
  }, [rows, sector, category, q]);

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Economics Browser</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Sector</span>
          <select className="border rounded p-2" value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">All</option>
            {sectors.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Task Category</span>
          <select className="border rounded p-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {categories.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Search</span>
          <input className="border rounded p-2" placeholder="Search sector/category/source/region/country" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="text-sm text-gray-700 mb-2">
        {loading ? "Loading..." : `${filtered.length} rows`}{error ? ` · ${error}` : ""}
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Sector</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Adoption</th>
              <th className="text-left p-2">Payback (mo)</th>
              <th className="text-left p-2">Maturity</th>
              <th className="text-left p-2">Year</th>
              <th className="text-left p-2">Region</th>
              <th className="text-left p-2">Country</th>
              <th className="text-left p-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50/50"}>
                <td className="p-2 whitespace-nowrap">{r.industry_sector || ""}</td>
                <td className="p-2 whitespace-nowrap">{r.task_category || ""}</td>
                <td className="p-2 whitespace-nowrap">{r.wef_adoption_score ?? ""}</td>
                <td className="p-2 whitespace-nowrap">{r.payback_months ?? ""}</td>
                <td className="p-2 whitespace-nowrap">{r.technology_maturity || ""}</td>
                <td className="p-2 whitespace-nowrap">{r.as_of_year ?? ""}</td>
                <td className="p-2 whitespace-nowrap">{r.region || ""}</td>
                <td className="p-2 whitespace-nowrap">{r.country || ""}</td>
                <td className="p-2 whitespace-nowrap truncate max-w-[300px]">
                  {r.source_url ? (
                    <a className="text-blue-600 hover:underline" href={r.source_url} target="_blank" rel="noreferrer">{r.source || r.source_url}</a>
                  ) : (r.source || "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
