/**
 * Learning Path ROI Calculator
 * Phase 2 Feature - Calculate financial return on learning investments
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Calculator,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ROICalculatorProps {
  currentOccupation?: string;
  targetOccupation?: string;
  currentSalary?: number;
}

interface Course {
  id: string;
  title: string;
  provider: string;
  price: number;
  duration_hours: number;
  rating: number;
  url: string;
}

interface ROIResult {
  totalInvestment: number;
  salaryIncrease: number;
  lifetimeEarningsIncrease: number;
  paybackPeriodMonths: number;
  fiveYearROI: number;
  tenYearROI: number;
  netPresentValue: number;
  riskAdjustedROI: number;
  recommendation: string;
  confidenceScore: number;
}

export const LearningPathROICalculator = ({
  currentOccupation,
  targetOccupation,
  currentSalary: initialSalary,
}: ROICalculatorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Form state
  const [currentSoc, setCurrentSoc] = useState(currentOccupation || '');
  const [targetSoc, setTargetSoc] = useState(targetOccupation || '');
  const [currentSalary, setCurrentSalary] = useState(initialSalary || 50000);
  const [learningCosts, setLearningCosts] = useState({
    tuition: 5000,
    materials: 500,
    lostWagesMonths: 0,
  });
  const [location, setLocation] = useState('United States (National Average)');

  // Results
  const [roiResult, setRoiResult] = useState<ROIResult | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);

  const calculateROI = async () => {
    if (!currentSoc || !targetSoc) {
      toast({
        title: 'Missing Information',
        description: 'Please select both current and target occupations',
        variant: 'destructive',
      });
      return;
    }

    setCalculating(true);

    try {
      // Call Supabase Edge Function for ROI calculation
      const response = await fetch('/api/calculate-learning-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSoc,
          targetSoc,
          currentSalary,
          learningCosts,
          location,
        }),
      });

      if (!response.ok) throw new Error('Calculation failed');

      const result = await response.json();
      setRoiResult(result.roi);
      setRecommendedCourses(result.recommendedCourses || []);

      // Save to learning paths
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_learning_paths').insert({
          user_id: user.id,
          current_soc: currentSoc,
          target_soc: targetSoc,
          estimated_duration_months: Math.ceil(
            (learningCosts.tuition + learningCosts.materials) / 1000
          ),
          estimated_cost: learningCosts.tuition + learningCosts.materials,
          roi_analysis: result.roi,
        });
      }
    } catch (error) {
      console.error('ROI calculation error:', error);
      toast({
        title: 'Calculation Error',
        description: 'Failed to calculate ROI. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRecommendationColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600 dark:text-green-400';
    if (roi >= 100) return 'text-blue-600 dark:text-blue-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  const getRecommendationBadge = (roi: number) => {
    if (roi >= 200) return { label: 'STRONG BUY', variant: 'default' as const };
    if (roi >= 100) return { label: 'BUY', variant: 'secondary' as const };
    return { label: 'CONSIDER', variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Learning Path ROI Calculator
          </CardTitle>
          <CardDescription>
            Calculate the financial return on your career transition investment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Occupation Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current-occupation">Current Occupation</Label>
              <Select value={currentSoc} onValueChange={setCurrentSoc}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your current occupation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="43-4051.00">Customer Service Representatives</SelectItem>
                  <SelectItem value="41-2031.00">Retail Salespersons</SelectItem>
                  <SelectItem value="43-6014.00">Secretaries and Admin Assistants</SelectItem>
                  <SelectItem value="53-3032.00">Heavy Truck Drivers</SelectItem>
                  <SelectItem value="11-1021.00">General and Operations Managers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target-occupation">Target Occupation</Label>
              <Select value={targetSoc} onValueChange={setTargetSoc}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your target occupation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15-1252.00">Software Developers</SelectItem>
                  <SelectItem value="29-2071.00">Medical Records Specialists</SelectItem>
                  <SelectItem value="13-1111.00">Management Analysts</SelectItem>
                  <SelectItem value="15-1244.00">Network and Computer Systems Administrators</SelectItem>
                  <SelectItem value="25-9031.00">Instructional Coordinators</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Financial Inputs */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="current-salary">Current Annual Salary</Label>
              <Input
                id="current-salary"
                type="number"
                value={currentSalary}
                onChange={(e) => setCurrentSalary(Number(e.target.value))}
                placeholder="50000"
              />
            </div>

            <div>
              <Label htmlFor="tuition">Training Cost</Label>
              <Input
                id="tuition"
                type="number"
                value={learningCosts.tuition}
                onChange={(e) =>
                  setLearningCosts((prev) => ({
                    ...prev,
                    tuition: Number(e.target.value),
                  }))
                }
                placeholder="5000"
              />
            </div>

            <div>
              <Label htmlFor="materials">Materials & Fees</Label>
              <Input
                id="materials"
                type="number"
                value={learningCosts.materials}
                onChange={(e) =>
                  setLearningCosts((prev) => ({
                    ...prev,
                    materials: Number(e.target.value),
                  }))
                }
                placeholder="500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location Adjustment</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States (National Average)">
                  United States (National Average)
                </SelectItem>
                <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
                <SelectItem value="New York, NY">New York, NY</SelectItem>
                <SelectItem value="Seattle, WA">Seattle, WA</SelectItem>
                <SelectItem value="Austin, TX">Austin, TX</SelectItem>
                <SelectItem value="Denver, CO">Denver, CO</SelectItem>
                <SelectItem value="Calgary, AB">Calgary, AB (Canada)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={calculateROI}
            disabled={calculating || !currentSoc || !targetSoc}
            className="w-full"
            size="lg"
          >
            {calculating ? 'Calculating...' : 'Calculate ROI'}
          </Button>
        </CardContent>
      </Card>

      {/* ROI Results */}
      {roiResult && (
        <>
          {/* Summary Card */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Investment Analysis</CardTitle>
                <Badge {...getRecommendationBadge(roiResult.fiveYearROI)}>
                  {getRecommendationBadge(roiResult.fiveYearROI).label}
                </Badge>
              </div>
              <CardDescription>{roiResult.recommendation}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Metrics Grid */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Total Investment
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(roiResult.totalInvestment)}
                  </div>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Salary Increase
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{formatCurrency(roiResult.salaryIncrease)}
                  </div>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Payback Period
                  </div>
                  <div className="text-2xl font-bold">
                    {roiResult.paybackPeriodMonths} months
                  </div>
                </div>
              </div>

              {/* ROI Timeline */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">5-Year ROI</span>
                  <span className={`text-lg font-bold ${getRecommendationColor(roiResult.fiveYearROI)}`}>
                    {roiResult.fiveYearROI}%
                  </span>
                </div>
                <Progress value={Math.min(roiResult.fiveYearROI / 5, 100)} />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">10-Year ROI</span>
                  <span className={`text-lg font-bold ${getRecommendationColor(roiResult.tenYearROI)}`}>
                    {roiResult.tenYearROI}%
                  </span>
                </div>
                <Progress value={Math.min(roiResult.tenYearROI / 10, 100)} />
              </div>

              {/* Additional Metrics */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Net Present Value (10yr)
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(roiResult.netPresentValue)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Risk-Adjusted ROI
                    </div>
                    <div className="font-semibold">
                      {roiResult.riskAdjustedROI}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Lifetime Earnings Increase
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(roiResult.lifetimeEarningsIncrease)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Confidence Score
                    </div>
                    <div className="font-semibold">
                      {(roiResult.confidenceScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Courses */}
          {recommendedCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Recommended Learning Path
                </CardTitle>
                <CardDescription>
                  Top courses to achieve your career transition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedCourses.map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold">{course.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {course.provider}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {formatCurrency(course.price)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {course.duration_hours}h
                          </span>
                          <span className="flex items-center gap-1">
                            ⭐ {course.rating.toFixed(1)}
                          </span>
                        </div>
                        <Button
                          variant="link"
                          className="px-0 mt-2"
                          onClick={() => window.open(course.url, '_blank')}
                        >
                          View Course →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
