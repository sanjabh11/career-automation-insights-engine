import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, BookOpen, Award, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BridgeRolePathwayProps {
    originSoc?: string;
    destinationSoc?: string;
}

interface BridgePathData {
    origin_soc: string;
    origin_title?: string;
    destination_soc: string;
    destination_title?: string;
    path_socs: string[];
    path_titles?: string[];
    skill_overlaps: number[];
    avg_skill_overlap: number;
    total_distance: number;
    path_length: number;
    feasibility_score: number;
    transitions?: Array<{
        from_soc: string;
        to_soc: string;
        overlap: number;
        missing_skills?: string[];
        courses?: string[];
    }>;
}

export default function BridgeRolePathway({
    originSoc: initialOrigin,
    destinationSoc: initialDestination
}: BridgeRolePathwayProps) {
    const [originSoc, setOriginSoc] = useState(initialOrigin || '');
    const [destinationSoc, setDestinationSoc] = useState(initialDestination || '');
    const [searchLoading, setSearchLoading] = useState(false);
    const [pathData, setPathData] = useState<BridgePathData | null>(null);
    const { toast } = useToast();

    const findBridgeRoles = async () => {
        if (!originSoc || !destinationSoc) {
            toast({
                title: 'Missing Information',
                description: 'Please provide both origin and destination occupations',
                variant: 'destructive'
            });
            return;
        }

        setSearchLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('find-bridge-roles', {
                body: {
                    origin_soc: originSoc,
                    destination_soc: destinationSoc,
                    max_path_length: 3
                }
            });

            if (error) throw error;

            if (data && data.success) {
                setPathData(data.path);

                toast({
                    title: 'Path Found!',
                    description: `Found ${data.path.path_length === 0 ? 'direct' : data.path.path_length + '-step'} transition path`,
                });
            } else {
                toast({
                    title: 'No Path Found',
                    description: data.error || 'No feasible transition path found',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            console.error('Error finding bridge roles:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to find bridge roles',
                variant: 'destructive'
            });
        } finally {
            setSearchLoading(false);
        }
    };

    const getRiskLevel = (score: number) => {
        if (score >= 70) return { label: 'High Feasibility', color: 'bg-green-500' };
        if (score >= 50) return { label: 'Moderate Feasibility', color: 'bg-yellow-500' };
        return { label: 'Low Feasibility', color: 'bg-red-500' };
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Career Bridge Role Finder</CardTitle>
                    <CardDescription>
                        Find realistic career transition paths with intermediate "bridge" roles
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Input Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="originSoc">Current Occupation (SOC Code)</Label>
                            <Input
                                id="originSoc"
                                placeholder="e.g., 53-3032.00 (Truck Driver)"
                                value={originSoc}
                                onChange={(e) => setOriginSoc(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destinationSoc">Target Occupation (SOC Code)</Label>
                            <Input
                                id="destinationSoc"
                                placeholder="e.g., 15-2051.00 (Data Analyst)"
                                value={destinationSoc}
                                onChange={(e) => setDestinationSoc(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={findBridgeRoles}
                        disabled={searchLoading}
                        className="w-full"
                    >
                        {searchLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Finding Path...
                            </>
                        ) : (
                            'Find Bridge Roles'
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Path Results */}
            {pathData && (
                <>
                    {/* Summary Card */}
                    <Card className="border-[var(--accent-primary)]/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {pathData.origin_title || pathData.origin_soc} → {pathData.destination_title || pathData.destination_soc}
                                    </CardTitle>
                                    <CardDescription>
                                        {pathData.path_length === 0
                                            ? 'Direct transition possible'
                                            : `${pathData.path_length} intermediate role${pathData.path_length > 1 ? 's' : ''} recommended`}
                                    </CardDescription>
                                </div>

                                <div className="text-right">
                                    <div className="text-3xl font-bold text-[var(--accent-primary)]">
                                        {Math.round(pathData.feasibility_score)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Feasibility Score</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Avg Skill Overlap</div>
                                    <div className="text-2xl font-bold">
                                        {Math.round(pathData.avg_skill_overlap * 100)}%
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-muted-foreground">Path Length</div>
                                    <div className="text-2xl font-bold">
                                        {pathData.path_length} {pathData.path_length === 1 ? 'step' : 'steps'}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-muted-foreground">Total Distance</div>
                                    <div className="text-2xl font-bold">
                                        {pathData.total_distance.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Feasibility Badge */}
                            <div className="flex items-center gap-2">
                                <Badge className={getRiskLevel(pathData.feasibility_score).color}>
                                    {getRiskLevel(pathData.feasibility_score).label}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Path Visualization */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Transition Path
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {pathData.path_socs.map((soc, index) => {
                                    const isLast = index === pathData.path_socs.length - 1;
                                    const title = pathData.path_titles?.[index] || soc;
                                    const overlap = pathData.skill_overlaps[index] || 0;

                                    return (
                                        <div key={soc}>
                                            {/* Role Card */}
                                            <div className={`p-4 rounded-lg border-2 ${index === 0
                                                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                                    : isLast
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5'
                                                }`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {index === 0 && <Badge variant="outline">Starting Point</Badge>}
                                                            {isLast && <Badge variant="outline">Goal</Badge>}
                                                            {!isLast && index > 0 && (
                                                                <Badge variant="secondary">Bridge Role #{index}</Badge>
                                                            )}
                                                        </div>
                                                        <h4 className="font-semibold text-lg">{title}</h4>
                                                        <p className="text-sm text-muted-foreground">{soc}</p>
                                                    </div>

                                                    {index < pathData.path_socs.length - 1 && (
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-green-600">
                                                                {Math.round(overlap * 100)}%
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">overlap</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Skill Overlap Progress */}
                                                {index < pathData.path_socs.length - 1 && (
                                                    <div className="mt-3 space-y-1">
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>Skill Match</span>
                                                            <span>{Math.round(overlap * 100)}%</span>
                                                        </div>
                                                        <Progress value={overlap * 100} className="h-2" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Transition Arrow */}
                                            {!isLast && (
                                                <div className="flex items-center justify-center py-3">
                                                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex gap-3">
                                <Button className="flex-1" variant="outline">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    View Learning Resources
                                </Button>
                                <Button className="flex-1">
                                    <Award className="mr-2 h-4 w-4" />
                                    Save as My Goal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Empty State */}
            {!pathData && !searchLoading && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Enter occupation codes to find your career bridge path</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
