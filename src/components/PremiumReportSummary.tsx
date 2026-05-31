import React from "react";
import { Shield, TrendingUp, Clock, Gauge, Info, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PremiumReportSummaryProps {
  occupation: any;
  overallAPO: number;
}

function gradeFromAPO(apo: number) {
  if (apo >= 75) return { grade: "D", label: "Very High Exposure", color: "from-red-500 to-rose-500" };
  if (apo >= 60) return { grade: "C", label: "Elevated Exposure", color: "from-orange-500 to-amber-500" };
  if (apo >= 40) return { grade: "B", label: "Moderate Exposure", color: "from-yellow-500 to-lime-500" };
  return { grade: "A", label: "Lower Exposure", color: "from-emerald-500 to-teal-500" };
}

export default function PremiumReportSummary({ occupation, overallAPO }: PremiumReportSummaryProps) {
  const score = Math.max(0, Math.min(100, Number(occupation?.overallAPO ?? overallAPO ?? 0)));
  const g = gradeFromAPO(score);
  const confidence = String(occupation?.confidence || "medium");
  const timeline = String(occupation?.timeline || "2031-2035");
  const sector = occupation?.externalSignals?.industrySector ?? null;
  const ciRaw = occupation?.ci;
  const ci = ciRaw && typeof ciRaw === 'object'
    ? {
        lower: Number((ciRaw as any).lower),
        upper: Number((ciRaw as any).upper),
        iterations: Number((ciRaw as any).iterations || (ciRaw as any).n || 0) || undefined,
      }
    : undefined;

  const conic = `conic-gradient(rgb(45 212 168) ${score}%, #e5e7eb 0)`; // teal accent
  const conicPremium = `conic-gradient(rgb(45 212 168) ${score}%, #e5e7eb 0)`; // teal accent

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-slide-up">
      {/* Primary ring card */}
      <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/40 bg-[var(--bg-secondary)]/70 backdrop-blur-xl shadow-xl">
        <div className="absolute -inset-1 bg-gradient-to-tr from-[var(--accent-primary)]/10 via-[var(--accent-amber)]/10 to-[var(--accent-primary)]/10" />
        <div className="relative p-6 flex items-center gap-6">
          <div className="relative">
            <div
              className="h-24 w-24 rounded-full grid place-items-center shadow-inner"
              style={{ backgroundImage: conicPremium }}
              aria-label={`Automation exposure estimate ${score.toFixed(0)} percent`}
            >
              <div className="h-20 w-20 rounded-full bg-[var(--bg-primary)] grid place-items-center text-[var(--text-primary)] font-bold">
                {score.toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[var(--bg-secondary)]/70 border border-[hsl(var(--border))] shadow-sm">
              <Gauge className="h-4 w-4 text-[var(--accent-primary)]" />
              <span className="text-xs font-medium text-[var(--text-secondary)]">Decision-support estimate</span>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div>
                <div className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{g.label}</div>
                <div className="text-xs text-[var(--text-tertiary)]">Planning signal. Not a job-loss probability or employment decision.</div>
              </div>
              <div className={`ml-auto inline-flex items-center justify-center rounded-xl px-3 py-2 text-white bg-gradient-to-r ${g.color} shadow-lg`}>
                <span className="text-sm font-bold">Grade {g.grade}</span>
              </div>
            </div>
            {ci && Number.isFinite(ci.lower) && Number.isFinite(ci.upper) && (
              <div className="mt-3">
                <div className="text-[10px] text-[var(--text-tertiary)] mb-1">Uncertainty band</div>
                <div className="relative h-4 w-full bg-[var(--bg-tertiary)] rounded border border-[var(--accent-primary)]/20" role="img" aria-label={`Uncertainty band from ${ci.lower} to ${ci.upper}; point estimate ${score}%`}>
                  {(() => {
                    const lo = Math.max(0, Math.min(100, ci.lower));
                    const hi = Math.max(0, Math.min(100, ci.upper));
                    const left = Math.min(lo, hi);
                    const width = Math.max(0.5, Math.abs(hi - lo));
                    const point = Math.max(0, Math.min(100, score));
                    return (
                      <>
                        <div
                          className="absolute top-0 bottom-0 bg-[var(--accent-primary)]/20"
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                        <div
                          className="absolute -top-1.5 h-7 w-[2px] bg-[var(--accent-primary)]"
                          style={{ left: `calc(${point}% - 1px)` }}
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confidence and timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[hsl(var(--border))]/40 bg-[var(--bg-secondary)]/70 backdrop-blur-xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <div className="text-sm font-semibold">Confidence</div>
            </div>
            {ci && typeof ci.lower === 'number' && typeof ci.upper === 'number' ? (
              <Badge variant="outline" className="text-[10px]">CI: {ci.lower}–{ci.upper}{ci?.iterations ? ` (n=${ci.iterations})` : ''}</Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={
              confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
              confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-rose-100 text-rose-700'
            }>
              {confidence}
            </Badge>
            <span className="text-xs text-[var(--text-secondary)]">model confidence</span>
          </div>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))]/40 bg-[var(--bg-secondary)]/70 backdrop-blur-xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--accent-primary)]" />
              <div className="text-sm font-semibold">Timeline</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{timeline}</Badge>
            <span className="text-xs text-[var(--text-secondary)]">expected impact window</span>
          </div>
        </div>
      </div>

      {/* Sector and provenance */}
      <div className="rounded-2xl border border-[hsl(var(--border))]/40 bg-[var(--bg-secondary)]/70 backdrop-blur-xl shadow-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--accent-primary)]" />
            <div className="text-sm font-semibold">Signals & Provenance</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {typeof occupation?.externalSignals?.blsTrendPct === 'number' && (
            <Badge variant="outline" className="text-xs">BLS {occupation.externalSignals.blsTrendPct >= 0 ? '📈' : '📉'} {occupation.externalSignals.blsTrendPct}%</Badge>
          )}
          {sector && <Badge variant="secondary" className="text-xs">Sector: {sector}</Badge>}
          {typeof occupation?.externalSignals?.sectorDelayMonths === 'number' && (
            <Badge variant="outline" className="text-xs">Sector Delay: {occupation.externalSignals.sectorDelayMonths} mo</Badge>
          )}
          {typeof occupation?.externalSignals?.econViabilityDiscount === 'number' && occupation.externalSignals.econViabilityDiscount > 0 && (
            <Badge variant="destructive" className="text-xs">Econ Discount: -{occupation.externalSignals.econViabilityDiscount} pts</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
