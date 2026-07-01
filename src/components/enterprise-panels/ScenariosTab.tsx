import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, Target } from 'lucide-react';

export interface UtilityRoleTemplate {
  role: string;
  soc_code: string;
  department: string;
  grid_modernization_skills: string[];
  reskilling_focus: string;
}

export interface ScenariosTabProps {
  utilityRoleTemplates: UtilityRoleTemplate[];
}

export function ScenariosTab({ utilityRoleTemplates }: ScenariosTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilities Workforce Audit Starter</CardTitle>
        <CardDescription>
          Role templates and grid-modernization skill gaps for a utilities/energy workforce audit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-900">
          This is a starter package, not a completed utility audit. Use it to seed role mapping and buyer demos; a sellable version still needs persisted CSV imports, unmapped-row review, deterministic ROI, and an executive report.
        </div>
        <div className="grid gap-4">
          {utilityRoleTemplates.map((template) => (
            <div key={template.soc_code} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline">{template.soc_code}</Badge>
                    <Badge variant="secondary">{template.department}</Badge>
                  </div>
                  <h4 className="font-semibold">{template.role}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{template.reskilling_focus}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end md:max-w-md">
                  {template.grid_modernization_skills.map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Target className="w-5 h-5 text-[var(--accent-primary)] mb-2" />
              <p className="font-medium">Mapping Input</p>
              <p className="text-sm text-muted-foreground">CSV rows should map job title, department, headcount, wage, and SOC code.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <DollarSign className="w-5 h-5 text-green-600 mb-2" />
              <p className="font-medium">ROI Formula</p>
              <p className="text-sm text-muted-foreground">Use training cost, wage, time-to-proficiency, risk reduction, retention, and avoided hiring cost.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <FileText className="w-5 h-5 text-[var(--accent-primary)] mb-2" />
              <p className="font-medium">Report Output</p>
              <p className="text-sm text-muted-foreground">Executive reports must label O*NET, BLS/OEWS, job posting, macro, and AI-generated sources.</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
