import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface AutomationOpportunity {
  occupation_title: string;
  soc_code: string;
  employee_count: number;
  avg_apo_score: number;
  total_payroll: number;
  automation_potential_savings: number;
  recommended_action: string;
}

export interface OpportunitiesTabProps {
  opportunities: AutomationOpportunity[];
}

export function OpportunitiesTab({ opportunities }: OpportunitiesTabProps) {
  return (
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
  );
}
