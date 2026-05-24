import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="container mx-auto min-h-screen px-4 py-10">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-3">
          <Badge variant="outline" className="gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy and Trust
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">
            This policy summarizes how Automation Insights handles commercial proof-pack leads,
            report artifacts, resume-analysis data, and pilot outreach records.
          </p>
          <p className="text-xs text-muted-foreground">Last updated: May 24, 2026</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              When you request a report, sample artifact, workshop, or pilot follow-up, we may collect
              your email address, consent text, consent timestamp, source page, UTM parameters, occupation
              context, selected report settings, and the generated report artifact.
            </p>
            <p>
              Resume-analyzer content should be treated as sensitive. The product should not be used for
              employment decisions without human review, source validation, and applicable legal review.
            </p>
            <p>
              Saved resume proof-report artifacts are designed to be redacted: raw resume text, original
              phrase rows, and detailed rewrite rows are omitted from the saved artifact. The full local
              download remains user-controlled unless a separate consented institutional workflow is added.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How We Use It</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              We use submitted information to generate requested reports, support pilot conversations,
              improve source-labeled career and workforce planning artifacts, and maintain an audit trail
              for report delivery and staff follow-up.
            </p>
            <p>
              Automation scores are directional planning signals. They are not deterministic predictions
              and should not be the sole basis for hiring, termination, compensation, promotion, or other
              employment decisions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Local Fallback Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              If Supabase is temporarily unavailable, the browser may queue a small lead-capture retry
              record for up to seven days. The queue redacts full report HTML before local storage and
              retries persistence on a later successful capture.
            </p>
            <p>
              Avoid submitting sensitive resumes, client records, or employee lists on shared devices.
              Workforce CSV pilots should use anonymized role data unless a separate data-processing
              agreement is in place.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deletion and Contact Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              You can request deletion of saved report artifacts or ask us to stop pilot outreach.
              Commercial lead records preserve consent and artifact-delivery evidence so staff can audit
              whether a report was opened or downloaded.
            </p>
            <p>
              Signed-in resume users can delete saved resume analyses and saved redacted resume proof-report
              artifacts from the analyzer. Deletion receipts are app-level receipts only; they do not certify
              deletion from browser downloads, external model-provider logs, exports, or backups.
            </p>
            <p>
              This page is an operational privacy notice for the current pilot implementation. A formal
              legal policy should be reviewed before scaled paid outreach, enterprise deployment, or
              regulated workforce use.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
