import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (target <= 0) { setValue(0); return; }
    startRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

function AnimatedPercent({ value }: { value: number }) {
  const displayed = useCountUp(value);
  return <>{displayed}</>;
}

interface ExecutiveSummaryProps {
    occupationTitle: string;
    riskLevel: 'high' | 'medium' | 'low';
    automationPercentage: number;
    onViewDetails: () => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
    occupationTitle,
    riskLevel,
    automationPercentage,
    onViewDetails
}) => {
    const getRiskConfig = (level: string) => {
        switch (level) {
            case 'high':
                return {
                    color: 'text-[var(--accent-danger)]',
                    bgColor: 'bg-[var(--accent-danger)]/10',
                    borderColor: 'border-[var(--accent-danger)]/30',
                    icon: AlertTriangle,
                    headline: 'High Automation Risk Detected',
                    description: 'Significant portion of core tasks are susceptible to AI automation in the near term.'
                };
            case 'medium':
                return {
                    color: 'text-[var(--accent-warning)]',
                    bgColor: 'bg-[var(--accent-warning)]/10',
                    borderColor: 'border-[var(--accent-warning)]/30',
                    icon: TrendingUp,
                    headline: 'Moderate Transformation Expected',
                    description: 'Role will evolve with AI integration. Reskilling is recommended to leverage new tools.'
                };
            case 'low':
                return {
                    color: 'text-[var(--accent-success)]',
                    bgColor: 'bg-[var(--accent-success)]/10',
                    borderColor: 'border-[var(--accent-success)]/30',
                    icon: ShieldCheck,
                    headline: 'Low Automation Risk',
                    description: 'Core human skills in this role are currently difficult for AI to replicate.'
                };
            default:
                return {
                    color: 'text-[var(--text-secondary)]',
                    bgColor: 'bg-[var(--bg-hover)]',
                    borderColor: 'border-[hsl(var(--border))]',
                    icon: AlertTriangle,
                    headline: 'Analysis Complete',
                    description: 'Review the detailed breakdown below to understand automation impact.'
                };
        }
    };

    const config = getRiskConfig(riskLevel);
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className={`p-6 border-l-4 ${config.borderColor} shadow-lg bg-[var(--bg-secondary)] backdrop-blur-sm`}>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center justify-center p-1.5 rounded-full ${config.bgColor} ${config.color}`}>
                                <Icon className="w-5 h-5" />
                            </span>
                            <span className={`text-sm font-bold uppercase tracking-wider ${config.color}`} style={{ fontFamily: 'var(--font-mono)' }}>
                                {riskLevel} Risk (<AnimatedPercent value={automationPercentage} />%)
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                            {config.headline}
                        </h2>

                        <p className="text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                            {config.description} <span className="font-medium text-[var(--text-primary)]">"{occupationTitle}"</span> requires immediate attention to strategic skill development.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[hsl(var(--border))]">
                        <Button
                            onClick={onViewDetails}
                            className="w-full md:w-auto gap-2 shadow-md hover:shadow-lg transition-all"
                            size="lg"
                        >
                            View Detailed Analysis
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Key Takeaways Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[hsl(var(--border))]">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">Key Automation Area</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Routine Data Processing</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">Safe Zone</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">Complex Decision Making</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase">Recommended Action</p>
                        <p className="text-sm font-medium text-[var(--accent-primary)]">Upskill in AI Management</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
