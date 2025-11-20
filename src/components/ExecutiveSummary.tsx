import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    icon: AlertTriangle,
                    headline: 'High Automation Risk Detected',
                    description: 'Significant portion of core tasks are susceptible to AI automation in the near term.'
                };
            case 'medium':
                return {
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-200',
                    icon: TrendingUp,
                    headline: 'Moderate Transformation Expected',
                    description: 'Role will evolve with AI integration. Reskilling is recommended to leverage new tools.'
                };
            case 'low':
                return {
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    icon: ShieldCheck,
                    headline: 'Low Automation Risk',
                    description: 'Core human skills in this role are currently difficult for AI to replicate.'
                };
            default:
                return {
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
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
            <Card className={`p-6 border-l-4 ${config.borderColor} shadow-lg bg-white/80 backdrop-blur-sm`}>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center justify-center p-1.5 rounded-full ${config.bgColor} ${config.color}`}>
                                <Icon className="w-5 h-5" />
                            </span>
                            <span className={`text-sm font-bold uppercase tracking-wider ${config.color}`}>
                                {riskLevel} Risk ({automationPercentage}%)
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900">
                            {config.headline}
                        </h2>

                        <p className="text-gray-600 max-w-2xl leading-relaxed">
                            {config.description} <span className="font-medium text-gray-900">"{occupationTitle}"</span> requires immediate attention to strategic skill development.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Primary Threat</p>
                        <p className="text-sm font-medium text-gray-900">Routine Data Processing</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Safe Zone</p>
                        <p className="text-sm font-medium text-gray-900">Complex Decision Making</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Recommended Action</p>
                        <p className="text-sm font-medium text-blue-600">Upskill in AI Management</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
