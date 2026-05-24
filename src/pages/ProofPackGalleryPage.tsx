import { ArrowRight, Building2, CheckCircle2, Download, ExternalLink, FileText, GraduationCap, Mail, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import NavigationPremium from "@/components/NavigationPremium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const galleryItems = [
  {
    id: "individual-transition-report",
    title: "Individual transition report",
    buyer: "Career changers, coach clients, alumni",
    route: "/automation-risk/accountant?utm_source=proof_pack_gallery&utm_medium=sample&utm_campaign=phase6_pilot",
    routeLabel: "Open occupation sample",
    icon: FileText,
    sample: "Accountant occupation proof pack",
    output: "Task exposure split, skill-change ledger, emerging role radar, evidence cards, and review state.",
    evidence: ["O*NET-backed occupation context", "Task exposure buckets", "Does not prove boundaries"],
    caveat: "Planning signal only. It must not be used as a guarantee of future employment or displacement.",
  },
  {
    id: "coach-branded-sample",
    title: "Coach-branded sample",
    buyer: "Career coaches, resume writers, counselors",
    route: "/sample-report?utm_source=proof_pack_gallery&utm_medium=sample&utm_campaign=phase6_pilot",
    routeLabel: "Build coach sample",
    icon: Users,
    sample: "White-label client proof pack",
    output: "A branded report artifact that can be reviewed before a client conversation or paid discovery call.",
    evidence: ["Evidence-card report body", "Coach consent capture", "Human review workflow"],
    caveat: "Coach branding does not remove source caveats, review requirements, or employment-decision limits.",
  },
  {
    id: "workforce-csv-audit",
    title: "Workforce CSV audit",
    buyer: "Workforce boards, career centers, L&D teams",
    route: "/enterprise-dashboard?utm_source=proof_pack_gallery&utm_medium=sample&utm_campaign=phase6_pilot",
    routeLabel: "Open workforce audit",
    icon: Building2,
    sample: "Role-level CSV executive report",
    output: "CSV role exposure rollup with unmapped-row review, source caveats, and executive report skeleton.",
    evidence: ["Role rollup", "SOC/O*NET review queue", "Non-employment-decision disclaimer"],
    caveat: "Use anonymized role rows for pilots. This is not employee ranking, hiring, firing, or layoff support.",
  },
];

const occupationSamples = [
  { title: "Accountant", route: "/automation-risk/accountant", segment: "Finance and accounting", proof: "task split plus skill ledger" },
  { title: "Bookkeeper", route: "/automation-risk/bookkeeper", segment: "Small-business finance", proof: "bridge-role and reskilling signal" },
  { title: "Paralegal", route: "/automation-risk/paralegal", segment: "Legal services", proof: "human-led work boundary" },
  { title: "Customer Service Representative", route: "/automation-risk/customer-service-representative", segment: "Operations", proof: "AI-assisted workflow signal" },
  { title: "Software Developer", route: "/automation-risk/software-developer", segment: "Technology", proof: "augmentation-heavy task framing" },
  { title: "Teacher", route: "/automation-risk/teacher", segment: "Education", proof: "human-led trust boundary" },
];

const outreachSegments = [
  {
    segment: "Career coaches",
    owner: "Founder-led LinkedIn and direct email",
    offer: "10 branded proof packs plus one feedback call",
    route: "/sample-report",
    opener:
      "I am piloting a source-labeled AI work-transition proof pack that separates task exposure, skill changes, and emerging role options with evidence cards. Would you review one sample for a role your clients ask about?",
    successMetric: "3 sample requests, 2 feedback calls, 1 paid pilot conversation",
  },
  {
    segment: "Career centers",
    owner: "Counselor and alumni-services outreach",
    offer: "One student/alumni occupation pack plus counselor review notes",
    route: "/automation-risk/accountant",
    opener:
      "I am testing a reviewed career-transition artifact for students and alumni that explains what changed, what to learn next, and what the report does not prove. Could I send a sample for counselor feedback?",
    successMetric: "2 counselor reviews and one workshop-fit discussion",
  },
  {
    segment: "Workforce boards and L&D",
    owner: "Workforce pilot outreach",
    offer: "10-25 role CSV audit with executive proof-pack skeleton",
    route: "/enterprise-dashboard",
    opener:
      "I am building a workforce CSV audit that summarizes role-level AI exposure without ranking employees or making employment decisions. Would a bounded pilot across 10-25 role titles help your planning team?",
    successMetric: "1 anonymized CSV pilot and one review-owner identified",
  },
];

const researchSignals = [
  {
    label: "NACE career readiness",
    url: "https://www.naceweb.org/career-readiness/competencies/career-readiness-defined/",
    takeaway: "Career centers and employers need skills language that connects education, work, and lifelong career management.",
  },
  {
    label: "DOL workforce LMI plan",
    url: "https://www.dol.gov/sites/dolgov/files/ETA/wioa/pdfs/DOL%20Two%20Year%20Plan%20for%20WLMI-FYs-2025-2026.pdf",
    takeaway: "Workforce systems need better signals for skill demand, career transitions, AI, and automation impacts.",
  },
  {
    label: "Lightcast positioning",
    url: "https://lightcast.io/",
    takeaway: "Enterprise buyers expect labor-market intelligence, taxonomies, skills, and workforce strategy context.",
  },
  {
    label: "Workera positioning",
    url: "https://www.workera.ai/product-overview",
    takeaway: "Skills intelligence products compete on evidence, verification, defensibility, and integrations.",
  },
];

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildOutreachCsv(): string {
  const header = ["segment", "owner", "offer", "sample_route", "opening_message", "success_metric", "boundary"];
  const rows = outreachSegments.map((segment) => [
    segment.segment,
    segment.owner,
    segment.offer,
    segment.route,
    segment.opener,
    segment.successMetric,
    "Planning artifact only; not hiring, firing, layoff, or Lightcast-level market intelligence.",
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadOutreachCsv() {
  const blob = new Blob([`${buildOutreachCsv()}\n`], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-work-transition-proof-pack-outreach.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ProofPackGalleryPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavigationPremium />
      <main data-proof-pack-gallery="phase-6-outreach" className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Badge className="mb-5 border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
              Source-labeled AI work transition proof packs
            </Badge>
            <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-white sm:text-5xl">
              Proof-pack gallery for coach, career-center, and workforce pilots
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Three buyer-ready sample paths show what changed, why it changed, what source supports it, what action to take next, and what the artifact must not be used for.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Link to="/sample-report?utm_source=proof_pack_gallery&utm_medium=hero&utm_campaign=phase6_pilot">
                  Generate coach sample
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800">
                <Link to="/enterprise-dashboard?utm_source=proof_pack_gallery&utm_medium=hero&utm_campaign=phase6_pilot">
                  Open workforce audit
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
              <div>
                <h2 className="text-xl font-semibold text-white">Pilot claim boundary</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Planning artifact only. These samples are for coaching, career-center, and workforce discussion. They do not predict layoffs, rank employees, make employment decisions, or claim licensed labor-market intelligence depth.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {galleryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} data-proof-pack-gallery-card={item.id} className="border-slate-800 bg-slate-900 text-slate-100">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl text-white">{item.title}</CardTitle>
                  <CardDescription className="text-slate-400">{item.buyer}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Sample artifact</div>
                    <div className="mt-1 font-medium text-slate-100">{item.sample}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.output}</p>
                  </div>
                  <div className="space-y-2">
                    {item.evidence.map((evidence) => (
                      <div key={evidence} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        {evidence}
                      </div>
                    ))}
                  </div>
                  <p className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                    {item.caveat}
                  </p>
                  <Button asChild className="w-full bg-slate-100 text-slate-950 hover:bg-white">
                    <Link to={item.route}>
                      {item.routeLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">CRM import pack</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Export a bounded pilot list with segment, offer, sample route, opener, success metric, and decision boundary for manual CRM import.
                </p>
              </div>
              <Button type="button" onClick={downloadOutreachCsv} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Download className="mr-2 h-4 w-4" />
                CRM CSV
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {outreachSegments.map((segment) => (
                <div key={segment.segment} data-outreach-segment={segment.segment} className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{segment.segment}</h3>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">{segment.offer}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{segment.opener}</p>
                  <div className="mt-3 text-xs text-slate-400">Success point: {segment.successMetric}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-2xl font-semibold text-white">Occupation sample shelf</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use these samples for outreach links until the deployed gallery is connected to analytics and a CRM sequence.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {occupationSamples.map((sample) => (
                <Link
                  key={sample.title}
                  to={`${sample.route}?utm_source=proof_pack_gallery&utm_medium=occupation_shelf&utm_campaign=phase6_pilot`}
                  className="rounded-md border border-slate-800 bg-slate-950/60 p-4 transition hover:border-emerald-400/60 hover:bg-slate-900"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <GraduationCap className="h-4 w-4 text-emerald-300" />
                    {sample.segment}
                  </div>
                  <div className="mt-2 font-semibold text-white">{sample.title}</div>
                  <div className="mt-1 text-sm text-slate-300">{sample.proof}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Research-backed outreach stance</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The phase focus is a narrow proof-pack wedge, not a full HCM, LMS, ATS, or labor-market data platform.
              </p>
            </div>
            <Button asChild variant="outline" className="border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800">
              <Link to="/privacy">
                <Mail className="mr-2 h-4 w-4" />
                Review privacy boundary
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {researchSignals.map((signal) => (
              <a
                key={signal.label}
                href={signal.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-800 bg-slate-950/60 p-4 transition hover:border-emerald-400/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">{signal.label}</h3>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{signal.takeaway}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
