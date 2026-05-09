import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, BookOpen, Award, ChevronRight, Search, Route, Database, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BridgeRolePathwayProps {
    originSoc?: string;
    destinationSoc?: string;
}

interface OccupationOption {
    code: string;
    title: string;
    description?: string;
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

const EXAMPLE_PATHS: Array<{
    label: string;
    origin: OccupationOption;
    destination: OccupationOption;
}> = [
    {
        label: 'Truck driver to logistics',
        origin: { code: '53-3032.00', title: 'Heavy and Tractor-Trailer Truck Drivers' },
        destination: { code: '13-1081.00', title: 'Logisticians' },
    },
    {
        label: 'Customer support to research',
        origin: { code: '43-4051.00', title: 'Customer Service Representatives' },
        destination: { code: '13-1161.00', title: 'Market Research Analysts and Marketing Specialists' },
    },
    {
        label: 'Electrical engineer to cyber',
        origin: { code: '17-2071.00', title: 'Electrical Engineers' },
        destination: { code: '15-1212.00', title: 'Information Security Analysts' },
    },
];

function normalizeOccupation(item: any): OccupationOption | null {
    const code = item?.occupation_code || item?.code || item?.onetsoc_code;
    const title = item?.occupation_title || item?.title || item?.name;
    if (!code || !title) return null;

    return {
        code,
        title,
        description: item?.description || item?.summary || 'O*NET occupation profile',
    };
}

function scorePercent(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value * 100)));
}

export default function BridgeRolePathway({
    originSoc: initialOrigin,
    destinationSoc: initialDestination
}: BridgeRolePathwayProps) {
    const [originSoc, setOriginSoc] = useState(initialOrigin || '');
    const [destinationSoc, setDestinationSoc] = useState(initialDestination || '');
    const [originTitle, setOriginTitle] = useState(initialOrigin || '');
    const [destinationTitle, setDestinationTitle] = useState(initialDestination || '');
    const [originQuery, setOriginQuery] = useState('');
    const [destinationQuery, setDestinationQuery] = useState('');
    const [originResults, setOriginResults] = useState<OccupationOption[]>([]);
    const [destinationResults, setDestinationResults] = useState<OccupationOption[]>([]);
    const [searchingOrigin, setSearchingOrigin] = useState(false);
    const [searchingDestination, setSearchingDestination] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pathData, setPathData] = useState<BridgePathData | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const { toast } = useToast();

    const searchOccupations = async (query: string, target: 'origin' | 'destination') => {
        if (query.trim().length < 2) {
            setStatusMessage('Type at least 2 characters to search occupations.');
            return;
        }

        const setSearching = target === 'origin' ? setSearchingOrigin : setSearchingDestination;
        const setResults = target === 'origin' ? setOriginResults : setDestinationResults;
        setSearching(true);
        setStatusMessage(null);

        try {
            const { data, error } = await supabase.functions.invoke('search-occupations', {
                body: {
                    keyword: query.trim(),
                    limit: 8,
                },
            });

            if (error) throw error;

            const occupations = Array.isArray((data as any)?.occupations)
                ? (data as any).occupations
                : [];

            const normalized = occupations
                .map(normalizeOccupation)
                .filter(Boolean) as OccupationOption[];

            setResults(normalized);
            setStatusMessage(
                normalized.length > 0
                    ? `Found ${normalized.length} matching occupation${normalized.length === 1 ? '' : 's'}.`
                    : 'No matching occupations found. Try a broader title.'
            );
        } catch (error: any) {
            console.error('Occupation search failed:', error);
            setResults([]);
            toast({
                title: 'Occupation Search Failed',
                description: error.message || 'Unable to search occupations',
                variant: 'destructive'
            });
        } finally {
            setSearching(false);
        }
    };

    const selectOccupation = (occupation: OccupationOption, target: 'origin' | 'destination') => {
        if (target === 'origin') {
            setOriginSoc(occupation.code);
            setOriginTitle(occupation.title);
            setOriginQuery(occupation.title);
            setOriginResults([]);
        } else {
            setDestinationSoc(occupation.code);
            setDestinationTitle(occupation.title);
            setDestinationQuery(occupation.title);
            setDestinationResults([]);
        }
        setPathData(null);
    };

    const loadExample = (example: typeof EXAMPLE_PATHS[number]) => {
        selectOccupation(example.origin, 'origin');
        selectOccupation(example.destination, 'destination');
        setStatusMessage(`Loaded example: ${example.label}.`);
    };

    const findBridgeRoles = async () => {
        if (!originSoc || !destinationSoc) {
            toast({
                title: 'Missing Information',
                description: 'Search and select both a current occupation and target occupation.',
                variant: 'destructive'
            });
            return;
        }

        setSearchLoading(true);
        setStatusMessage('Finding bridge roles with O*NET skill overlap...');

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
                setStatusMessage('Bridge path calculated. Review feasibility and skill overlap before using it with a client.');

                toast({
                    title: 'Path Found',
                    description: `Found ${data.path.path_length === 0 ? 'a direct' : data.path.path_length + '-step'} transition path`,
                });
            } else {
                setPathData(null);
                setStatusMessage('No feasible path was found for this pair. Try a closer target role.');
                toast({
                    title: 'No Path Found',
                    description: data?.error || 'No feasible transition path found',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            console.error('Error finding bridge roles:', error);
            setPathData(null);
            setStatusMessage('Bridge-role calculation failed. Check Edge Function access and seeded occupation data.');
            toast({
                title: 'Bridge Search Failed',
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

    const renderOccupationResults = (results: OccupationOption[], target: 'origin' | 'destination') => {
        if (results.length === 0) return null;

        return (
            <div className="grid gap-2">
                {results.map(occupation => (
                    <button
                        key={`${target}-${occupation.code}`}
                        type="button"
                        className="text-left rounded-lg border p-3 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-colors"
                        onClick={() => selectOccupation(occupation, target)}
                    >
                        <div className="font-medium">{occupation.title}</div>
                        <div className="text-xs text-muted-foreground">{occupation.code}</div>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Route className="h-5 w-5 text-[var(--accent-primary)]" />
                        Career Bridge Role Finder
                    </CardTitle>
                    <CardDescription>
                        Search occupations by title, then find realistic transition paths with intermediate bridge roles.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>
                            Status: partially usable until runtime proof confirms the pathfinding function, cached role graph, and missing-skill data in this environment.
                        </AlertDescription>
                    </Alert>

                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_PATHS.map(example => (
                            <Button
                                key={example.label}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => loadExample(example)}
                                disabled={searchLoading}
                            >
                                {example.label}
                            </Button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="space-y-3">
                            <Label htmlFor="originSearch">Current occupation</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="originSearch"
                                    value={originQuery}
                                    onChange={(event) => setOriginQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') searchOccupations(originQuery, 'origin');
                                    }}
                                    placeholder="e.g. truck driver, dispatcher, lineworker"
                                    disabled={searchingOrigin || searchLoading}
                                />
                                <Button
                                    type="button"
                                    onClick={() => searchOccupations(originQuery, 'origin')}
                                    disabled={searchingOrigin || searchLoading}
                                >
                                    {searchingOrigin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    <span className="sr-only">Search current occupation</span>
                                </Button>
                            </div>
                            {originSoc && (
                                <div className="rounded-md bg-[var(--bg-secondary)] border p-3">
                                    <div className="font-medium">{originTitle || originSoc}</div>
                                    <div className="text-xs text-muted-foreground">{originSoc}</div>
                                </div>
                            )}
                            {renderOccupationResults(originResults, 'origin')}

                            <div className="space-y-2">
                                <Label htmlFor="originSoc">Manual SOC code</Label>
                                <Input
                                    id="originSoc"
                                    value={originSoc}
                                    onChange={(event) => {
                                        setOriginSoc(event.target.value);
                                        setOriginTitle(event.target.value);
                                        setPathData(null);
                                    }}
                                    placeholder="53-3032.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="destinationSearch">Target occupation</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="destinationSearch"
                                    value={destinationQuery}
                                    onChange={(event) => setDestinationQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') searchOccupations(destinationQuery, 'destination');
                                    }}
                                    placeholder="e.g. logistician, cyber analyst, grid planner"
                                    disabled={searchingDestination || searchLoading}
                                />
                                <Button
                                    type="button"
                                    onClick={() => searchOccupations(destinationQuery, 'destination')}
                                    disabled={searchingDestination || searchLoading}
                                >
                                    {searchingDestination ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    <span className="sr-only">Search target occupation</span>
                                </Button>
                            </div>
                            {destinationSoc && (
                                <div className="rounded-md bg-[var(--bg-secondary)] border p-3">
                                    <div className="font-medium">{destinationTitle || destinationSoc}</div>
                                    <div className="text-xs text-muted-foreground">{destinationSoc}</div>
                                </div>
                            )}
                            {renderOccupationResults(destinationResults, 'destination')}

                            <div className="space-y-2">
                                <Label htmlFor="destinationSoc">Manual SOC code</Label>
                                <Input
                                    id="destinationSoc"
                                    value={destinationSoc}
                                    onChange={(event) => {
                                        setDestinationSoc(event.target.value);
                                        setDestinationTitle(event.target.value);
                                        setPathData(null);
                                    }}
                                    placeholder="13-1081.00"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={findBridgeRoles}
                        disabled={searchLoading || !originSoc || !destinationSoc}
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

                    {statusMessage && (
                        <p className="text-sm text-muted-foreground">{statusMessage}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="gap-1">
                            <Database className="h-3 w-3" />
                            O*NET occupation and skill overlap
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <Route className="h-3 w-3" />
                            APO bridge-role Edge Function
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {pathData && (
                <>
                    <Card className="border-[var(--accent-primary)]/20">
                        <CardHeader>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {pathData.origin_title || originTitle || pathData.origin_soc} to {pathData.destination_title || destinationTitle || pathData.destination_soc}
                                    </CardTitle>
                                    <CardDescription>
                                        {pathData.path_length === 0
                                            ? 'Direct transition possible'
                                            : `${pathData.path_length} intermediate role${pathData.path_length > 1 ? 's' : ''} recommended`}
                                    </CardDescription>
                                </div>

                                <div className="text-left md:text-right">
                                    <div className="text-3xl font-bold text-[var(--accent-primary)]">
                                        {Math.round(pathData.feasibility_score)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Feasibility Score</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Avg Skill Overlap</div>
                                    <div className="text-2xl font-bold">
                                        {scorePercent(pathData.avg_skill_overlap)}%
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
                                        {Number(pathData.total_distance || 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge className={getRiskLevel(pathData.feasibility_score).color}>
                                    {getRiskLevel(pathData.feasibility_score).label}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

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
                                    const transition = pathData.transitions?.[index];

                                    return (
                                        <div key={`${soc}-${index}`}>
                                            <div className={`p-4 rounded-lg border-2 ${index === 0
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                                : isLast
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5'
                                                }`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                                                                {scorePercent(overlap)}%
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">overlap</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {index < pathData.path_socs.length - 1 && (
                                                    <div className="mt-3 space-y-2">
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>Skill Match</span>
                                                            <span>{scorePercent(overlap)}%</span>
                                                        </div>
                                                        <Progress value={scorePercent(overlap)} className="h-2" />
                                                        {transition?.missing_skills && transition.missing_skills.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 pt-2">
                                                                {transition.missing_skills.slice(0, 5).map(skill => (
                                                                    <Badge key={skill} variant="outline">{skill}</Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {!isLast && (
                                                <div className="flex items-center justify-center py-3">
                                                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex flex-col md:flex-row gap-3">
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

            {!pathData && !searchLoading && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Search occupations or load an example to find a practical transition path.</p>
                        <p className="text-sm mt-1">SOC-code fields remain available for power users and testing.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
