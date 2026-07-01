/**
 * Enterprise Team Dashboard
 * Phase 4 - Workforce planning and automation risk analysis for organizations
 */

import { useState, useEffect, useMemo, useCallback, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Building2,
  DollarSign,
  Target,
  FileText,
  Download,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { CSVEmployeeImporter } from '@/components/CSVEmployeeImporter';
import { OverviewTab } from '@/components/enterprise-panels/OverviewTab';
import { DepartmentsTab } from '@/components/enterprise-panels/DepartmentsTab';
import { OpportunitiesTab } from '@/components/enterprise-panels/OpportunitiesTab';
import { ROICalculatorTab } from '@/components/enterprise-panels/ROICalculatorTab';
import { ScenariosTab } from '@/components/enterprise-panels/ScenariosTab';
import { useSession } from '@/hooks/useSession';
import {
  CommercialWorkforceAuditRecord,
  CommercialWorkforceReviewRow,
  getCommercialWorkforceAudit,
  listCommercialWorkforceAudits,
  listCommercialWorkforceReviewRows,
  saveCommercialWorkforceAudit,
  updateCommercialWorkforceRowMapping,
} from '@/lib/commercialWorkforceAudits';
import {
  REPORT_TRUST_NOTICES,
  getActiveReportSourceVersionSummary,
  getReportSourceSnapshot,
} from '@/lib/reportProvenance';
import { getSocSuggestionCatalogStats, suggestSocCodes } from '@/lib/socSuggestions';
import { downloadWorkforceExecutiveReport } from '@/lib/workforceExecutiveReport';
import {
  buildWorkforceTransitionProofPack,
  getTransitionProofPackReviewMetadata,
} from '@/lib/workTransitionProofPack';

interface OrgMetrics {
  total_employees: number;
  overall_apo_score: number;
  risk_distribution: {
    low_risk: number;
    medium_risk: number;
    high_risk: number;
  };
}

interface DepartmentData {
  department: string;
  employee_count: number;
  avg_apo_score: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  avg_salary: number;
  total_payroll: number;
  automation_savings_potential: number;
}

interface AutomationOpportunity {
  occupation_title: string;
  soc_code: string;
  employee_count: number;
  avg_apo_score: number;
  total_payroll: number;
  automation_potential_savings: number;
  recommended_action: string;
}

interface UtilityRoleTemplate {
  role: string;
  soc_code: string;
  department: string;
  grid_modernization_skills: string[];
  reskilling_focus: string;
}

interface WorkforceAuditRow {
  id?: string;
  department: string;
  role: string;
  headcount: number;
  avgSalary: number;
  apoScore: number;
  socCode?: string;
  reviewStatus?: string;
  reviewNotes?: string;
  reviewedAt?: string | null;
}

interface WorkforceAuditSummary {
  totalHeadcount: number;
  weightedExposure: number;
  highRiskHeadcount: number;
  payroll: number;
  highRiskPayroll: number;
  mappedRows: number;
  unmappedRows: number;
  suggestedRows: number;
  highConfidenceSuggestedRows: number;
}

interface RoiResult {
  totalInvestment?: number;
  projectedSavings?: number;
  roiPercentage?: number | string;
  analysis?: string;
}

const COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
};

const UTILITY_ROLE_TEMPLATES: UtilityRoleTemplate[] = [
  {
    role: 'Electrical Power-Line Installers and Repairers',
    soc_code: '49-9051.00',
    department: 'Field Operations',
    grid_modernization_skills: ['safety compliance', 'distribution automation', 'mobile work management'],
    reskilling_focus: 'Augment field work with inspection data, outage analytics, and digital work orders.',
  },
  {
    role: 'Electrical and Electronics Engineering Technologists and Technicians',
    soc_code: '17-3023.00',
    department: 'Substation / Grid Assets',
    grid_modernization_skills: ['SCADA/OT', 'sensor diagnostics', 'relay testing'],
    reskilling_focus: 'Move technicians toward grid-device analytics and operational technology reliability.',
  },
  {
    role: 'Power Distributors and Dispatchers',
    soc_code: '51-8012.00',
    department: 'Control Center',
    grid_modernization_skills: ['DER dispatch', 'situational awareness', 'AI decision support'],
    reskilling_focus: 'Keep human authority over high-consequence operational decisions while automating routine monitoring.',
  },
  {
    role: 'Information Security Analysts',
    soc_code: '15-1212.00',
    department: 'Cybersecurity / OT',
    grid_modernization_skills: ['OT security', 'incident response', 'zero trust'],
    reskilling_focus: 'Prioritize cyber controls for grid modernization and connected operational assets.',
  },
  {
    role: 'Regulatory Affairs Specialists',
    soc_code: '13-1041.07',
    department: 'Regulatory / Compliance',
    grid_modernization_skills: ['regulatory reporting', 'evidence management', 'rate-case analytics'],
    reskilling_focus: 'Shift from manual reporting toward evidence review, compliance strategy, and stakeholder narrative.',
  },
];

const SAMPLE_WORKFORCE_CSV = `department,role,headcount,avg_salary,apo_score,soc_code
Customer Operations,Customer Service Representatives,120,55000,78,43-4051.00
Finance,Bookkeeping Accounting and Auditing Clerks,42,58000,74,43-3031.00
Field Operations,Electrical Power-Line Installers and Repairers,86,76000,32,49-9051.00
Control Center,Power Distributors and Dispatchers,24,96000,41,51-8012.00
Regulatory,Regulatory Affairs Specialists,18,88000,52,13-1041.07`;

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

function parseWorkforceAuditInput(raw: string): WorkforceAuditRow[] {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].split(',').map(normalizeHeader);
  const hasHeader = header.includes('role') || header.includes('job_title') || header.includes('department');
  const rows = hasHeader ? lines.slice(1) : lines;

  const getValue = (values: string[], keys: string[], fallbackIndex: number) => {
    if (hasHeader) {
      const index = keys.map((key) => header.indexOf(key)).find((idx) => idx >= 0);
      if (typeof index === 'number' && index >= 0) return values[index] || '';
    }
    return values[fallbackIndex] || '';
  };

  return rows.map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return {
      department: getValue(values, ['department', 'team', 'business_unit'], 0),
      role: getValue(values, ['role', 'job_title', 'occupation'], 1),
      headcount: Number(getValue(values, ['headcount', 'employee_count', 'count'], 2)) || 0,
      avgSalary: Number(getValue(values, ['avg_salary', 'average_salary', 'salary'], 3)) || 0,
      apoScore: Number(getValue(values, ['apo_score', 'automation_score', 'risk_score'], 4)) || 0,
      socCode: getValue(values, ['soc_code', 'soc'], 5) || undefined,
    };
  }).filter((row) => row.role && row.department && row.headcount > 0);
}

function summarizeWorkforceRows(rows: WorkforceAuditRow[]): WorkforceAuditSummary {
  const totalHeadcount = rows.reduce((sum, row) => sum + row.headcount, 0);
  const weightedExposure = totalHeadcount
    ? rows.reduce((sum, row) => sum + row.headcount * row.apoScore, 0) / totalHeadcount
    : 0;
  const highRiskRows = rows.filter((row) => row.apoScore >= 70);
  const highRiskHeadcount = highRiskRows.reduce((sum, row) => sum + row.headcount, 0);
  const payroll = rows.reduce((sum, row) => sum + row.headcount * row.avgSalary, 0);
  const highRiskPayroll = highRiskRows.reduce((sum, row) => sum + row.headcount * row.avgSalary, 0);
  const mappedRows = rows.filter((row) => row.socCode).length;
  const unmappedSuggestions = rows
    .filter((row) => !row.socCode)
    .map((row) => suggestSocCodes({
      role: row.role,
      department: row.department,
      limit: 1,
    })[0])
    .filter(Boolean);
  const suggestedRows = unmappedSuggestions.filter((suggestion) => suggestion.confidence >= 50).length;
  const highConfidenceSuggestedRows = unmappedSuggestions.filter((suggestion) => suggestion.confidence >= 75).length;

  return {
    totalHeadcount,
    weightedExposure,
    highRiskHeadcount,
    payroll,
    highRiskPayroll,
    mappedRows,
    unmappedRows: rows.length - mappedRows,
    suggestedRows,
    highConfidenceSuggestedRows,
  };
}

function getWorkforceAuditSourceVersions() {
  return getReportSourceSnapshot();
}

function formatSavedAuditLabel(record: CommercialWorkforceAuditRecord) {
  return `${record.fileName} - ${new Date(record.createdAt).toLocaleDateString()} - ${record.rowCount} roles`;
}

const EnterpriseTeamDashboard = ({ orgId }: { orgId: string }) => {
  const { toast } = useToast();
  const { session } = useSession();
  const staffUserId = session?.user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState<OrgMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [opportunities, setOpportunities] = useState<AutomationOpportunity[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [roiResult, setRoiResult] = useState<RoiResult | null>(null);
  const [roiLoading, setRoiLoading] = useState(false);
  const [roiParams, setRoiParams] = useState({
    employeeCount: 100,
    avgSalary: 80000,
    trainingCost: 5000,
  });
  const [workforceCsv, setWorkforceCsv] = useState(SAMPLE_WORKFORCE_CSV);
  const [auditRows, setAuditRows] = useState<WorkforceAuditRow[]>(() =>
    parseWorkforceAuditInput(SAMPLE_WORKFORCE_CSV)
  );
  const [auditFileName, setAuditFileName] = useState('sample-utilities-audit.csv');
  const [savingAudit, setSavingAudit] = useState(false);
  const [loadingSavedAudits, setLoadingSavedAudits] = useState(false);
  const [savedAudits, setSavedAudits] = useState<CommercialWorkforceAuditRecord[]>([]);
  const [selectedSavedAuditId, setSelectedSavedAuditId] = useState<string>('none');
  const [savedAuditAccessMessage, setSavedAuditAccessMessage] = useState<string | null>(null);
  const [reviewRows, setReviewRows] = useState<CommercialWorkforceReviewRow[]>([]);
  const [loadingReviewRows, setLoadingReviewRows] = useState(false);
  const [reviewSocDrafts, setReviewSocDrafts] = useState<Record<string, string>>({});
  const [reviewNoteDrafts, setReviewNoteDrafts] = useState<Record<string, string>>({});
  const [updatingReviewRowId, setUpdatingReviewRowId] = useState<string | null>(null);
  const auditSummary = useMemo(() => summarizeWorkforceRows(auditRows), [auditRows]);
  const socSuggestionCatalog = useMemo(() => getSocSuggestionCatalogStats(), []);

  const mergeReviewDrafts = useCallback((rows: CommercialWorkforceReviewRow[]) => {
    setReviewSocDrafts((current) => {
      const next = { ...current };
      rows.forEach((row) => {
        if (next[row.id] === undefined) next[row.id] = row.socCode || '';
      });
      return next;
    });
    setReviewNoteDrafts((current) => {
      const next = { ...current };
      rows.forEach((row) => {
        if (next[row.id] === undefined) next[row.id] = row.reviewNotes || '';
      });
      return next;
    });
  }, []);

  const loadSavedWorkforceAudits = useCallback(async () => {
    if (!staffUserId) {
      setSavedAudits([]);
      setSelectedSavedAuditId('none');
      setSavedAuditAccessMessage('Sign in with a staff account to save and reload workforce audit artifacts.');
      return;
    }

    setLoadingSavedAudits(true);
    setSavedAuditAccessMessage(null);
    try {
      const records = await listCommercialWorkforceAudits(20);
      setSavedAudits(records);
      setSelectedSavedAuditId((current) => (current !== 'none' && records.some((record) => record.id === current) ? current : 'none'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load saved workforce audits.';
      setSavedAuditAccessMessage(
        message.toLowerCase().includes('not authorized')
          ? 'Staff access required. Add this Supabase auth user to public.commercial_staff before saving workforce audits.'
          : message
      );
    } finally {
      setLoadingSavedAudits(false);
    }
  }, [staffUserId]);

  useEffect(() => {
    void loadSavedWorkforceAudits();
  }, [loadSavedWorkforceAudits]);

  const loadWorkforceReviewQueue = useCallback(async (auditIdOverride?: string | null) => {
    if (!staffUserId) {
      setReviewRows([]);
      return;
    }

    setLoadingReviewRows(true);
    const auditId = auditIdOverride !== undefined ? auditIdOverride : selectedSavedAuditId === 'none' ? null : selectedSavedAuditId;
    try {
      const rows = await listCommercialWorkforceReviewRows({ auditId, limit: 100 });
      setReviewRows(rows);
      mergeReviewDrafts(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load workforce review queue.';
      setSavedAuditAccessMessage(message);
    } finally {
      setLoadingReviewRows(false);
    }
  }, [mergeReviewDrafts, selectedSavedAuditId, staffUserId]);

  useEffect(() => {
    void loadWorkforceReviewQueue();
  }, [loadWorkforceReviewQueue]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      // Demo mode for QA/Preview
      if (orgId === 'demo') {
        setMetrics({
          total_employees: 1250,
          overall_apo_score: 42,
          risk_distribution: {
            low_risk: 450,
            medium_risk: 500,
            high_risk: 300,
          },
        });
        setDepartments([
          {
            department: 'Engineering',
            employee_count: 400,
            avg_apo_score: 15,
            high_risk_count: 20,
            medium_risk_count: 80,
            low_risk_count: 300,
            avg_salary: 120000,
            total_payroll: 48000000,
            automation_savings_potential: 2400000,
          },
          {
            department: 'Customer Support',
            employee_count: 300,
            avg_apo_score: 75,
            high_risk_count: 200,
            medium_risk_count: 80,
            low_risk_count: 20,
            avg_salary: 55000,
            total_payroll: 16500000,
            automation_savings_potential: 8250000,
          },
          {
            department: 'Accounting',
            employee_count: 150,
            avg_apo_score: 65,
            high_risk_count: 80,
            medium_risk_count: 50,
            low_risk_count: 20,
            avg_salary: 75000,
            total_payroll: 11250000,
            automation_savings_potential: 4500000,
          },
        ]);
        setOpportunities([
          {
            occupation_title: 'Data Entry Keyers',
            soc_code: '43-9021',
            employee_count: 45,
            avg_apo_score: 92,
            total_payroll: 1800000,
            automation_potential_savings: 1656000,
            recommended_action: 'Full Automation',
          },
          {
            occupation_title: 'Customer Service Representatives',
            soc_code: '43-4051',
            employee_count: 120,
            avg_apo_score: 78,
            total_payroll: 4800000,
            automation_potential_savings: 3744000,
            recommended_action: 'AI Augmentation',
          },
        ]);
        setLoading(false);
        return;
      }

      // Load organization metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('calculate_org_apo_score', { p_org_id: orgId });

      if (metricsError) throw metricsError;
      setMetrics(metricsData);

      // Load department breakdown
      const { data: deptData, error: deptError } = await supabase
        .rpc('get_department_risk_analysis', {
          p_org_id: orgId,
          p_department_name: selectedDepartment,
        });

      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // Load automation opportunities
      const { data: oppData, error: oppError } = await supabase
        .rpc('get_automation_opportunities', {
          p_org_id: orgId,
          p_min_apo_score: 70,
          p_min_headcount: 5,
        });

      if (oppError) throw oppError;
      setOpportunities(oppData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [orgId, selectedDepartment, toast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const syncHRIS = async () => {
    setSyncing(true);
    toast({
      title: 'Sync Started',
      description: 'HRIS data synchronization has been initiated...',
    });

    try {
      const { error } = await supabase.functions.invoke('hris-sync', {
        body: { orgId },
      });

      if (error) throw error;

      toast({
        title: 'Sync Complete',
        description: 'HRIS data synchronized successfully.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      // Reload dashboard after sync
      setTimeout(() => {
        void loadDashboard();
      }, 1000);
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync HRIS data',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const exportReport = async () => {
    setIsGeneratingReport(true);
    toast({
      title: 'Generating Report',
      description: 'Please wait while we generate your executive report...',
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-executive-report', {
        body: {
          orgId,
          reportType: 'quarterly_workforce',
          includeSections: [
            'executive_summary',
            'department_breakdown',
            'automation_opportunities',
            'recommendations',
          ],
        },
      });

      if (error) throw error;

      toast({
        title: 'Report Ready',
        description: 'Report generated successfully. Check your email for the download link.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const calculateROI = async () => {
    setRoiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-learning-roi', {
        body: roiParams,
      });

      if (error) throw error;
      setRoiResult(data as RoiResult);

      toast({
        title: 'Calculation Complete',
        description: 'ROI analysis updated.',
      });
    } catch (error) {
      console.error('ROI error:', error);
      toast({
        title: 'Calculation Failed',
        description: 'Failed to calculate ROI',
        variant: 'destructive',
      });
    } finally {
      setRoiLoading(false);
    }
  };

  const generateWorkforceAudit = () => {
    const parsedRows = parseWorkforceAuditInput(workforceCsv);
    if (parsedRows.length === 0) {
      toast({
        title: 'No roles parsed',
        description: 'Use columns: department, role, headcount, avg_salary, apo_score, soc_code.',
        variant: 'destructive',
      });
      return;
    }

    setAuditRows(parsedRows);
    toast({
      title: 'Audit Skeleton Ready',
      description: `Parsed ${parsedRows.length} workforce rows for executive rollup.`,
    });
  };

  const exportWorkforceExecutiveReport = () => {
    if (auditRows.length === 0) {
      toast({
        title: 'No audit rows',
        description: 'Generate or load a workforce audit before exporting the executive report.',
        variant: 'destructive',
      });
      return;
    }

    downloadWorkforceExecutiveReport({
      orgName: orgId === 'demo' ? 'Demo Organization' : orgId,
      fileName: auditFileName || 'workforce-audit.csv',
      rows: auditRows,
      summary: auditSummary,
    });

    toast({
      title: 'Executive report exported',
      description: 'Downloaded a source-labeled workforce exposure HTML report for pilot review.',
    });
  };

  const handleWorkforceCsvUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setWorkforceCsv(text);
      setAuditFileName(file.name);
      const parsedRows = parseWorkforceAuditInput(text);
      setAuditRows(parsedRows);
      toast({
        title: 'CSV Loaded',
        description: `${file.name} loaded with ${parsedRows.length} parsed workforce rows.`,
      });
    };
    reader.readAsText(file);
  };

  const saveWorkforceAudit = async () => {
    const rowsToSave = parseWorkforceAuditInput(workforceCsv);
    if (rowsToSave.length === 0) {
      toast({
        title: 'No roles parsed',
        description: 'Generate a valid audit before saving it.',
        variant: 'destructive',
      });
      return;
    }

    if (!staffUserId) {
      toast({
        title: 'Staff sign-in required',
        description: 'Sign in with a commercial staff account before saving workforce audit artifacts.',
      });
      return;
    }

    const summaryToSave = summarizeWorkforceRows(rowsToSave);
    const proofPackReviewWorkflow = getTransitionProofPackReviewMetadata(
      buildWorkforceTransitionProofPack(rowsToSave)
    );
    setSavingAudit(true);
    try {
      const savedAudit = await saveCommercialWorkforceAudit({
        orgId,
        fileName: auditFileName || 'workforce-audit.csv',
        sourceCsv: workforceCsv,
        summary: {
          totalHeadcount: summaryToSave.totalHeadcount,
          weightedExposure: Math.round(summaryToSave.weightedExposure * 100) / 100,
          highRiskHeadcount: summaryToSave.highRiskHeadcount,
          highRiskPayroll: summaryToSave.highRiskPayroll,
          mappedRows: summaryToSave.mappedRows,
          unmappedRows: summaryToSave.unmappedRows,
        },
        rows: rowsToSave,
        sourceVersions: {
          ...getWorkforceAuditSourceVersions(),
          proof_pack_review_workflow: proofPackReviewWorkflow,
        },
      });

      setAuditRows(rowsToSave);
      setSavedAudits((current) => [savedAudit, ...current.filter((record) => record.id !== savedAudit.id)].slice(0, 20));
      setSelectedSavedAuditId(savedAudit.id);
      setSavedAuditAccessMessage(null);
      await loadWorkforceReviewQueue(savedAudit.id);
      toast({
        title: 'Workforce audit saved',
        description: `Saved ${savedAudit.rowCount} role rows for staff review.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save workforce audit.';
      setSavedAuditAccessMessage(message);
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingAudit(false);
    }
  };

  const loadSelectedWorkforceAudit = async () => {
    if (selectedSavedAuditId === 'none') {
      toast({
        title: 'Select a saved audit',
        description: 'Choose a saved workforce audit before loading.',
      });
      return;
    }

    setLoadingSavedAudits(true);
    try {
      const savedAudit = await getCommercialWorkforceAudit(selectedSavedAuditId);
      setAuditRows(savedAudit.rows);
      setWorkforceCsv(savedAudit.sourceCsv || SAMPLE_WORKFORCE_CSV);
      setAuditFileName(savedAudit.fileName);
      setSavedAuditAccessMessage(null);
      await loadWorkforceReviewQueue(savedAudit.id);
      toast({
        title: 'Saved audit loaded',
        description: `${savedAudit.fileName} restored with ${savedAudit.rowCount} role rows.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load workforce audit.';
      setSavedAuditAccessMessage(message);
      toast({
        title: 'Load failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingSavedAudits(false);
    }
  };

  const saveReviewMapping = async (row: CommercialWorkforceReviewRow) => {
    const socCode = (reviewSocDrafts[row.id] || '').trim();
    const reviewNotes = reviewNoteDrafts[row.id] || '';
    const reviewStatus = socCode ? 'reviewed' : 'unable_to_map';

    setUpdatingReviewRowId(row.id);
    try {
      const updatedRow = await updateCommercialWorkforceRowMapping({
        rowId: row.id,
        socCode,
        reviewStatus,
        reviewNotes,
      });

      setReviewRows((current) =>
        socCode
          ? current.filter((candidate) => candidate.id !== updatedRow.id)
          : current.map((candidate) => (candidate.id === updatedRow.id ? updatedRow : candidate))
      );
      setAuditRows((current) =>
        current.map((candidate) =>
          candidate.id === updatedRow.id
            ? {
              ...candidate,
              socCode: updatedRow.socCode || undefined,
              reviewStatus: updatedRow.reviewStatus,
              reviewNotes: updatedRow.reviewNotes || undefined,
              reviewedAt: updatedRow.reviewedAt,
            }
            : candidate
        )
      );
      setSavedAuditAccessMessage(null);
      toast({
        title: socCode ? 'SOC mapping saved' : 'Row marked for manual review',
        description: socCode
          ? `${updatedRow.role} mapped to ${updatedRow.socCode}.`
          : `${updatedRow.role} remains in the review queue.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save SOC mapping.';
      toast({
        title: 'Review update failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingReviewRowId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  const riskData = metrics
    ? [
      { name: 'Low Risk', value: metrics.risk_distribution.low_risk, color: COLORS.low },
      { name: 'Medium Risk', value: metrics.risk_distribution.medium_risk, color: COLORS.medium },
      { name: 'High Risk', value: metrics.risk_distribution.high_risk, color: COLORS.high },
    ]
    : [];
  const departmentChartData = departments.slice(0, 5);
  const riskDistributionSummary = riskData.length > 0
    ? riskData.map((item) => `${item.name}: ${item.value} employees`).join(', ')
    : 'No risk distribution data available.';
  const departmentRiskSummary = departmentChartData.length > 0
    ? departmentChartData
      .map((department) => `${department.department}: ${Math.round(department.avg_apo_score)} APO`)
      .join(', ')
    : 'No department data available.';

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workforce Planning Dashboard</h1>
          <p className="text-muted-foreground">
            Organization-wide automation risk analysis and insights
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <Button variant="outline" onClick={syncHRIS} disabled={syncing} className="w-full whitespace-normal sm:w-auto">
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync HRIS'}
          </Button>
          <Button onClick={exportReport} disabled={isGeneratingReport} className="w-full whitespace-normal sm:w-auto">
            {isGeneratingReport ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isGeneratingReport ? 'Generating...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{metrics?.total_employees || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg APO Score</p>
                <p className="text-2xl font-bold">
                  {metrics?.overall_apo_score?.toFixed(1) || 0}
                </p>
              </div>
            </div>
            <Progress value={metrics?.overall_apo_score || 0} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold">
                  {metrics?.risk_distribution.high_risk || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              employees with APO ≥ 70
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview" className="whitespace-normal">Overview</TabsTrigger>
          <TabsTrigger value="departments" className="whitespace-normal">Departments</TabsTrigger>
          <TabsTrigger value="employees" className="whitespace-normal">Employees</TabsTrigger>
          <TabsTrigger value="audit-builder" className="whitespace-normal">Audit Builder</TabsTrigger>
          <TabsTrigger value="opportunities" className="whitespace-normal">Automation Opportunities</TabsTrigger>
          <TabsTrigger value="roi" className="whitespace-normal">ROI Calculator</TabsTrigger>
          <TabsTrigger value="scenarios" className="whitespace-normal">Scenario Planner</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab
            riskData={riskData}
            riskDistributionSummary={riskDistributionSummary}
            departmentChartData={departmentChartData}
            departmentRiskSummary={departmentRiskSummary}
          />
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <DepartmentsTab
            departments={departments}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
          />
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>
                  Manage your workforce data and view individual automation scores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Employee Directory</h3>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  </div>

                  {/* CSV Importer Integration */}
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-medium mb-4">Bulk Import Employees</h4>
                    <CSVEmployeeImporter />
                  </div>

                  {/* Employee list placeholder - would be a data table here */}
                  <div className="rounded-md border">
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Employee list table will appear here. Use the importer above to add employees.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit-builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workforce CSV Audit Builder</CardTitle>
              <CardDescription>
                Upload or paste role-level CSV data to create a pilot-ready exposure rollup and executive report skeleton.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" htmlFor="workforce-audit-csv">
                      CSV upload
                    </label>
                    <input
                      id="workforce-audit-csv"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleWorkforceCsvUpload}
                      className="w-full rounded-md border p-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Current file: {auditFileName}
                    </p>
                  </div>
                  <Textarea
                    value={workforceCsv}
                    onChange={(event) => setWorkforceCsv(event.target.value)}
                    rows={10}
                    className="font-mono text-xs"
                    aria-label="Workforce audit CSV rows"
                  />
                  <Button onClick={generateWorkforceAudit} className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Audit Skeleton
                  </Button>
                  <Button type="button" variant="outline" onClick={exportWorkforceExecutiveReport} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Executive HTML Report
                  </Button>
                  <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">Persisted pilot artifact</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Save role rows, executive metrics, source versions, and the source CSV through the staff-gated Supabase workflow.
                      </p>
                    </div>
                    {savedAuditAccessMessage && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        {savedAuditAccessMessage}
                      </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        onClick={() => void saveWorkforceAudit()}
                        disabled={savingAudit}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {savingAudit ? 'Saving...' : 'Save Audit'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void loadSavedWorkforceAudits()}
                        disabled={loadingSavedAudits}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Select value={selectedSavedAuditId} onValueChange={setSelectedSavedAuditId}>
                        <SelectTrigger aria-label="Saved workforce audit">
                          <SelectValue placeholder="Saved audits" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No saved audit selected</SelectItem>
                          {savedAudits.map((record) => (
                            <SelectItem key={record.id} value={record.id}>
                              {formatSavedAuditLabel(record)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void loadSelectedWorkforceAudit()}
                        disabled={loadingSavedAudits || selectedSavedAuditId === 'none'}
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground">Headcount</p>
                        <p className="text-2xl font-bold">{auditSummary.totalHeadcount.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground">Weighted Exposure</p>
                        <p className="text-2xl font-bold">{auditSummary.weightedExposure.toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground">High-Risk Headcount</p>
                        <p className="text-2xl font-bold text-red-600">{auditSummary.highRiskHeadcount.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-xs text-muted-foreground">High-Risk Payroll</p>
                        <p className="text-2xl font-bold">${(auditSummary.highRiskPayroll / 1000000).toFixed(2)}M</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-2">Executive report skeleton</h4>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        This pilot audit covers {auditRows.length} role rows and {auditSummary.totalHeadcount.toLocaleString()} workers.
                        The weighted exposure score is {auditSummary.weightedExposure.toFixed(1)}%, with {auditSummary.highRiskHeadcount.toLocaleString()} workers in roles above APO 70.
                      </p>
                      <p>
                        Mapped rows: {auditSummary.mappedRows}. Rows needing SOC/O*NET review: {auditSummary.unmappedRows}.
                        Payroll requiring high-priority review: ${(auditSummary.highRiskPayroll / 1000000).toFixed(2)}M.
                      </p>
                      <p>
                        Deterministic SOC suggestion coverage: {auditSummary.suggestedRows} of {auditSummary.unmappedRows} unmapped rows
                        have a local suggestion at 50% confidence or higher; {auditSummary.highConfidenceSuggestedRows} are at 75% or higher.
                      </p>
                      <p>
                        Local SOC suggestion catalog: {socSuggestionCatalog.candidateCount} candidates across{' '}
                        {Object.keys(socSuggestionCatalog.sourceCounts).length} source buckets. This is a review aid,
                        not a licensed Lightcast or full O*NET crosswalk.
                      </p>
                      <p>
                        Recommended next step: validate job titles with HR, map unmapped roles to SOC/O*NET, then generate department-specific reskilling paths before any employment action.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="font-semibold">SOC/O*NET review queue</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review saved audit rows that lack a SOC code before treating exposure totals as client-ready. Suggestions are deterministic title matches and still require staff approval.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadWorkforceReviewQueue()}
                    disabled={loadingReviewRows}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {loadingReviewRows ? 'Loading...' : 'Refresh Queue'}
                  </Button>
                </div>

                {!staffUserId && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Sign in with a staff account to access saved audit review rows.
                  </div>
                )}

                {staffUserId && !loadingReviewRows && reviewRows.length === 0 && (
                  <div className="rounded-md border bg-slate-50 px-3 py-4 text-sm text-muted-foreground">
                    No unmapped rows in the current queue.
                  </div>
                )}

                {reviewRows.length > 0 && (
                  <div className="space-y-3">
                    {reviewRows.slice(0, 8).map((row) => {
                      const draftSocCode = reviewSocDrafts[row.id] || '';
                      const draftNotes = reviewNoteDrafts[row.id] || '';
                      const suggestions = suggestSocCodes({
                        role: row.role,
                        department: row.department,
                        limit: 3,
                      });

                      return (
                        <div key={row.id} className="grid gap-3 rounded-md border p-3 lg:grid-cols-[1.4fr_110px_180px_1fr_auto] lg:items-center">
                          <div className="space-y-2">
                            <div className="font-medium">{row.role}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.department} / {row.auditFileName}
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">Deterministic suggestions</div>
                              {suggestions.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {suggestions.map((suggestion) => (
                                    <Button
                                      key={`${row.id}-${suggestion.code}`}
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-auto px-2 py-1 text-left text-xs"
                                      onClick={() => {
                                        setReviewSocDrafts((current) => ({ ...current, [row.id]: suggestion.code }));
                                        setReviewNoteDrafts((current) => ({
                                          ...current,
                                          [row.id]: current[row.id] || `Suggested ${suggestion.title} (${suggestion.confidence}% confidence) from ${suggestion.source}.`,
                                        }));
                                      }}
                                      title={`${suggestion.reason} Source: ${suggestion.source}`}
                                    >
                                      <span className="font-mono">{suggestion.code}</span>
                                      <span className="ml-1 truncate">{suggestion.title}</span>
                                      <span className="ml-1 text-muted-foreground">({suggestion.confidence}%)</span>
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  No deterministic local match. Use manual O*NET review.
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">APO</div>
                            <Badge variant={row.apoScore >= 70 ? 'destructive' : row.apoScore >= 50 ? 'secondary' : 'outline'}>
                              {row.apoScore}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground" htmlFor={`soc-${row.id}`}>
                              SOC/O*NET code
                            </label>
                            <input
                              id={`soc-${row.id}`}
                              value={draftSocCode}
                              onChange={(event) =>
                                setReviewSocDrafts((current) => ({ ...current, [row.id]: event.target.value }))
                              }
                              placeholder="43-4051.00"
                              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground" htmlFor={`notes-${row.id}`}>
                              Review note
                            </label>
                            <input
                              id={`notes-${row.id}`}
                              value={draftNotes}
                              onChange={(event) =>
                                setReviewNoteDrafts((current) => ({ ...current, [row.id]: event.target.value }))
                              }
                              placeholder="Match rationale or blocker"
                              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void saveReviewMapping(row)}
                            disabled={updatingReviewRowId === row.id}
                          >
                            {updatingReviewRowId === row.id ? 'Saving' : draftSocCode.trim() ? 'Save Map' : 'Mark Review'}
                          </Button>
                        </div>
                      );
                    })}
                    {reviewRows.length > 8 && (
                      <p className="text-xs text-muted-foreground">
                        Showing 8 of {reviewRows.length} rows. Use the saved audit filter to narrow the queue.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-6 gap-2 bg-slate-100 px-4 py-2 text-xs font-semibold">
                  <span>Department</span>
                  <span className="col-span-2">Role</span>
                  <span>Headcount</span>
                  <span>APO</span>
                  <span>SOC</span>
                </div>
                {auditRows.slice(0, 8).map((row) => (
                  <div key={`${row.department}-${row.role}`} className="grid grid-cols-6 gap-2 border-t px-4 py-3 text-sm">
                    <span>{row.department}</span>
                    <span className="col-span-2">{row.role}</span>
                    <span>{row.headcount}</span>
                    <span>
                      <Badge variant={row.apoScore >= 70 ? 'destructive' : row.apoScore >= 50 ? 'secondary' : 'outline'}>
                        {row.apoScore}
                      </Badge>
                    </span>
                    <span>
                      {row.socCode ? (
                        <span className="font-mono text-xs">{row.socCode}</span>
                      ) : (() => {
                        const suggestion = suggestSocCodes({ role: row.role, department: row.department, limit: 1 })[0];
                        return suggestion ? (
                          <span className="block min-w-0">
                            <span className="block font-mono text-xs">{suggestion.code}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {suggestion.title} ({suggestion.confidence}%)
                            </span>
                          </span>
                        ) : 'Review';
                      })()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-semibold mb-2">Source and compliance boundary</div>
                <p className="mb-2">
                  Active sources: {getActiveReportSourceVersionSummary()}.
                  Adapter-ready sources are listed in report output until licensed or integrated.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {REPORT_TRUST_NOTICES.map((notice) => (
                    <li key={notice}>{notice}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <OpportunitiesTab opportunities={opportunities} />
        </TabsContent>

        {/* ROI Calculator Tab */}
        <TabsContent value="roi" className="space-y-6">
          <ROICalculatorTab
            roiParams={roiParams}
            setRoiParams={setRoiParams}
            calculateROI={calculateROI}
            roiLoading={roiLoading}
            roiResult={roiResult}
          />
        </TabsContent>

        {/* Scenario Planner Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <ScenariosTab utilityRoleTemplates={UTILITY_ROLE_TEMPLATES} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default EnterpriseTeamDashboard;
