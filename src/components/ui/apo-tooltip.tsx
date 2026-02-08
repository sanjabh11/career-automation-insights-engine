import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lightbulb, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface APOTooltipProps {
  children: React.ReactNode;
  score: number;
  category?: 'tasks' | 'skills' | 'knowledge' | 'abilities' | 'technologies' | 'overall';
  showAnalogy?: boolean;
}

// Get risk level from score
const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score <= 33) return 'low';
  if (score <= 66) return 'medium';
  return 'high';
};

// Get analogy based on score and category
const getAnalogy = (score: number, category: string): string => {
  const risk = getRiskLevel(score);
  
  const analogies: Record<string, Record<string, string>> = {
    low: {
      tasks: "Like a skilled surgeon - AI assists but human judgment is essential",
      skills: "Like learning to ride a bike - once mastered, stays relevant for years",
      knowledge: "Like understanding human psychology - deeply contextual and nuanced",
      abilities: "Like creative problem-solving - uniquely human capabilities",
      technologies: "Like using a calculator - tools that enhance rather than replace",
      overall: "Like a master craftsperson - AI is a tool in your toolkit, not a replacement",
    },
    medium: {
      tasks: "Like a pilot with autopilot - AI handles routine, you handle exceptions",
      skills: "Like learning a new language - valuable but needs continuous updating",
      knowledge: "Like market trends - useful today but evolving rapidly",
      abilities: "Like data analysis - AI can assist but interpretation matters",
      technologies: "Like spreadsheets - powerful automation but still needs oversight",
      overall: "Like a co-pilot arrangement - working alongside AI, not against it",
    },
    high: {
      tasks: "Like assembly line work - highly repetitive and pattern-based",
      skills: "Like memorizing facts - easily replicated by AI systems",
      knowledge: "Like following a recipe - structured and algorithmic",
      abilities: "Like data entry - rule-based and automatable",
      technologies: "Like early computing - ripe for next-gen AI disruption",
      overall: "Like a canary in the coal mine - early warning to upskill now",
    },
  };

  return analogies[risk][category] || analogies[risk].overall;
};

// Get recommendation based on score
const getRecommendation = (score: number): string => {
  const risk = getRiskLevel(score);
  
  switch (risk) {
    case 'low':
      return "Focus on deepening expertise and mentoring others";
    case 'medium':
      return "Consider learning AI-adjacent skills to stay ahead";
    case 'high':
      return "Prioritize upskilling in human-centric or AI-collaborative roles";
  }
};

export function APOTooltip({ 
  children, 
  score, 
  category = 'overall',
  showAnalogy = true 
}: APOTooltipProps) {
  const risk = getRiskLevel(score);
  const analogy = getAnalogy(score, category);
  const recommendation = getRecommendation(score);

  const riskConfig = {
    low: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      icon: CheckCircle,
      label: 'Low Risk',
    },
    medium: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      icon: AlertTriangle,
      label: 'Medium Risk',
    },
    high: {
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      icon: AlertTriangle,
      label: 'High Risk',
    },
  };

  const config = riskConfig[risk];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className={`max-w-xs p-4 bg-slate-900/95 backdrop-blur-xl border ${config.borderColor} rounded-xl shadow-xl`}
        >
          <div className="space-y-3">
            {/* Header with score */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${config.color}`}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">{score}%</div>
            </div>

            {/* Analogy */}
            {showAnalogy && (
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-300 leading-relaxed">{analogy}</p>
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">{recommendation}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simple risk badge component
export function RiskBadge({ score, size = 'default' }: { score: number; size?: 'sm' | 'default' | 'lg' }) {
  const risk = getRiskLevel(score);
  
  const config = {
    low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Low' },
    medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Medium' },
    high: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', label: 'High' },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const c = config[risk];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${c.bg} ${c.text} ${c.border} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-', 'bg-')}`} />
      {c.label} Risk
    </span>
  );
}
