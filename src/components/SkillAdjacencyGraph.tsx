import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Zap, TrendingUp, Clock, Database, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { withTimeout } from '@/lib/asyncTimeout';

type SkillType = 'knowledge' | 'ability';

interface SkillNode {
    id: string;
    name: string;
    type: SkillType;
    isCurrent?: boolean;
    similarity?: number;
    learningHours?: number;
    salaryImpact?: number;
    demandScore?: number;
}

interface SkillLink {
    source: string;
    target: string;
    value: number;
}

interface GraphData {
    nodes: SkillNode[];
    links: SkillLink[];
}

interface OccupationOption {
    code: string;
    title: string;
    description?: string;
}

interface OccupationSkill {
    element_id: string;
    element_name: string;
    data_value: number;
    description?: string;
}

interface OccupationSearchResponse {
    occupations?: unknown[];
}

interface AdjacentSkill {
    adjacent_skill_id?: string;
    skill_id?: string;
    adjacent_skill_name?: string;
    skill_name?: string;
    similarity_score?: number | string;
    estimated_learning_hours?: number | string;
    salary_impact_usd?: number | string;
    demand_score?: number | string;
}

interface SkillAdjacencyItem {
    skill_id?: string;
    element_id?: string;
    skill_name?: string;
    element_name?: string;
    skill_type?: SkillType;
    adjacent_skills?: AdjacentSkill[];
}

interface SkillAdjacencyResponse {
    success?: boolean;
    data?: SkillAdjacencyItem[];
    error?: string;
}

interface SkillAdjacencyGraphProps {
    currentSkillIds?: string[];
    skillType?: SkillType;
    occupationCode?: string;
}

const EXAMPLE_OCCUPATIONS: OccupationOption[] = [
    { code: '15-1252.00', title: 'Software Developers' },
    { code: '43-4051.00', title: 'Customer Service Representatives' },
    { code: '53-3032.00', title: 'Heavy and Tractor-Trailer Truck Drivers' },
    { code: '17-2071.00', title: 'Electrical Engineers' },
];
const SKILL_ADJACENCY_TIMEOUT_MS = 18_000;
const SKILL_TABLE_TIMEOUT_MS = 10_000;

const EXAMPLE_OCCUPATION_SKILLS: Record<string, Record<SkillType, OccupationSkill[]>> = {
    '15-1252.00': {
        knowledge: [
            { element_id: 'example-sw-knowledge-computers', element_name: 'Computers and Electronics', data_value: 4.8 },
            { element_id: 'example-sw-knowledge-engineering', element_name: 'Engineering and Technology', data_value: 4.2 },
            { element_id: 'example-sw-knowledge-mathematics', element_name: 'Mathematics', data_value: 4.0 },
            { element_id: 'example-sw-knowledge-design', element_name: 'Design', data_value: 3.8 },
            { element_id: 'example-sw-knowledge-english', element_name: 'English Language', data_value: 3.5 },
        ],
        ability: [
            { element_id: 'example-sw-ability-deductive', element_name: 'Deductive Reasoning', data_value: 4.4 },
            { element_id: 'example-sw-ability-problem', element_name: 'Problem Sensitivity', data_value: 4.3 },
            { element_id: 'example-sw-ability-inductive', element_name: 'Inductive Reasoning', data_value: 4.1 },
            { element_id: 'example-sw-ability-written', element_name: 'Written Comprehension', data_value: 3.9 },
            { element_id: 'example-sw-ability-oral', element_name: 'Oral Comprehension', data_value: 3.7 },
        ],
    },
    '43-4051.00': {
        knowledge: [
            { element_id: 'example-csr-knowledge-customer', element_name: 'Customer and Personal Service', data_value: 4.7 },
            { element_id: 'example-csr-knowledge-english', element_name: 'English Language', data_value: 4.0 },
            { element_id: 'example-csr-knowledge-clerical', element_name: 'Clerical', data_value: 3.8 },
            { element_id: 'example-csr-knowledge-computers', element_name: 'Computers and Electronics', data_value: 3.5 },
            { element_id: 'example-csr-knowledge-admin', element_name: 'Administration and Management', data_value: 3.2 },
        ],
        ability: [
            { element_id: 'example-csr-ability-oral', element_name: 'Oral Comprehension', data_value: 4.4 },
            { element_id: 'example-csr-ability-expression', element_name: 'Oral Expression', data_value: 4.3 },
            { element_id: 'example-csr-ability-speech', element_name: 'Speech Recognition', data_value: 4.0 },
            { element_id: 'example-csr-ability-written', element_name: 'Written Comprehension', data_value: 3.7 },
            { element_id: 'example-csr-ability-problem', element_name: 'Problem Sensitivity', data_value: 3.4 },
        ],
    },
    '53-3032.00': {
        knowledge: [
            { element_id: 'example-driver-knowledge-transport', element_name: 'Transportation', data_value: 4.6 },
            { element_id: 'example-driver-knowledge-safety', element_name: 'Public Safety and Security', data_value: 4.1 },
            { element_id: 'example-driver-knowledge-customer', element_name: 'Customer and Personal Service', data_value: 3.5 },
            { element_id: 'example-driver-knowledge-mechanical', element_name: 'Mechanical', data_value: 3.4 },
            { element_id: 'example-driver-knowledge-english', element_name: 'English Language', data_value: 3.1 },
        ],
        ability: [
            { element_id: 'example-driver-ability-control', element_name: 'Control Precision', data_value: 4.3 },
            { element_id: 'example-driver-ability-spatial', element_name: 'Spatial Orientation', data_value: 4.2 },
            { element_id: 'example-driver-ability-reaction', element_name: 'Reaction Time', data_value: 4.0 },
            { element_id: 'example-driver-ability-vision', element_name: 'Far Vision', data_value: 3.9 },
            { element_id: 'example-driver-ability-problem', element_name: 'Problem Sensitivity', data_value: 3.5 },
        ],
    },
    '17-2071.00': {
        knowledge: [
            { element_id: 'example-ee-knowledge-engineering', element_name: 'Engineering and Technology', data_value: 4.8 },
            { element_id: 'example-ee-knowledge-design', element_name: 'Design', data_value: 4.5 },
            { element_id: 'example-ee-knowledge-math', element_name: 'Mathematics', data_value: 4.4 },
            { element_id: 'example-ee-knowledge-computers', element_name: 'Computers and Electronics', data_value: 4.2 },
            { element_id: 'example-ee-knowledge-physics', element_name: 'Physics', data_value: 3.9 },
        ],
        ability: [
            { element_id: 'example-ee-ability-deductive', element_name: 'Deductive Reasoning', data_value: 4.5 },
            { element_id: 'example-ee-ability-problem', element_name: 'Problem Sensitivity', data_value: 4.3 },
            { element_id: 'example-ee-ability-math', element_name: 'Mathematical Reasoning', data_value: 4.2 },
            { element_id: 'example-ee-ability-inductive', element_name: 'Inductive Reasoning', data_value: 4.1 },
            { element_id: 'example-ee-ability-written', element_name: 'Written Comprehension', data_value: 3.8 },
        ],
    },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

const asSkillType = (value: unknown, fallback: SkillType): SkillType =>
    value === 'knowledge' || value === 'ability' ? value : fallback;

const toErrorMessage = (error: unknown, fallback: string): string =>
    error instanceof Error ? error.message : fallback;

function normalizeOccupation(item: unknown): OccupationOption | null {
    if (!isRecord(item)) return null;

    const code = asString(item.occupation_code) || asString(item.code) || asString(item.onetsoc_code);
    const title = asString(item.occupation_title) || asString(item.title) || asString(item.name);
    if (!code || !title) return null;

    return {
        code,
        title,
        description: asString(item.description) || asString(item.summary) || 'O*NET occupation profile',
    };
}

function normalizeOccupationSkillRow(row: unknown, skillType: SkillType): OccupationSkill | null {
    if (!isRecord(row)) return null;

    const stableId =
        asString(row.id) ||
        asString(row.element_id) ||
        asString(skillType === 'knowledge' ? row.knowledge_id : row.ability_id);
    const name = asString(row.name) || asString(row.element_name);
    const value = asNumber(row.importance) ?? asNumber(row.data_value) ?? asNumber(row.level);

    if (!stableId || !name || value === undefined) return null;

    return {
        element_id: stableId,
        element_name: name,
        data_value: value,
        ...(asString(row.description) ? { description: asString(row.description) } : {}),
    };
}

function getExampleOccupationSkills(
    occupation: OccupationOption,
    skillType: SkillType,
): OccupationSkill[] {
    return EXAMPLE_OCCUPATION_SKILLS[occupation.code]?.[skillType] ?? [];
}

function clampPercent(value?: number): number {
    if (!Number.isFinite(value || 0)) return 0;
    return Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
}

export default function SkillAdjacencyGraph({
    currentSkillIds = [],
    skillType = 'knowledge',
    occupationCode
}: SkillAdjacencyGraphProps) {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [occupationQuery, setOccupationQuery] = useState('');
    const [occupationResults, setOccupationResults] = useState<OccupationOption[]>([]);
    const [selectedOccupation, setSelectedOccupation] = useState<OccupationOption | null>(
        occupationCode ? { code: occupationCode, title: occupationCode } : null
    );
    const [activeSkillType, setActiveSkillType] = useState<SkillType>(skillType);
    const [currentSkills, setCurrentSkills] = useState<OccupationSkill[]>([]);
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(currentSkillIds);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        setActiveSkillType(skillType);
    }, [skillType]);

    useEffect(() => {
        if (currentSkillIds.length > 0) {
            setSelectedSkillIds(currentSkillIds);
        }
    }, [currentSkillIds]);

    useEffect(() => {
        if (occupationCode && currentSkillIds.length === 0) {
            loadOccupationSkills({ code: occupationCode, title: occupationCode }, activeSkillType);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [occupationCode]);

    const searchOccupations = async () => {
        if (occupationQuery.trim().length < 2) {
            setOccupationResults([]);
            setStatusMessage('Type at least 2 characters to search O*NET occupations.');
            return;
        }

        setSearching(true);
        setStatusMessage(null);

        try {
            const { data, error } = await supabase.functions.invoke('search-occupations', {
                body: {
                    keyword: occupationQuery.trim(),
                    limit: 8,
                },
            });

            if (error) throw error;

            const payload = data as OccupationSearchResponse | null;
            const occupations = Array.isArray(payload?.occupations) ? payload.occupations : [];

            const normalized = occupations.flatMap((occupation) => {
                const normalizedOccupation = normalizeOccupation(occupation);
                return normalizedOccupation ? [normalizedOccupation] : [];
            });

            setOccupationResults(normalized);
            setStatusMessage(
                normalized.length > 0
                    ? `Found ${normalized.length} matching occupation${normalized.length === 1 ? '' : 's'}.`
                    : 'No matching occupations found. Try a broader title.'
            );
        } catch (error) {
            console.error('Error searching occupations:', error);
            setOccupationResults([]);
            toast({
                title: 'Occupation Search Failed',
                description: toErrorMessage(error, 'Unable to search occupations'),
                variant: 'destructive'
            });
        } finally {
            setSearching(false);
        }
    };

    const loadOccupationSkills = async (
        occupation: OccupationOption,
        nextSkillType: SkillType = activeSkillType
    ) => {
        setSelectedOccupation(occupation);
        setActiveSkillType(nextSkillType);
        setLoading(true);
        setStatusMessage(`Loading ${nextSkillType} data for ${occupation.title}...`);
        setSelectedNode(null);

        try {
            const tableName = nextSkillType === 'knowledge' ? 'onet_knowledge' : 'onet_abilities';
            const classificationColumn = nextSkillType === 'knowledge' ? 'knowledge_id' : 'ability_id';
            let usedExampleFallback = false;
            let skills: OccupationSkill[] = [];

            try {
                const liveResult = await withTimeout(
                    supabase
                        .from(tableName)
                        .select(`id, ${classificationColumn}, name, description, importance, level`)
                        .eq('occupation_code', occupation.code)
                        .gte('importance', 3.0)
                        .order('importance', { ascending: false })
                        .limit(5),
                    SKILL_TABLE_TIMEOUT_MS,
                    'Live O*NET skill table query timed out.'
                );

                const legacyResult = liveResult.error
                    ? await withTimeout(
                        supabase
                            .from(tableName)
                            .select('element_id, element_name, data_value')
                            .eq('onetsoc_code', occupation.code)
                            .gte('data_value', 3.0)
                            .order('data_value', { ascending: false })
                            .limit(5),
                        SKILL_TABLE_TIMEOUT_MS,
                        'Legacy O*NET skill table query timed out.'
                    )
                    : liveResult;

                if (legacyResult.error) throw legacyResult.error;

                skills = (legacyResult.data || []).flatMap((row) => {
                    const normalized = normalizeOccupationSkillRow(row, nextSkillType);
                    return normalized ? [normalized] : [];
                });
            } catch (error) {
                const exampleSkills = getExampleOccupationSkills(occupation, nextSkillType);
                if (exampleSkills.length === 0) throw error;
                usedExampleFallback = true;
                skills = exampleSkills;
            }

            setCurrentSkills(skills);

            if (skills.length === 0) {
                setSelectedSkillIds([]);
                setGraphData({ nodes: [], links: [] });
                setStatusMessage(`No ${nextSkillType} records were found for ${occupation.title}.`);
                return;
            }

            const skillIds = skills.map(skill => skill.element_id);
            setSelectedSkillIds(skillIds);

            if (usedExampleFallback) {
                buildCurrentSkillGraphData(skillIds, nextSkillType, skills);
                setStatusMessage(
                    `Live O*NET skill data did not respond for ${occupation.title}. Showing built-in example source skills only until Supabase skill data and embeddings are healthy.`
                );
                return;
            }

            await calculateAdjacency(skillIds, nextSkillType, occupation, skills, usedExampleFallback);
        } catch (error) {
            console.error('Error fetching occupation skills:', error);
            setGraphData({ nodes: [], links: [] });
            setStatusMessage('Skill data could not be loaded for this occupation.');
            toast({
                title: 'Skill Load Failed',
                description: toErrorMessage(error, 'Failed to load occupation skills'),
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateAdjacency = async (
        skillIds: string[] = selectedSkillIds,
        nextSkillType: SkillType = activeSkillType,
        occupation: OccupationOption | null = selectedOccupation,
        sourceSkills: OccupationSkill[] = currentSkills,
        sourceIsExampleFallback = false
    ) => {
        if (skillIds.length === 0) {
            setStatusMessage('Select an occupation first so APO can use its strongest O*NET skills.');
            return;
        }

        setLoading(true);
        setStatusMessage('Calculating adjacent skills from APO embeddings...');

        try {
            const { data, error } = await withTimeout(
                supabase.functions.invoke('calculate-skill-adjacency', {
                    body: {
                        skill_ids: skillIds,
                        skill_type: nextSkillType,
                        limit: 10
                    }
                }),
                SKILL_ADJACENCY_TIMEOUT_MS,
                'Skill adjacency calculation timed out.'
            );

            if (error) throw error;

            const payload = data as SkillAdjacencyResponse | null;
            if (payload?.success) {
                const adjacencyItems = Array.isArray(payload.data) ? payload.data : [];
                const adjacentCount = adjacencyItems.reduce(
                    (count, item) => count + (Array.isArray(item.adjacent_skills) ? item.adjacent_skills.length : 0),
                    0
                );

                if (adjacencyItems.length > 0 && adjacentCount > 0) {
                    buildGraphData(adjacencyItems, nextSkillType);
                } else {
                    buildCurrentSkillGraphData(skillIds, nextSkillType, sourceSkills);
                }

                const label = occupation?.title || 'selected skills';
                setStatusMessage(
                    adjacentCount > 0
                        ? `Adjacency graph created for ${label}.`
                        : sourceIsExampleFallback
                            ? `Live O*NET skill data did not respond for ${label}. Showing built-in example source skills only until Supabase skill data and embeddings are healthy.`
                            : `Skill records loaded for ${label}. The adjacency service returned no adjacent vectors, so this graph shows source skills only until embeddings are refreshed.`
                );
            } else {
                throw new Error(payload?.error || 'Adjacency function returned no usable data');
            }
        } catch (error) {
            console.error('Error calculating adjacency:', error);
            buildCurrentSkillGraphData(skillIds, nextSkillType, sourceSkills);
            setStatusMessage(
                sourceIsExampleFallback
                    ? 'Live O*NET skill data did not respond. Showing built-in example source skills only until the Supabase table/function path is healthy.'
                    : 'Skill records loaded, but adjacency calculation failed. Showing source skills only until the Supabase function is healthy.'
            );
            toast({
                title: 'Adjacency Calculation Failed',
                description: toErrorMessage(error, 'Failed to calculate skill adjacency'),
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const buildGraphData = (adjacencyData: SkillAdjacencyItem[], nextSkillType: SkillType) => {
        const nodes: SkillNode[] = [];
        const links: SkillLink[] = [];
        const nodeMap = new Map<string, SkillNode>();

        adjacencyData.forEach(item => {
            const skillId = item.skill_id || item.element_id;
            const skillName = item.skill_name || item.element_name || skillId;
            if (!skillId || nodeMap.has(skillId)) return;

            const currentNode: SkillNode = {
                id: skillId,
                name: skillName,
                type: asSkillType(item.skill_type, nextSkillType),
                isCurrent: true
            };
            nodes.push(currentNode);
            nodeMap.set(skillId, currentNode);
        });

        adjacencyData.forEach(item => {
            const sourceId = item.skill_id || item.element_id;
            if (!sourceId) return;
            const itemSkillType = asSkillType(item.skill_type, nextSkillType);
            const adjacentSkills = Array.isArray(item.adjacent_skills) ? item.adjacent_skills : [];

            adjacentSkills.forEach((adj) => {
                const adjacentId = adj.adjacent_skill_id || adj.skill_id;
                if (!adjacentId) return;
                const similarity = asNumber(adj.similarity_score);

                if (!nodeMap.has(adjacentId)) {
                    const adjacentNode: SkillNode = {
                        id: adjacentId,
                        name: adj.adjacent_skill_name || adj.skill_name || adjacentId,
                        type: itemSkillType,
                        isCurrent: false,
                        similarity,
                        learningHours: asNumber(adj.estimated_learning_hours),
                        salaryImpact: asNumber(adj.salary_impact_usd),
                        demandScore: asNumber(adj.demand_score)
                    };
                    nodes.push(adjacentNode);
                    nodeMap.set(adjacentId, adjacentNode);
                }

                links.push({
                    source: sourceId,
                    target: adjacentId,
                    value: similarity ?? 0.25
                });
            });
        });

        setGraphData({ nodes, links });
    };

    const buildCurrentSkillGraphData = (
        skillIds: string[],
        nextSkillType: SkillType,
        sourceSkills: OccupationSkill[] = currentSkills
    ) => {
        const skillsById = new Map(sourceSkills.map((skill) => [skill.element_id, skill]));
        const nodes = skillIds.flatMap((skillId): SkillNode[] => {
            const skill = skillsById.get(skillId);
            return [
                {
                    id: skillId,
                    name: skill?.element_name || skillId,
                    type: nextSkillType,
                    isCurrent: true,
                },
            ];
        });

        setGraphData({ nodes, links: [] });
    };

    const layout = useMemo(() => {
        const width = 720;
        const height = 460;
        const centerX = width / 2;
        const centerY = height / 2;
        const currentNodes = graphData.nodes.filter(node => node.isCurrent);
        const adjacentNodes = graphData.nodes.filter(node => !node.isCurrent);
        const positions = new Map<string, { x: number; y: number }>();

        currentNodes.forEach((node, index) => {
            const radius = currentNodes.length <= 1 ? 0 : 82;
            const angle = (Math.PI * 2 * index) / Math.max(currentNodes.length, 1) - Math.PI / 2;
            positions.set(node.id, {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
            });
        });

        adjacentNodes.forEach((node, index) => {
            const radius = 185 + ((index % 2) * 34);
            const angle = (Math.PI * 2 * index) / Math.max(adjacentNodes.length, 1) - Math.PI / 2;
            positions.set(node.id, {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
            });
        });

        return { width, height, positions };
    }, [graphData]);

    const handleSkillTypeChange = (nextSkillType: SkillType) => {
        setActiveSkillType(nextSkillType);
        if (selectedOccupation) {
            loadOccupationSkills(selectedOccupation, nextSkillType);
        } else if (selectedSkillIds.length > 0) {
            calculateAdjacency(selectedSkillIds, nextSkillType);
        }
    };

    const currentSkillNames = currentSkills.map(skill => skill.element_name).slice(0, 5);

    const renderGraph = useCallback(() => {
        if (graphData.nodes.length === 0) return null;

        return (
            <div className="border rounded-lg bg-[var(--bg-secondary)] relative overflow-hidden">
                <svg
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    className="w-full h-[500px]"
                    role="img"
                    aria-label="Skill adjacency graph"
                >
                    <defs>
                        <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18" />
                        </filter>
                    </defs>

                    {graphData.links.map((link, index) => {
                        const source = layout.positions.get(String(link.source));
                        const target = layout.positions.get(String(link.target));
                        if (!source || !target) return null;
                        return (
                            <line
                                key={`${link.source}-${link.target}-${index}`}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke="rgba(139, 92, 246, 0.35)"
                                strokeWidth={Math.max(1.5, link.value * 5)}
                            />
                        );
                    })}

                    {graphData.nodes.map(node => {
                        const position = layout.positions.get(node.id);
                        if (!position) return null;
                        const isActive = hoveredNodeId === node.id || selectedNode?.id === node.id;
                        const radius = node.isCurrent ? 17 : 14;

                        return (
                            <g
                                key={node.id}
                                role="button"
                                tabIndex={0}
                                className="cursor-pointer"
                                onClick={() => setSelectedNode(node)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setSelectedNode(node);
                                    }
                                }}
                                onMouseEnter={() => setHoveredNodeId(node.id)}
                                onMouseLeave={() => setHoveredNodeId(null)}
                            >
                                <circle
                                    cx={position.x}
                                    cy={position.y}
                                    r={radius}
                                    fill={node.isCurrent ? '#2563eb' : isActive ? '#0f766e' : 'rgba(20, 184, 166, 0.55)'}
                                    stroke={isActive ? '#ffffff' : node.isCurrent ? '#bfdbfe' : '#99f6e4'}
                                    strokeWidth={isActive ? 4 : 2}
                                    filter="url(#nodeShadow)"
                                />
                                {!node.isCurrent && node.similarity && (
                                    <text
                                        x={position.x}
                                        y={position.y - 24}
                                        textAnchor="middle"
                                        className="fill-emerald-700 text-[11px] font-semibold"
                                    >
                                        {clampPercent(node.similarity)}%
                                    </text>
                                )}
                                <text
                                    x={position.x}
                                    y={position.y + radius + 15}
                                    textAnchor="middle"
                                    className="fill-slate-800 text-[12px] font-medium"
                                >
                                    {node.name.length > 22 ? `${node.name.slice(0, 21)}...` : node.name}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                <div className="absolute top-4 right-4 bg-[var(--bg-secondary)]/95 backdrop-blur p-3 rounded-lg shadow-lg text-xs space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <span>Current O*NET skills</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-teal-500 opacity-70"></div>
                        <span>Adjacent skills</span>
                    </div>
                    <div className="text-muted-foreground pt-2 border-t">
                        Select a node for details
                    </div>
                </div>
            </div>
        );
    }, [graphData, hoveredNodeId, layout, selectedNode]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
                        Skill Adjacency Graph
                    </CardTitle>
                    <CardDescription>
                        Start with an occupation, load its strongest O*NET skills, then find adjacent skills using the APO skill-similarity function.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>
                            Status: partially usable until the Edge Function, pgvector cache, and O*NET skill tables are verified in the target environment.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="skill-occupation-search">Occupation search</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="skill-occupation-search"
                                    value={occupationQuery}
                                    onChange={(event) => setOccupationQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') searchOccupations();
                                    }}
                                    placeholder="Search job title, e.g. dispatcher, electrician, analyst"
                                    disabled={loading || searching}
                                />
                                <Button type="button" onClick={searchOccupations} disabled={loading || searching}>
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    <span className="sr-only">Search</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Skill type</Label>
                            <div className="flex rounded-md border overflow-hidden">
                                <Button
                                    type="button"
                                    variant={activeSkillType === 'knowledge' ? 'default' : 'ghost'}
                                    className="rounded-none"
                                    onClick={() => handleSkillTypeChange('knowledge')}
                                    disabled={loading}
                                >
                                    Knowledge
                                </Button>
                                <Button
                                    type="button"
                                    variant={activeSkillType === 'ability' ? 'default' : 'ghost'}
                                    className="rounded-none"
                                    onClick={() => handleSkillTypeChange('ability')}
                                    disabled={loading}
                                >
                                    Abilities
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_OCCUPATIONS.map(example => (
                            <Button
                                key={example.code}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => loadOccupationSkills(example)}
                                disabled={loading}
                            >
                                {example.title}
                            </Button>
                        ))}
                    </div>

                    {occupationResults.length > 0 && (
                        <div className="grid gap-2">
                            {occupationResults.map(occupation => (
                                <button
                                    key={occupation.code}
                                    type="button"
                                    className="text-left rounded-lg border p-3 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-colors"
                                    onClick={() => loadOccupationSkills(occupation)}
                                    disabled={loading}
                                >
                                    <div className="font-medium">{occupation.title}</div>
                                    <div className="text-xs text-muted-foreground">{occupation.code}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedOccupation && (
                        <div className="rounded-lg border bg-[var(--bg-secondary)] p-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{selectedOccupation.code}</Badge>
                                <span className="font-semibold">{selectedOccupation.title}</span>
                                <Badge variant="secondary">{activeSkillType}</Badge>
                            </div>
                            {currentSkillNames.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {currentSkillNames.map(skill => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4 flex-wrap">
                        <Button
                            onClick={() => calculateAdjacency()}
                            disabled={loading || selectedSkillIds.length === 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                'Calculate Adjacency'
                            )}
                        </Button>

                        {graphData.nodes.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                                {graphData.nodes.filter(n => n.isCurrent).length} current skills /{' '}
                                {graphData.nodes.filter(n => !n.isCurrent).length} adjacent skills
                            </div>
                        )}
                    </div>

                    {statusMessage && (
                        <p className="text-sm text-muted-foreground">{statusMessage}</p>
                    )}

                    {renderGraph()}

                    {graphData.nodes.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Search an occupation or load an example to create the graph.</p>
                            <p className="text-sm mt-1">The standalone route no longer requires users to know skill IDs.</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="gap-1">
                            <Database className="h-3 w-3" />
                            O*NET skill tables
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <Zap className="h-3 w-3" />
                            APO adjacency Edge Function
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Demand/salary fields require provenance verification
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {selectedNode && (
                <Card className={selectedNode.isCurrent ? '' : 'border-[var(--accent-primary)]/20'}>
                    <CardHeader>
                        <CardTitle className="text-lg">{selectedNode.name}</CardTitle>
                        <CardDescription>
                            {selectedNode.isCurrent
                                ? 'Current occupation skill from O*NET.'
                                : `Adjacent skill with ${clampPercent(selectedNode.similarity)}% similarity to your current skill set.`}
                        </CardDescription>
                    </CardHeader>
                    {!selectedNode.isCurrent && (
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>Learning Time</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {selectedNode.learningHours || 'N/A'}
                                        {selectedNode.learningHours && <span className="text-sm font-normal ml-1">hrs</span>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <TrendingUp className="h-4 w-4" />
                                        <span>Salary Impact</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {selectedNode.salaryImpact
                                            ? `$${selectedNode.salaryImpact.toLocaleString()}`
                                            : 'N/A'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Zap className="h-4 w-4" />
                                        <span>Demand Score</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {selectedNode.demandScore || 'N/A'}
                                        {selectedNode.demandScore && <span className="text-sm font-normal ml-1">/100</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <Button className="w-full" variant="outline">
                                    Add to Learning Path
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    );
}
