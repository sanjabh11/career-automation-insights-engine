import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Download, ExternalLink, History, Lock, Mail, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  return "Open failed";
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
	                                      <span>{eventLabel(event.eventType)}</span>
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
