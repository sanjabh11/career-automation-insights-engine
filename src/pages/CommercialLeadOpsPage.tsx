import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Download, ExternalLink, History, Lock, Mail, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import {
  buildCommercialLeadCsv,
  CommercialLeadRow,
  fetchCommercialLeads,
  LEAD_STATUSES,
  LeadStatus,
  summarizeCommercialLeads,
  updateCommercialLeadStatus,
} from "@/lib/commercialLeadOps";
import {
  CommercialReportArtifactEvent,
  getCommercialReportArtifact,
  listCommercialReportArtifactEvents,
  logCommercialReportArtifactEvent,
} from "@/lib/commercialReportArtifacts";
import { REVIEW_STATUS_LABELS, type ReportReviewStatus } from "@/lib/reportEvidenceCards";
import type { ProofPackSectionReview } from "@/lib/workTransitionProofPack";

type LeadProofPackReviewSection = Pick<
  ProofPackSectionReview,
  | "sectionId"
  | "sectionTitle"
  | "reviewStatus"
  | "requiredForInstitutionalDelivery"
  | "reviewerRole"
  | "clientReady"
  | "blockingReason"
  | "caveat"
  | "sourceIds"
  | "evidenceCardIds"
  | "acceptanceCriteria"
  | "allowedNextStatuses"
>;

interface LeadProofPackReviewWorkflow {
  reviewStatus?: ReportReviewStatus;
  clientReady?: boolean;
  pendingSectionCount?: number;
  sections: LeadProofPackReviewSection[];
}

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  archived: "Archived",
};

function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.some((status) => status === value);
}

function formatDate(value: string | null): string {
  if (!value) return "Not contacted";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function riskLabel(value: number | null): string {
  return typeof value === "number" ? `${Math.round(value)}%` : "Unscored";
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function eventLabel(eventType: CommercialReportArtifactEvent["eventType"]): string {
  if (eventType === "staff_opened") return "Opened";
  if (eventType === "staff_downloaded") return "Downloaded";
  if (eventType === "section_review_updated") return "Section reviewed";
  if (eventType === "section_client_ready") return "Section client-ready";
  if (eventType === "artifact_client_ready") return "Artifact client-ready";
  return "Open failed";
}

function reviewStatusLabel(status: ReportReviewStatus): string {
  return REVIEW_STATUS_LABELS[status] || status;
}

function reviewStatusBadgeVariant(status: ReportReviewStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "client_ready" || status === "staff_reviewed" || status === "coach_reviewed") return "default";
  if (status === "staff_review_required") return "destructive";
  return "outline";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isReviewStatus(value: unknown): value is ReportReviewStatus {
  return (
    value === "auto_generated" ||
    value === "staff_review_required" ||
    value === "staff_reviewed" ||
    value === "coach_reviewed" ||
    value === "client_ready"
  );
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeReviewSection(value: unknown): LeadProofPackReviewSection | null {
  if (!isRecord(value)) return null;
  const sectionId = typeof value.sectionId === "string" ? value.sectionId : "";
  const sectionTitle = typeof value.sectionTitle === "string" ? value.sectionTitle : "";
  const reviewStatus = isReviewStatus(value.reviewStatus) ? value.reviewStatus : "staff_review_required";
  if (!sectionId || !sectionTitle) return null;

  return {
    sectionId,
    sectionTitle,
    reviewStatus,
    requiredForInstitutionalDelivery: value.requiredForInstitutionalDelivery === true,
    reviewerRole: typeof value.reviewerRole === "string" ? value.reviewerRole : "Staff reviewer",
    clientReady: value.clientReady === true,
    blockingReason: typeof value.blockingReason === "string" ? value.blockingReason : "Review required before client delivery.",
    caveat: typeof value.caveat === "string" ? value.caveat : "Review status is specific to this artifact.",
    sourceIds: readStringList(value.sourceIds),
    evidenceCardIds: readStringList(value.evidenceCardIds),
    acceptanceCriteria: readStringList(value.acceptanceCriteria),
    allowedNextStatuses: readStringList(value.allowedNextStatuses).filter(isReviewStatus),
  };
}

function readProofPackReviewWorkflow(lead: CommercialLeadRow): LeadProofPackReviewWorkflow | null {
  const rawWorkflow = lead.metadata?.proof_pack_review_workflow;
  if (!isRecord(rawWorkflow) || !Array.isArray(rawWorkflow.sections)) return null;
  const sections = rawWorkflow.sections.map(normalizeReviewSection).filter((section): section is LeadProofPackReviewSection => section !== null);
  if (sections.length === 0) return null;

  return {
    reviewStatus: isReviewStatus(rawWorkflow.reviewStatus) ? rawWorkflow.reviewStatus : undefined,
    clientReady: rawWorkflow.clientReady === true,
    pendingSectionCount: typeof rawWorkflow.pendingSectionCount === "number" ? rawWorkflow.pendingSectionCount : undefined,
    sections,
  };
}

function updateWorkflowSectionStatus(
  workflow: LeadProofPackReviewWorkflow,
  sectionId: string,
  reviewStatus: ReportReviewStatus
): LeadProofPackReviewWorkflow {
  const sections = workflow.sections.map((section) => {
    if (section.sectionId !== sectionId) return section;
    const clientReady = reviewStatus === "client_ready" || reviewStatus === "staff_reviewed" || reviewStatus === "coach_reviewed";
    return {
      ...section,
      reviewStatus,
      clientReady,
    };
  });
  const pendingSectionCount = sections.filter((section) => !section.clientReady).length;

  return {
    ...workflow,
    reviewStatus: pendingSectionCount === 0 ? "client_ready" : "staff_review_required",
    clientReady: pendingSectionCount === 0,
    pendingSectionCount,
    sections,
  };
}

function reviewWorkflowSummary(workflow: LeadProofPackReviewWorkflow): string {
  const pending = workflow.pendingSectionCount ?? workflow.sections.filter((section) => !section.clientReady).length;
  return `${workflow.sections.length - pending}/${workflow.sections.length} sections ready`;
}

function artifactFileName(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${sanitized || "commercial-report-artifact"}.html`;
}

function statusBadgeVariant(status: LeadStatus): "default" | "secondary" | "outline" {
  if (status === "converted") return "default";
  if (status === "qualified" || status === "contacted") return "secondary";
  return "outline";
}

export default function CommercialLeadOpsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: sessionLoading } = useSession();
  const userId = user?.id ?? null;
  const [leads, setLeads] = useState<CommercialLeadRow[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [leadStatusDrafts, setLeadStatusDrafts] = useState<Record<string, LeadStatus>>({});
  const [leadNoteDrafts, setLeadNoteDrafts] = useState<Record<string, string>>({});
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [loadingArtifactId, setLoadingArtifactId] = useState<string | null>(null);
  const [loadingEventsArtifactId, setLoadingEventsArtifactId] = useState<string | null>(null);
  const [expandedEventsArtifactId, setExpandedEventsArtifactId] = useState<string | null>(null);
  const [artifactEventsById, setArtifactEventsById] = useState<Record<string, CommercialReportArtifactEvent[]>>({});
  const [reviewNoteDrafts, setReviewNoteDrafts] = useState<Record<string, string>>({});
  const [updatingReviewKey, setUpdatingReviewKey] = useState<string | null>(null);

  const mergeLeadDrafts = useCallback((rows: CommercialLeadRow[]) => {
    setLeadStatusDrafts((current) => {
      const next = { ...current };
      rows.forEach((row) => {
        if (!next[row.id]) next[row.id] = row.status;
      });
      return next;
    });
    setLeadNoteDrafts((current) => {
      const next = { ...current };
      rows.forEach((row) => {
        if (next[row.id] === undefined) next[row.id] = row.staff_notes ?? "";
      });
      return next;
    });
  }, []);

  const loadLeads = useCallback(async () => {
    if (!userId) return;
    setIsLoadingLeads(true);
    setAccessMessage(null);

    try {
      const rows = await fetchCommercialLeads(150);
      setLeads(rows);
      mergeLeadDrafts(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load commercial leads.";
      setAccessMessage(
        message.toLowerCase().includes("not authorized")
          ? "Staff access required. Add this Supabase auth user to public.commercial_staff with an active staff or admin role."
          : message
      );
    } finally {
      setIsLoadingLeads(false);
    }
  }, [mergeLeadDrafts, userId]);

  useEffect(() => {
    if (!sessionLoading && userId) {
      void loadLeads();
    }
  }, [loadLeads, sessionLoading, userId]);

  const summary = useMemo(() => summarizeCommercialLeads(leads), [leads]);
  const segmentOptions = useMemo(
    () => ["all", ...Array.from(new Set(leads.map((lead) => lead.buyer_segment || "unknown"))).sort()],
    [leads]
  );
  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const statusMatches = statusFilter === "all" || lead.status === statusFilter;
        const segmentMatches = segmentFilter === "all" || lead.buyer_segment === segmentFilter;
        return statusMatches && segmentMatches;
      }),
    [leads, segmentFilter, statusFilter]
  );

  const handleExport = () => {
    if (!filteredLeads.length) {
      toast({
        title: "No leads to export",
        description: "Change the filters or refresh the lead list.",
      });
      return;
    }

    const blob = new Blob([buildCommercialLeadCsv(filteredLeads)], {
      type: "text/csv;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commercial-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const openReportArtifact = async (lead: CommercialLeadRow) => {
    const artifactId = lead.report_artifact_id;
    if (!artifactId) return;

    setLoadingArtifactId(artifactId);

    try {
      const artifact = await getCommercialReportArtifact(artifactId);
      const blob = new Blob([artifact.reportHtml], { type: "text/html;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const opened = window.open(url, "_blank");

      if (!opened) {
        const link = document.createElement("a");
        link.href = url;
        link.download = artifactFileName(artifact.title);
        document.body.appendChild(link);
        link.click();
        link.remove();
        let auditLogged = true;
        try {
          const event = await logCommercialReportArtifactEvent({
            artifactId,
            leadId: lead.id,
            eventType: "staff_downloaded",
            metadata: {
              lead_email: lead.email,
              artifact_title: artifact.title,
              fallback_reason: "preview_window_blocked",
            },
          });
          setArtifactEventsById((current) => ({
            ...current,
            [artifactId]: [event, ...(current[artifactId] || [])].slice(0, 10),
          }));
        } catch (logError) {
          auditLogged = false;
          console.warn("Unable to log downloaded artifact event:", logError);
        }
        toast({
          title: "Artifact downloaded",
          description: auditLogged
            ? `${artifact.title} was downloaded and logged because the preview window was blocked.`
            : `${artifact.title} was downloaded, but the delivery event was not logged.`,
        });
      } else {
        opened.opener = null;
        let auditLogged = true;
        try {
          const event = await logCommercialReportArtifactEvent({
            artifactId,
            leadId: lead.id,
            eventType: "staff_opened",
            metadata: {
              lead_email: lead.email,
              artifact_title: artifact.title,
              opened_in_new_tab: true,
            },
          });
          setArtifactEventsById((current) => ({
            ...current,
            [artifactId]: [event, ...(current[artifactId] || [])].slice(0, 10),
          }));
        } catch (logError) {
          auditLogged = false;
          console.warn("Unable to log opened artifact event:", logError);
        }
        toast({
          title: "Artifact opened",
          description: auditLogged
            ? `${artifact.title} opened in a new browser tab and the delivery event was logged.`
            : `${artifact.title} opened in a new browser tab, but the delivery event was not logged.`,
        });
      }

      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      try {
        const event = await logCommercialReportArtifactEvent({
          artifactId,
          leadId: lead.id,
          eventType: "staff_open_failed",
          metadata: {
            lead_email: lead.email,
            error: error instanceof Error ? error.message : "Unable to open this report artifact.",
          },
        });
        setArtifactEventsById((current) => ({
          ...current,
          [artifactId]: [event, ...(current[artifactId] || [])].slice(0, 10),
        }));
      } catch (logError) {
        console.warn("Unable to log failed artifact open event:", logError);
      }
      toast({
        title: "Artifact unavailable",
        description: error instanceof Error ? error.message : "Unable to open this report artifact.",
        variant: "destructive",
      });
    } finally {
      setLoadingArtifactId(null);
    }
  };

  const loadArtifactEvents = async (lead: CommercialLeadRow) => {
    const artifactId = lead.report_artifact_id;
    if (!artifactId) return;

    if (expandedEventsArtifactId === artifactId) {
      setExpandedEventsArtifactId(null);
      return;
    }

    setLoadingEventsArtifactId(artifactId);
    try {
      const events = await listCommercialReportArtifactEvents(artifactId, 6);
      setArtifactEventsById((current) => ({ ...current, [artifactId]: events }));
      setExpandedEventsArtifactId(artifactId);
    } catch (error) {
      toast({
        title: "History unavailable",
        description: error instanceof Error ? error.message : "Unable to load artifact delivery history.",
        variant: "destructive",
      });
    } finally {
      setLoadingEventsArtifactId(null);
    }
  };

  const handleReviewSectionTransition = async (
    lead: CommercialLeadRow,
    section: LeadProofPackReviewSection,
    nextStatus: ReportReviewStatus
  ) => {
    const artifactId = lead.report_artifact_id;
    const workflow = readProofPackReviewWorkflow(lead);
    if (!artifactId || !workflow) return;

    const reviewKey = `${artifactId}:${section.sectionId}:${nextStatus}`;
    const noteKey = `${artifactId}:${section.sectionId}`;
    const staffNote = (reviewNoteDrafts[noteKey] || "").trim();
    setUpdatingReviewKey(reviewKey);

    try {
      const event = await logCommercialReportArtifactEvent({
        artifactId,
        leadId: lead.id,
        eventType: nextStatus === "client_ready" ? "section_client_ready" : "section_review_updated",
        deliveryChannel: "lead-ops-review",
        metadata: {
          proof_pack_review_action: true,
          lead_email: lead.email,
          section_id: section.sectionId,
          section_title: section.sectionTitle,
          from_status: section.reviewStatus,
          to_status: nextStatus,
          staff_note: staffNote || null,
          reviewer_user_id: userId,
          reviewer_email: user?.email || null,
          required_for_institutional_delivery: section.requiredForInstitutionalDelivery,
          acceptance_criteria: section.acceptanceCriteria,
          source_ids: section.sourceIds,
          evidence_card_ids: section.evidenceCardIds,
          caveat: section.caveat,
        },
      });
      const updatedWorkflow = updateWorkflowSectionStatus(workflow, section.sectionId, nextStatus);
      setArtifactEventsById((current) => ({
        ...current,
        [artifactId]: [event, ...(current[artifactId] || [])].slice(0, 10),
      }));
      setLeads((current) =>
        current.map((candidate) =>
          candidate.id === lead.id
            ? {
              ...candidate,
              metadata: {
                ...candidate.metadata,
                proof_pack_review_workflow: updatedWorkflow,
              },
            }
            : candidate
        )
      );
      toast({
        title: nextStatus === "client_ready" ? "Section marked client-ready" : "Section review logged",
        description: `${section.sectionTitle} was logged in the artifact review trail.`,
      });
    } catch (error) {
      toast({
        title: "Review update failed",
        description: error instanceof Error ? error.message : "Unable to log this section review event.",
        variant: "destructive",
      });
    } finally {
      setUpdatingReviewKey(null);
    }
  };

  const handleSaveLead = async (lead: CommercialLeadRow) => {
    const nextStatus = leadStatusDrafts[lead.id] ?? lead.status;
    const nextNotes = leadNoteDrafts[lead.id] ?? lead.staff_notes ?? "";
    setUpdatingLeadId(lead.id);

    try {
      const updatedLead = await updateCommercialLeadStatus({
        leadId: lead.id,
        status: nextStatus,
        staffNotes: nextNotes,
      });
      setLeads((current) => current.map((row) => (row.id === updatedLead.id ? updatedLead : row)));
      setLeadStatusDrafts((current) => ({ ...current, [updatedLead.id]: updatedLead.status }));
      setLeadNoteDrafts((current) => ({ ...current, [updatedLead.id]: updatedLead.staff_notes ?? "" }));
      toast({
        title: "Lead updated",
        description: `${updatedLead.email} is marked ${statusLabels[updatedLead.status].toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update this lead.",
        variant: "destructive",
      });
    } finally {
      setUpdatingLeadId(null);
    }
  };

  if (sessionLoading) {
    return (
      <main className="container mx-auto min-h-screen px-4 py-8">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Checking staff access...</p>
        </Card>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="container mx-auto min-h-screen px-4 py-8">
        <Card className="max-w-2xl p-6">
          <div className="flex items-start gap-3">
            <Lock className="mt-1 h-5 w-5 text-amber-600" />
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Commercial Lead Operations</h1>
                <p className="mt-2 text-sm text-muted-foreground">Sign in with an authorized staff account.</p>
              </div>
              <Button onClick={() => navigate("/auth")}>Sign in</Button>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-screen space-y-6 px-4 py-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Commercial Lead Operations</h1>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Staff-gated review queue for coach, SEO, and workforce proof-pack leads captured through Supabase.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadLeads()} disabled={isLoadingLeads}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </section>

      {accessMessage && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-medium">Access check failed</div>
          <div className="mt-1">{accessMessage}</div>
          <div className="mt-2 text-xs text-amber-800">Current user id: {userId}</div>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Total leads</span>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{summary.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">New</span>
            <Badge variant="outline">Queue</Badge>
          </div>
          <div className="mt-2 text-2xl font-semibold">{summary.newLeads}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Coach</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{summary.coachLeads}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Workforce</span>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{summary.workforceLeads}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Avg risk</span>
            <Badge variant="secondary">Signal</Badge>
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {summary.averageRiskScore === null ? "N/A" : `${summary.averageRiskScore}%`}
          </div>
        </Card>
      </section>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[180px_220px_1fr] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="lead-status-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value === "all" || isLeadStatus(value)) setStatusFilter(value);
              }}
            >
              <SelectTrigger id="lead-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-segment-filter">Segment</Label>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger id="lead-segment-filter">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                {segmentOptions.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment === "all" ? "All segments" : segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            Showing {filteredLeads.length} of {leads.length} leads.
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Report</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingLeads && (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  Loading commercial leads...
                </TableCell>
              </TableRow>
            )}
            {!isLoadingLeads && filteredLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  No matching leads.
                </TableCell>
              </TableRow>
            )}
            {!isLoadingLeads &&
              filteredLeads.map((lead) => {
                const draftStatus = leadStatusDrafts[lead.id] ?? lead.status;
                const draftNotes = leadNoteDrafts[lead.id] ?? lead.staff_notes ?? "";
                const hasChanges = draftStatus !== lead.status || draftNotes !== (lead.staff_notes ?? "");
                const artifactId = lead.report_artifact_id;
                const artifactEvents = artifactId ? artifactEventsById[artifactId] || [] : [];
                const isHistoryExpanded = artifactId ? expandedEventsArtifactId === artifactId : false;
                const reviewWorkflow = readProofPackReviewWorkflow(lead);
                const pendingReviewCount = reviewWorkflow
                  ? reviewWorkflow.pendingSectionCount ?? reviewWorkflow.sections.filter((section) => !section.clientReady).length
                  : null;

                return (
                  <TableRow key={lead.id}>
	                    <TableCell className="min-w-[220px]">
	                      <div className="font-medium">{lead.email}</div>
	                      <div className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</div>
	                      <div className="mt-1 text-xs text-muted-foreground">
	                        Consent: {lead.consent_to_contact ? "yes" : "no"}
	                        {lead.consent_captured_at ? `, ${formatDate(lead.consent_captured_at)}` : ""}
	                      </div>
	                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="font-medium">{lead.occupation_title || "General proof pack"}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.buyer_segment} / {lead.source}
                      </div>
                      {artifactId && (
                        <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>Artifact: {shortId(artifactId)}</span>
                            {reviewWorkflow && (
                              <Badge variant={pendingReviewCount === 0 ? "default" : "secondary"}>
                                {reviewWorkflowSummary(reviewWorkflow)}
                              </Badge>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              disabled={loadingArtifactId === artifactId}
                              aria-label={`Open report artifact for ${lead.email}`}
                              onClick={() => void openReportArtifact(lead)}
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              {loadingArtifactId === artifactId ? "Opening" : "Open"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              disabled={loadingEventsArtifactId === artifactId}
                              aria-label={`Show report artifact history for ${lead.email}`}
                              onClick={() => void loadArtifactEvents(lead)}
                            >
                              <History className="mr-1 h-3 w-3" />
                              {loadingEventsArtifactId === artifactId
                                ? "Loading"
                                : isHistoryExpanded
                                  ? "Hide"
                                  : "History"}
                            </Button>
                          </div>
                          {isHistoryExpanded && (
                            <div className="rounded-md border bg-slate-50 p-2 text-slate-700">
                              {artifactEvents.length === 0 ? (
                                <div>No delivery events logged yet.</div>
                              ) : (
                                <div className="space-y-1">
	                                  {artifactEvents.slice(0, 4).map((event) => (
	                                    <div key={event.id} className="flex flex-wrap items-center justify-between gap-2">
	                                      <span>
                                          {eventLabel(event.eventType)}
                                          {typeof event.metadata?.section_title === "string"
                                            ? `: ${event.metadata.section_title}`
                                            : ""}
                                        </span>
	                                      <span className="text-slate-500">{formatDate(event.createdAt)}</span>
	                                      <span className="text-slate-500">
	                                        {event.actorEmail || event.deliveryChannel || "staff"}
	                                      </span>
	                                    </div>
	                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {reviewWorkflow && (
                            <div className="space-y-2 rounded-md border bg-background p-2 text-slate-800">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="font-medium text-slate-900">Proof-pack section review</div>
                                  <div className="text-slate-500">
                                    Log reviewer identity, status transition, caveat, and acceptance criteria before client delivery.
                                  </div>
                                </div>
                                <Badge variant={pendingReviewCount === 0 ? "default" : "destructive"}>
                                  {pendingReviewCount === 0 ? "Client-ready" : `${pendingReviewCount} pending`}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {reviewWorkflow.sections.map((section) => {
                                  const noteKey = `${artifactId}:${section.sectionId}`;
                                  const reviewKey = `${artifactId}:${section.sectionId}:staff_reviewed`;
                                  const clientReadyKey = `${artifactId}:${section.sectionId}:client_ready`;
                                  return (
                                    <div
                                      key={section.sectionId}
                                      className="space-y-2 rounded border border-slate-200 bg-slate-50 p-2"
                                      data-proof-pack-review-section={section.sectionId}
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                          <div className="font-medium text-slate-900">{section.sectionTitle}</div>
                                          <div className="text-slate-500">{section.blockingReason || section.caveat}</div>
                                        </div>
                                        <Badge variant={reviewStatusBadgeVariant(section.reviewStatus)}>
                                          {reviewStatusLabel(section.reviewStatus)}
                                        </Badge>
                                      </div>
                                      <div className="text-slate-500">
                                        Reviewer: {section.reviewerRole}. Required before institutional delivery:{' '}
                                        {section.requiredForInstitutionalDelivery ? "yes" : "no"}.
                                      </div>
                                      <Textarea
                                        value={reviewNoteDrafts[noteKey] || ""}
                                        rows={2}
                                        maxLength={1000}
                                        placeholder="Reviewer note for this section"
                                        aria-label={`Reviewer note for ${section.sectionTitle}`}
                                        onChange={(event) =>
                                          setReviewNoteDrafts((current) => ({ ...current, [noteKey]: event.target.value }))
                                        }
                                      />
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-xs"
                                          disabled={updatingReviewKey === reviewKey}
                                          onClick={() => void handleReviewSectionTransition(lead, section, "staff_reviewed")}
                                        >
                                          {updatingReviewKey === reviewKey ? "Logging" : "Mark reviewed"}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="h-7 px-2 text-xs"
                                          disabled={updatingReviewKey === clientReadyKey}
                                          onClick={() => void handleReviewSectionTransition(lead, section, "client_ready")}
                                        >
                                          {updatingReviewKey === clientReadyKey ? "Logging" : "Mark client-ready"}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{riskLabel(lead.risk_score)}</Badge>
                    </TableCell>
                    <TableCell className="min-w-[170px]">
                      <div className="space-y-2">
                        <Badge variant={statusBadgeVariant(lead.status)}>{statusLabels[lead.status]}</Badge>
                        <Select
                          value={draftStatus}
                          onValueChange={(value) => {
                            if (isLeadStatus(value)) {
                              setLeadStatusDrafts((current) => ({ ...current, [lead.id]: value }));
                            }
                          }}
                        >
                          <SelectTrigger aria-label={`Status for ${lead.email}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusLabels[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[240px]">
                      <Input
                        value={draftNotes}
                        placeholder="Staff note"
                        maxLength={2000}
                        onChange={(event) =>
                          setLeadNoteDrafts((current) => ({ ...current, [lead.id]: event.target.value }))
                        }
                      />
                      <div className="mt-1 text-xs text-muted-foreground">
                        Last contacted: {formatDate(lead.last_contacted_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={hasChanges ? "default" : "outline"}
                        disabled={!hasChanges || updatingLeadId === lead.id}
                        onClick={() => void handleSaveLead(lead)}
                      >
                        {updatingLeadId === lead.id ? "Saving" : "Save"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
