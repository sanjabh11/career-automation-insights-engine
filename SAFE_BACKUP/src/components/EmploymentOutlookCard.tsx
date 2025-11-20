import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  formatWage, 
  formatEmploymentChange, 
  getOutlookCategoryColor 
} from '@/types/onet-enrichment';
import { useEmploymentOutlook, useWageData } from '@/hooks/useOnetEnrichment';
import { LoadingSpinner } from './LoadingSpinner';

interface EmploymentOutlookCardProps {
  occupationCode: string;
  occupationTitle: string;
}

export const EmploymentOutlookCard: React.FC<EmploymentOutlookCardProps> = ({
  occupationCode,
  occupationTitle,
}) => {
  const { employmentData, isLoading: employmentLoading } = useEmploymentOutlook(occupationCode);
  const { wageData, isLoading: wageLoading } = useWageData(occupationCode);

  if (employmentLoading || wageLoading) {
    return (
      <Card className="p-6">
        <LoadingSpinner text="Loading employment data..." />
      </Card>
    );
  }

  if (!employmentData && !wageData) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>Employment outlook data not available</p>
      </Card>
    );
  }

  const getChangeIcon = (percent?: number) => {
    if (!percent) return <Minus className="h-5 w-5 text-gray-500" />;
    if (percent > 0) return <ArrowUpRight className="h-5 w-5 text-green-600" />;
    if (percent < 0) return <ArrowDownRight className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getGrowthColor = (rate?: string) => {
    if (!rate) return 'text-gray-600';
    const lower = rate.toLowerCase();
    if (lower.includes('much faster') || lower.includes('rapid')) return 'text-green-600';
    if (lower.includes('faster')) return 'text-blue-600';
    if (lower.includes('average') || lower.includes('about as fast')) return 'text-yellow-600';
    if (lower.includes('slower') || lower.includes('decline')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Employment Outlook</h3>
              <p className="text-sm text-muted-foreground mt-1">{occupationTitle}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>

          {/* Growth Rate */}
          {employmentData?.growthRate && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Growth Rate</p>
                  <p className={`text-xl font-bold mt-1 ${getGrowthColor(employmentData.growthRate)}`}>
                    {employmentData.growthRate}
                  </p>
                </div>
                {employmentData.outlookCategory && (
                  <Badge className={`${getOutlookCategoryColor(employmentData.outlookCategory)} border`}>
                    {employmentData.outlookCategory}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Employment Change */}
            {employmentData?.changePercent !== undefined && (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  {getChangeIcon(employmentData.changePercent)}
                  <p className="text-xs font-medium text-gray-600">Employment Change</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatEmploymentChange(employmentData.changePercent)}
                </p>
                {employmentData.current && employmentData.projected && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {employmentData.current.toLocaleString()} → {employmentData.projected.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Annual Openings */}
            {employmentData?.annualOpenings && (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <p className="text-xs font-medium text-gray-600">Annual Openings</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {employmentData.annualOpenings.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per year (avg)</p>
              </div>
            )}

            {/* Median Salary */}
            {wageData?.annualMedian && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <p className="text-xs font-medium text-gray-600">Median Salary</p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatWage(wageData.annualMedian)}
                </p>
                {wageData.hourlyMedian && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatWage(wageData.hourlyMedian)}/hour
                  </p>
                )}
              </div>
            )}

            {/* Wage Range */}
            {wageData?.rangeLow && wageData?.rangeHigh && (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <p className="text-xs font-medium text-gray-600">Wage Range</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatWage(wageData.rangeLow)} - {formatWage(wageData.rangeHigh)}
                </p>
                <Progress 
                  value={50} 
                  className="mt-2 h-2"
                />
              </div>
            )}
          </div>

          {/* Data Source Footer */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-muted-foreground text-center">
              Data sourced from O*NET Online • Updated regularly
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
