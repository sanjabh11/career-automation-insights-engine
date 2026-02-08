import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    GitCompare,
    Download,
    TrendingUp,
    DollarSign,
    Briefcase,
    ArrowUpRight
} from 'lucide-react';
import { SelectedOccupation } from './APODashboard';
import { useMarketIntelligence } from '@/hooks/useMarketIntelligence';
import { useRelatedOccupations } from '@/hooks/useRelatedOccupations';

interface SidebarContentProps {
    selectedOccupation: SelectedOccupation | null;
    onAddToList: () => void;
    isAlreadySelected: boolean;
    mobile?: boolean;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
    selectedOccupation,
    onAddToList,
    isAlreadySelected,
    mobile = false
}) => {
    // Memoize the occupation code to prevent unnecessary re-queries
    const occupationCode = useMemo(() => selectedOccupation?.code || null, [selectedOccupation?.code]);

    // Fetch market intelligence and related occupations
    const { data: marketData, isLoading: marketLoading } = useMarketIntelligence(occupationCode);
    const { data: relatedOccs, isLoading: relatedLoading } = useRelatedOccupations(occupationCode);

    const riskLevel = useMemo(() => {
        if (!selectedOccupation) return 'low';
        return selectedOccupation.overallAPO >= 67 ? 'high' :
            selectedOccupation.overallAPO >= 34 ? 'medium' : 'low';
    }, [selectedOccupation]);

    const riskColor = useMemo(() => {
        return riskLevel === 'high' ? 'text-red-600' :
            riskLevel === 'medium' ? 'text-amber-600' : 'text-green-600';
    }, [riskLevel]);

    if (!selectedOccupation) {
        return (
            <div className="space-y-4">
                <Card className="p-6 glass-card">
                    <div className="text-center text-[var(--text-tertiary)]">
                        <p className="text-sm">Select an occupation to see contextual insights and actions</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 h-full overflow-y-auto pb-20 sm:pb-0">
            {/* Quick Actions Card */}
            <Card className={`glass-card p-6 ${mobile ? 'shadow-none border-0 bg-transparent p-0' : ''}`}>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">⚡ Quick Actions</h3>
                <div className="space-y-3">
                    <Button
                        className="w-full justify-start gap-2 shadow-md bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:from-[var(--accent-primary)]/90 hover:to-[var(--accent-secondary)]/90 text-white border-0"
                        size="lg"
                    >
                        <TrendingUp className="w-5 h-5" />
                        Create Career Plan
                    </Button>
                    <Button
                        onClick={onAddToList}
                        disabled={isAlreadySelected}
                        className="w-full justify-start gap-2"
                        variant={isAlreadySelected ? "secondary" : "outline"}
                    >
                        <Plus className="w-4 h-4" />
                        {isAlreadySelected ? 'Added to List' : 'Add to Compare List'}
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </Button>
                </div>
            </Card>

            {/* Key Insights Card */}
            <Card className={`glass-card p-6 ${mobile ? 'shadow-none border-0 bg-transparent p-0' : ''}`}>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">🎯 Key Insights</h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-[var(--text-tertiary)] mb-1">Automation Risk</p>
                        <p className={`text-2xl font-bold ${riskColor}`}>
                            {selectedOccupation.overallAPO}%
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1 capitalize">
                            {riskLevel} Risk Category
                        </p>
                    </div>

                    <div className="pt-3 border-t border-gray-700">
                        <p className="text-sm text-[var(--text-tertiary)] mb-2">Impact Timeline</p>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-[var(--text-tertiary)]">2025-27:</span>
                                <span className="font-medium">15-20% of tasks</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-tertiary)]">2028-30:</span>
                                <span className="font-medium">40-50% of tasks</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-tertiary)]">2031+:</span>
                                <span className="font-medium">60-70% of tasks</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Industry Context Card */}
            <Card className={`glass-card p-6 ${mobile ? 'shadow-none border-0 bg-transparent p-0' : ''}`}>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">📈 Industry Context</h3>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-[var(--text-tertiary)] mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-[var(--text-tertiary)]">Average Salary</p>
                            {marketLoading ? (
                                <div className="animate-pulse h-6 bg-[var(--bg-tertiary)] rounded w-32 mt-1"></div>
                            ) : marketData?.compensation?.baseSalary ? (
                                <>
                                    <p className="text-base font-semibold">
                                        ${Math.round(marketData.compensation.baseSalary.midLevel.min / 1000)}k - ${Math.round(marketData.compensation.baseSalary.midLevel.max / 1000)}k
                                    </p>
                                    <p className="text-xs text-[var(--text-tertiary)]">National Avg.</p>
                                </>
                            ) : (
                                <p className="text-sm text-[var(--text-tertiary)]">Data unavailable</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-[var(--text-tertiary)] mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-[var(--text-tertiary)]">Job Market</p>
                            {marketLoading ? (
                                <div className="animate-pulse h-6 bg-[var(--bg-tertiary)] rounded w-24 mt-1"></div>
                            ) : marketData?.futureOutlook?.jobGrowthRate !== undefined ? (
                                <>
                                    <p className="text-base font-semibold">
                                        {marketData.futureOutlook.jobGrowthRate > 0 ? '+' : ''}{marketData.futureOutlook.jobGrowthRate}% Growth
                                    </p>
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        {marketData.futureOutlook.jobGrowthRate > 5 ? 'High' : marketData.futureOutlook.jobGrowthRate > 0 ? 'Moderate' : 'Low'} Demand
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-[var(--text-tertiary)]">Data unavailable</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Related Occupations Card */}
            <Card className={`glass-card p-6 ${mobile ? 'shadow-none border-0 bg-transparent p-0' : ''}`}>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">💡 Related Careers</h3>
                <div className="space-y-2">
                    {relatedLoading ? (
                        <>
                            <div className="animate-pulse h-12 bg-[var(--bg-tertiary)] rounded-lg"></div>
                            <div className="animate-pulse h-12 bg-[var(--bg-tertiary)] rounded-lg"></div>
                            <div className="animate-pulse h-12 bg-[var(--bg-tertiary)] rounded-lg"></div>
                        </>
                    ) : relatedOccs && relatedOccs.length > 0 ? (
                        relatedOccs.map((occ) => (
                            <button
                                key={occ.code}
                                className="w-full text-left p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
                                onClick={() => {
                                    // TODO: Navigate to occupation or trigger selection
                                    console.log('Navigate to:', occ.code);
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">{occ.title}</span>
                                    <ArrowUpRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)]" />
                                </div>
                                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                                    {Math.round((occ.similarity_score || 0) * 100)}% Match
                                </p>
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-[var(--text-tertiary)] py-2">
                            No related careers found
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
};
