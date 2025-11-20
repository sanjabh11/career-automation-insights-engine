
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EnhancedAPOVisualizationProps {
  categories: Array<{
    name: string;
    apo: number;
    confidence: string;
    data: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  }>;
  overallAPO: number;
  insights: {
    primary_opportunities: string[];
    main_challenges: string[];
    automation_drivers: string[];
    barriers: string[];
  };
}

export const EnhancedAPOVisualization = ({ 
  categories, 
  overallAPO,
  insights 
}: EnhancedAPOVisualizationProps) => {
  const getColor = (apo: number) => {
    if (apo >= 70) return '#dc2626'; // red-600
    if (apo >= 50) return '#d97706'; // yellow-600
    if (apo >= 30) return '#0891b2'; // cyan-600
    return '#16a34a'; // green-600
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const chartData = categories.map(category => ({
    name: category.name,
    apo: category.apo,
    confidence: category.confidence,
    color: getColor(category.apo)
  }));

  const pieData = categories.map(category => ({
    name: category.name,
    value: category.apo,
    fill: getColor(category.apo)
  }));

  const getRiskLevel = (apo: number) => {
    if (apo >= 70) return { level: 'High Risk', color: 'text-red-600' };
    if (apo >= 50) return { level: 'Medium-High Risk', color: 'text-orange-600' };
    if (apo >= 30) return { level: 'Medium Risk', color: 'text-yellow-600' };
    return { level: 'Low Risk', color: 'text-green-600' };
  };

  const riskAssessment = getRiskLevel(overallAPO);

  return (
    <div className="space-y-6">
      {/* Overall APO Score with Enhanced Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Enhanced APO Score</h3>
            <p className="text-gray-600">Advanced AI-calculated automation potential</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{overallAPO.toFixed(1)}%</div>
            <div className={`text-sm font-medium ${riskAssessment.color}`}>
              {riskAssessment.level}
            </div>
          </div>
        </div>
        <Progress value={overallAPO} className="h-3 mb-2" />
      </div>

      {/* Category Breakdown with Confidence Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold mb-4">Category Analysis</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'APO (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number, name, props) => [
                    `${value.toFixed(1)}%`, 
                    'APO',
                    `Confidence: ${props.payload.confidence}`
                  ]}
                  labelFormatter={(label) => `${label} Category`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="apo" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Distribution Overview</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'APO']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confidence Indicators */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Analysis Confidence</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center space-x-2">
              <span className="text-sm font-medium">{category.name}:</span>
              <Badge className={getConfidenceColor(category.confidence)}>
                {category.confidence} confidence
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-green-800 mb-3">Automation Opportunities</h4>
          <ul className="space-y-2">
            {insights.primary_opportunities.map((opportunity, index) => (
              <li key={index} className="text-sm text-green-700 flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                {opportunity}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-red-800 mb-3">Key Challenges</h4>
          <ul className="space-y-2">
            {insights.main_challenges.map((challenge, index) => (
              <li key={index} className="text-sm text-red-700 flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                {challenge}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Automation Drivers and Barriers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold mb-3">Automation Drivers</h4>
          <div className="flex flex-wrap gap-2">
            {[...new Set(insights.automation_drivers)].slice(0, 8).map((driver, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                {driver}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3">Automation Barriers</h4>
          <div className="flex flex-wrap gap-2">
            {[...new Set(insights.barriers)].slice(0, 8).map((barrier, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                {barrier}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
