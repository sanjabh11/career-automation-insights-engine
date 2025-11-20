/**
 * Automation Scenario Simulator
 * Phase 4 - What-if analysis for automation decisions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Save,
  Copy,
  BarChart,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ScenarioAction {
  action_type: 'automate' | 'upskill' | 'hire' | 'eliminate';
  target_department?: string;
  target_soc?: string;
  target_role_name?: string;
  headcount_affected?: number;
  automation_details?: {
    technology: string;
    implementation_cost: number;
    annual_maintenance_cost: number;
    automation_percentage: number;
  };
  upskill_details?: {
    target_soc: string;
    training_cost_per_employee: number;
    duration_months: number;
  };
}

interface ScenarioResult {
  scenario_id: string;
  automation_impact: {
    roles_automated: number;
    roles_upskilled: number;
    roles_eliminated: number;
    implementation_cost: number;
    annual_savings: number;
    payback_period_months: number;
    five_year_roi_percent: number;
  };
  employee_impact: {
    high_risk_reduced: number;
    medium_risk_reduced: number;
    new_high_risk_created: number;
    organization_apo_after: number;
    apo_improvement: number;
  };
  cascading_effects: Array<{
    affected_role: string;
    impact: string;
    recommendation: string;
  }>;
  risks: Array<{
    risk: string;
    probability: string;
    mitigation: string;
  }>;
  recommendation: string;
}

export const AutomationScenarioSimulator = ({ orgId }: { orgId: string }) => {
  const { toast } = useToast();
  const [scenarioName, setScenarioName] = useState('');
  const [actions, setActions] = useState<ScenarioAction[]>([]);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [saving, setSaving] = useState(false);

  const addAction = (type: ScenarioAction['action_type']) => {
    const newAction: ScenarioAction = {
      action_type: type,
      headcount_affected: 10,
    };

    if (type === 'automate') {
      newAction.automation_details = {
        technology: 'AI Chatbot',
        implementation_cost: 250000,
        annual_maintenance_cost: 50000,
        automation_percentage: 70,
      };
    } else if (type === 'upskill') {
      newAction.upskill_details = {
        target_soc: '',
        training_cost_per_employee: 5000,
        duration_months: 6,
      };
    }

    setActions([...actions, newAction]);
  };

  const updateAction = (index: number, updates: Partial<ScenarioAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const runSimulation = async () => {
    if (!scenarioName || actions.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a scenario name and add at least one action',
        variant: 'destructive',
      });
      return;
    }

    setSimulating(true);

    try {
      const response = await fetch('/api/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          scenario_name: scenarioName,
          actions,
        }),
      });

      if (!response.ok) throw new Error('Simulation failed');

      const data = await response.json();
      setResult(data.results);

      toast({
        title: 'Simulation Complete',
        description: 'Review the results below',
      });
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: 'Simulation Failed',
        description: 'Failed to run scenario simulation',
        variant: 'destructive',
      });
    } finally {
      setSimulating(false);
    }
  };

  const saveScenario = async () => {
    if (!result) {
      toast({
        title: 'No Results',
        description: 'Run the simulation first before saving',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('automation_scenarios').insert({
        org_id: orgId,
        created_by: user.id,
        scenario_name: scenarioName,
        scenario_config: { actions },
        results: result,
        status: 'completed',
      });

      if (error) throw error;

      toast({
        title: 'Scenario Saved',
        description: 'Your scenario has been saved successfully',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save scenario',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getActionIcon = (type: ScenarioAction['action_type']) => {
    switch (type) {
      case 'automate':
        return <BarChart className="w-4 h-4" />;
      case 'upskill':
        return <TrendingUp className="w-4 h-4" />;
      case 'hire':
        return <Users className="w-4 h-4" />;
      case 'eliminate':
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600 dark:text-green-400';
    if (roi >= 100) return 'text-blue-600 dark:text-blue-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="space-y-6">
      {/* Scenario Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Build Scenario</CardTitle>
          <CardDescription>
            Create a what-if scenario by adding automation, upskilling, and workforce actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scenario Name */}
          <div>
            <Label htmlFor="scenario-name">Scenario Name</Label>
            <Input
              id="scenario-name"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., Automate Tier 1 Support"
            />
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addAction('automate')}>
                  <BarChart className="w-3 h-3 mr-1" />
                  Automate
                </Button>
                <Button size="sm" variant="outline" onClick={() => addAction('upskill')}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Upskill
                </Button>
                <Button size="sm" variant="outline" onClick={() => addAction('hire')}>
                  <Users className="w-3 h-3 mr-1" />
                  Hire
                </Button>
                <Button size="sm" variant="outline" onClick={() => addAction('eliminate')}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Eliminate
                </Button>
              </div>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                Add actions to build your scenario
              </div>
            ) : (
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getActionIcon(action.action_type)}
                        <Badge>{action.action_type}</Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeAction(index)}>
                        Remove
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Department</Label>
                        <Input
                          value={action.target_department || ''}
                          onChange={(e) =>
                            updateAction(index, { target_department: e.target.value })
                          }
                          placeholder="Customer Support"
                        />
                      </div>
                      <div>
                        <Label>Role/Title</Label>
                        <Input
                          value={action.target_role_name || ''}
                          onChange={(e) =>
                            updateAction(index, { target_role_name: e.target.value })
                          }
                          placeholder="Customer Service Representatives"
                        />
                      </div>
                      <div>
                        <Label>Headcount Affected</Label>
                        <Input
                          type="number"
                          value={action.headcount_affected || 0}
                          onChange={(e) =>
                            updateAction(index, {
                              headcount_affected: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      {action.action_type === 'automate' &&
                        action.automation_details && (
                          <>
                            <div>
                              <Label>Technology</Label>
                              <Select
                                value={action.automation_details.technology}
                                onValueChange={(val) =>
                                  updateAction(index, {
                                    automation_details: {
                                      ...action.automation_details!,
                                      technology: val,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AI Chatbot">AI Chatbot</SelectItem>
                                  <SelectItem value="RPA">RPA (Robotic Process Automation)</SelectItem>
                                  <SelectItem value="AI/ML System">AI/ML System</SelectItem>
                                  <SelectItem value="Workflow Automation">Workflow Automation</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Implementation Cost ($)</Label>
                              <Input
                                type="number"
                                value={action.automation_details.implementation_cost}
                                onChange={(e) =>
                                  updateAction(index, {
                                    automation_details: {
                                      ...action.automation_details!,
                                      implementation_cost: Number(e.target.value),
                                    },
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>Annual Maintenance ($)</Label>
                              <Input
                                type="number"
                                value={action.automation_details.annual_maintenance_cost}
                                onChange={(e) =>
                                  updateAction(index, {
                                    automation_details: {
                                      ...action.automation_details!,
                                      annual_maintenance_cost: Number(e.target.value),
                                    },
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label>Automation % (0-100)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={action.automation_details.automation_percentage}
                                onChange={(e) =>
                                  updateAction(index, {
                                    automation_details: {
                                      ...action.automation_details!,
                                      automation_percentage: Number(e.target.value),
                                    },
                                  })
                                }
                              />
                            </div>
                          </>
                        )}

                      {action.action_type === 'upskill' && action.upskill_details && (
                        <>
                          <div>
                            <Label>Target SOC Code</Label>
                            <Input
                              value={action.upskill_details.target_soc}
                              onChange={(e) =>
                                updateAction(index, {
                                  upskill_details: {
                                    ...action.upskill_details!,
                                    target_soc: e.target.value,
                                  },
                                })
                              }
                              placeholder="15-1252.00"
                            />
                          </div>
                          <div>
                            <Label>Training Cost per Employee ($)</Label>
                            <Input
                              type="number"
                              value={action.upskill_details.training_cost_per_employee}
                              onChange={(e) =>
                                updateAction(index, {
                                  upskill_details: {
                                    ...action.upskill_details!,
                                    training_cost_per_employee: Number(e.target.value),
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Duration (months)</Label>
                            <Input
                              type="number"
                              value={action.upskill_details.duration_months}
                              onChange={(e) =>
                                updateAction(index, {
                                  upskill_details: {
                                    ...action.upskill_details!,
                                    duration_months: Number(e.target.value),
                                  },
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={runSimulation} disabled={simulating || actions.length === 0}>
              <Play className="w-4 h-4 mr-2" />
              {simulating ? 'Simulating...' : 'Run Simulation'}
            </Button>
            {result && (
              <>
                <Button variant="outline" onClick={saveScenario} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Scenario'}
                </Button>
                <Button variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {result && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>
              Financial and employee impact analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="financial">
              <TabsList>
                <TabsTrigger value="financial">Financial Impact</TabsTrigger>
                <TabsTrigger value="employee">Employee Impact</TabsTrigger>
                <TabsTrigger value="risks">Risks & Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <DollarSign className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                        <p className="text-sm text-muted-foreground">Implementation Cost</p>
                        <p className="text-2xl font-bold">
                          ${(result.automation_impact.implementation_cost / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <TrendingUp className="w-8 h-8 mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-muted-foreground">Annual Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${(result.automation_impact.annual_savings / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                        <p className="text-sm text-muted-foreground">Payback Period</p>
                        <p className="text-2xl font-bold">
                          {result.automation_impact.payback_period_months} months
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">5-Year ROI</span>
                    <span
                      className={`text-3xl font-bold ${getROIColor(
                        result.automation_impact.five_year_roi_percent
                      )}`}
                    >
                      {result.automation_impact.five_year_roi_percent}%
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employee" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Workforce Changes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Roles Automated</span>
                        <span className="font-semibold">
                          {result.automation_impact.roles_automated}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Roles Upskilled</span>
                        <span className="font-semibold text-blue-600">
                          {result.automation_impact.roles_upskilled}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Roles Eliminated</span>
                        <span className="font-semibold text-red-600">
                          {result.automation_impact.roles_eliminated}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Risk Reduction</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">High Risk Reduced</span>
                        <span className="font-semibold text-green-600">
                          -{result.employee_impact.high_risk_reduced}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">New APO Score</span>
                        <span className="font-semibold">
                          {result.employee_impact.organization_apo_after.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">APO Improvement</span>
                        <span className="font-semibold text-primary">
                          {result.employee_impact.apo_improvement.toFixed(1)} points
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {result.cascading_effects.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Cascading Effects</h4>
                    <div className="space-y-2">
                      {result.cascading_effects.map((effect, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium">{effect.affected_role}</p>
                          <p className="text-muted-foreground mt-1">{effect.impact}</p>
                          <p className="text-primary mt-1">→ {effect.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="risks" className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold mb-2">Overall Recommendation</h4>
                  <p>{result.recommendation}</p>
                </div>

                {result.risks.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Identified Risks</h4>
                    <div className="space-y-3">
                      {result.risks.map((risk, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{risk.risk}</p>
                                <Badge variant="outline">{risk.probability} Probability</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                <strong>Mitigation:</strong> {risk.mitigation}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
