import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export interface DepartmentData {
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

export interface DepartmentsTabProps {
  departments: DepartmentData[];
  selectedDepartment: string | null;
  setSelectedDepartment: (val: string | null) => void;
}

export function DepartmentsTab({ departments, selectedDepartment, setSelectedDepartment }: DepartmentsTabProps) {
  return (
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
  );
}
