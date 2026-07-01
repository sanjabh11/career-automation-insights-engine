import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import {
  ResumeEvidenceBoundaryNote,
  getSeverityColor,
  type ResumeProofEvidenceCard,
} from '@/components/resume-ui';

interface AutomationPronePhrase {
  phrase: string;
  context: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

interface RewriteSuggestion {
  original: string;
  suggested: string;
  rationale: string;
}

export interface PhrasesAndRewritesProps {
  automationPronePhrases: AutomationPronePhrase[];
  rewriteSuggestions: RewriteSuggestion[];
  detectedSkills: string[];
  recommendedSkills: { skill: string; priority: string; reason: string }[];
  riskEvidenceCard: ResumeProofEvidenceCard | null;
  rewriteEvidenceCard: ResumeProofEvidenceCard | null;
  skillEvidenceCard: ResumeProofEvidenceCard | null;
}

export function PhrasesAndRewritesPanel(props: PhrasesAndRewritesProps) {
  const {
    automationPronePhrases, rewriteSuggestions, detectedSkills, recommendedSkills,
    riskEvidenceCard, rewriteEvidenceCard, skillEvidenceCard,
  } = props;

  return (
    <>
      {automationPronePhrases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Automation-Prone Phrases ({automationPronePhrases.length})
            </CardTitle>
            <CardDescription>
              These phrases signal routine work that may be automated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ResumeEvidenceBoundaryNote card={riskEvidenceCard} label="Phrase evidence" />
            {automationPronePhrases.map((phrase, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-red-800">"{phrase.phrase}"</span>
                  <Badge variant={getSeverityColor(phrase.severity)}>
                    {phrase.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Context:</strong> {phrase.context}
                </p>
                <p className="text-sm text-red-700">
                  <strong>Why risky:</strong> {phrase.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {rewriteSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-500" />
              Strategic Rewrites ({rewriteSuggestions.length})
            </CardTitle>
            <CardDescription>
              Improve your resume by emphasizing strategic and creative skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResumeEvidenceBoundaryNote card={rewriteEvidenceCard} label="Rewrite evidence" />
            {rewriteSuggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="p-3 bg-red-50 border-b">
                  <div className="flex items-center gap-2 text-sm text-red-800 mb-1">
                    <span className="font-semibold">❌ Before:</span>
                  </div>
                  <p className="text-red-900">{suggestion.original}</p>
                </div>
                <div className="p-3 bg-green-50">
                  <div className="flex items-center gap-2 text-sm text-green-800 mb-1">
                    <span className="font-semibold">✅ After:</span>
                  </div>
                  <p className="text-green-900 font-medium">{suggestion.suggested}</p>
                  <p className="text-sm text-green-700 mt-2">
                    <strong>Why better:</strong> {suggestion.rationale}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent-primary)]" />
              Detected Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {detectedSkills.slice(0, 15).map((skill, index) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[var(--accent-primary)]" />
              Recommended Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ResumeEvidenceBoundaryNote card={skillEvidenceCard} label="Skill recommendation evidence" />
              {recommendedSkills.slice(0, 5).map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Badge variant={rec.priority === 'high' ? 'default' : 'outline'} className="mt-0.5">
                    {rec.priority}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{rec.skill}</p>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
