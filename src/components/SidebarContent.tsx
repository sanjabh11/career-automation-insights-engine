import React from 'react';
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
    if (!selectedOccupation) {
        return (
            <div className="space-y-4">
                <Card className="p-6 rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl">
                    <div className="text-center text-gray-500">
                        <p className="text-sm">Select an occupation to see contextual insights and actions</p>
                    </div>
                </Card>
            </div>
        );
    }

    const riskLevel = selectedOccupation.overallAPO >= 67 ? 'high' :
        selectedOccupation.overallAPO >= 34 ? 'medium' : 'low';

    const riskColor = riskLevel === 'high' ? 'text-red-600' :
        riskLevel === 'medium' ? 'text-amber-600' : 'text-green-600';

    return (
        <div className="space-y-4 h-full overflow-y-auto pb-20 sm:pb-0">
            {/* Quick Actions Card */}
            <Card className={`p-6 rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl ${mobile ? 'shadow-none border-0 bg-transparent p-0' : ''}`}>
                <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
                <div className="space-y-3">
                    <Button
                        className="w-full justify-start gap-2 shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
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
            <Card className={`p-6 rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl ${mobile ? 'shadow-none border-0 bg-transparent p-0' : ''}`}>
                <h3 className="text-lg font-semibold mb-4">🎯 Key Insights</h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Automation Risk</p>
                        <p className={`text-2xl font-bold ${riskColor}`}>
                            {selectedOccupation.overallAPO}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                            {riskLevel} Risk Category
                        </p>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Impact Timeline</p>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-600">2025-27:</span>
                                <span className="font-medium">15-20% of tasks</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">2028-30:</span>
                                <span className="font-medium">40-50% of tasks</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">2031+:</span>
                                <span className="font-medium">60-70% of tasks</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Industry Context Card */}
            <Card className={`p-6 rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl ${mobile ? 'shadow-none border-0 bg-transparent p-0' : ''}`}>
                <h3 className="text-lg font-semibold mb-4">📈 Industry Context</h3>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-600">Average Salary</p>
                            <p className="text-base font-semibold">$95k - $140k</p>
                            <p className="text-xs text-gray-500">National Avg.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-600">Job Market</p>
                            <p className="text-base font-semibold">+12% Growth</p>
                            <p className="text-xs text-gray-500">High Demand</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Related Occupations Card */}
            <Card className={`p-6 rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl ${mobile ? 'shadow-none border-0 bg-transparent p-0' : ''}`}>
                <h3 className="text-lg font-semibold mb-4">💡 Related Careers</h3>
                <div className="space-y-2">
                    <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Data Scientist</span>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">92% Match</p>
                    </button>

                    <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">AI Ethics Specialist</span>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">88% Match</p>
                    </button>

                    <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Machine Learning Engineer</span>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">85% Match</p>
                    </button>
                </div>
            </Card>
        </div>
    );
};
