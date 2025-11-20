/**
 * Enterprise Team Dashboard
 * Phase 4 - Workforce planning and automation risk analysis for organizations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Settings,
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

const COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
};

const EnterpriseTeamDashboard = ({ orgId }: { orgId: string }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState<OrgMetrics | null>(null);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [opportunities, setOpportunities] = useState<AutomationOpportunity[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [roiResult, setRoiResult] = useState<any>(null);
  const [roiLoading, setRoiLoading] = useState(false);
  const [roiParams, setRoiParams] = useState({
    employeeCount: 100,
    avgSalary: 80000,
    trainingCost: 5000,
  });

  useEffect(() => {
    loadDashboard();
  }, [orgId]);

  const loadDashboard = async () => {
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
  };

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
      setTimeout(loadDashboard, 1000);
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
      setRoiResult(data);

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workforce Planning Dashboard</h1>
          <p className="text-muted-foreground">
            Organization-wide automation risk analysis and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncHRIS} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync HRIS'}
          </Button>
          <Button onClick={exportReport} disabled={isGeneratingReport}>
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
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="opportunities">Automation Opportunities</TabsTrigger>
          <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Planner</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Risk Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>
                  Employee distribution by automation risk level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department APO Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Department Risk Levels</CardTitle>
                <CardDescription>
                  Average APO score by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departments.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avg_apo_score" fill="#8b5cf6" name="Avg APO Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Department Analysis</CardTitle>
                  <CardDescription>
                    Detailed breakdown by department
                  </CardDescription>
                </div>
                <Select value={selectedDepartment || 'all'} onValueChange={(val) => {
                  setSelectedDepartment(val === 'all' ? null : val);
                  loadDashboard();
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.department} value={dept.department}>
                        {dept.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept.department} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{dept.department}</h4>
                        <p className="text-sm text-muted-foreground">
                          {dept.employee_count} employees
                        </p>
                      </div>
                      <Badge
                        variant={
                          dept.avg_apo_score >= 70
                            ? 'destructive'
                            : dept.avg_apo_score >= 50
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        APO: {dept.avg_apo_score.toFixed(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">High Risk</p>
                        <p className="text-lg font-semibold text-red-600">
                          {dept.high_risk_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Medium Risk</p>
                        <p className="text-lg font-semibold text-amber-600">
                          {dept.medium_risk_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Low Risk</p>
                        <p className="text-lg font-semibold text-green-600">
                          {dept.low_risk_count}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Total Payroll:</span>
                        <span className="font-semibold">
                          ${(dept.total_payroll / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Automation Potential:</span>
                        <span className="font-semibold text-primary">
                          ${(dept.automation_savings_potential / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

        {/* Automation Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Automation Opportunities</CardTitle>
              <CardDescription>
                Roles with highest automation potential and savings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opp, index) => (
                  <div key={opp.soc_code} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{opp.occupation_title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            SOC: {opp.soc_code} • {opp.employee_count} employees
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">
                              APO: {opp.avg_apo_score.toFixed(1)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Payroll: ${(opp.total_payroll / 1000).toFixed(0)}K
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              Potential Savings: ${(opp.automation_potential_savings / 1000).toFixed(0)}K
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          opp.recommended_action.includes('High')
                            ? 'destructive'
                            : opp.recommended_action.includes('Medium')
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {opp.recommended_action.split(' - ')[0]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 ml-12">
                      {opp.recommended_action.split(' - ')[1]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Calculator Tab */}
        <TabsContent value="roi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning ROI Calculator</CardTitle>
              <CardDescription>
                Calculate the potential return on investment for employee reskilling programs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Number of Employees to Reskill</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={roiParams.employeeCount}
                      onChange={(e) => setRoiParams({ ...roiParams, employeeCount: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Average Annual Salary ($)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={roiParams.avgSalary}
                      onChange={(e) => setRoiParams({ ...roiParams, avgSalary: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Training Cost per Employee ($)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={roiParams.trainingCost}
                      onChange={(e) => setRoiParams({ ...roiParams, trainingCost: Number(e.target.value) })}
                    />
                  </div>
                  <Button onClick={calculateROI} disabled={roiLoading} className="w-full">
                    {roiLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
                    Calculate ROI
                  </Button>
                </div>

                <div className="bg-slate-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Projected ROI Analysis</h3>
                  {roiResult ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded border">
                        <span className="text-sm text-muted-foreground">Total Investment</span>
                        <span className="font-bold">${roiResult.totalInvestment?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded border">
                        <span className="text-sm text-muted-foreground">Projected Savings (1 Year)</span>
                        <span className="font-bold text-green-600">${roiResult.projectedSavings?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded border">
                        <span className="text-sm text-muted-foreground">ROI Percentage</span>
                        <span className="font-bold text-blue-600">{roiResult.roiPercentage}%</span>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{roiResult.analysis}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
                      <p>Enter parameters and click Calculate to see ROI projections.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario Planner Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Scenario Planner</CardTitle>
              <CardDescription>
                Model what-if scenarios for automation and reskilling decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Scenario planner coming soon
                </p>
                <Button>Create New Scenario</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseTeamDashboard;
