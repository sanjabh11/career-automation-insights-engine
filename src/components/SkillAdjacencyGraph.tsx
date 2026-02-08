import React, { useState, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SkillNode {
    id: string;
    name: string;
    type: 'knowledge' | 'ability';
    isCurrent?: boolean;
    similarity?: number;
    learningHours?: number;
    salaryImpact?: number;
    demandScore?: number;
}

interface SkillLink {
    source: string;
    target: string;
    value: number; // Similarity score
}

interface GraphData {
    nodes: SkillNode[];
    links: SkillLink[];
}

interface SkillAdjacencyGraphProps {
    currentSkillIds?: string[];
    skillType?: 'knowledge' | 'ability';
    occupationCode?: string;
}

export default function SkillAdjacencyGraph({
    currentSkillIds = [],
    skillType = 'knowledge',
    occupationCode
}: SkillAdjacencyGraphProps) {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);
    const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
    const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
    const { toast } = useToast();

    // Fetch skills for occupation if provided
    useEffect(() => {
        if (occupationCode && currentSkillIds.length === 0) {
            fetchOccupationSkills(occupationCode);
        }
    }, [occupationCode]);

    const fetchOccupationSkills = async (socCode: string) => {
        try {
            const tableName = skillType === 'knowledge' ? 'onet_knowledge' : 'onet_abilities';

            const { data, error } = await supabase
                .from(tableName)
                .select('element_id, element_name, data_value')
                .eq('onetsoc_code', socCode)
                .gte('data_value', 3.0) // Moderate importance
                .order('data_value', { ascending: false })
                .limit(5);

            if (error) throw error;

            if (data && data.length > 0) {
                const skillIds = data.map(s => s.element_id);
                await calculateAdjacency(skillIds);
            }
        } catch (error) {
            console.error('Error fetching occupation skills:', error);
            toast({
                title: 'Error',
                description: 'Failed to load occupation skills',
                variant: 'destructive'
            });
        }
    };

    const calculateAdjacency = async (skillIds: string[]) => {
        setLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('calculate-skill-adjacency', {
                body: {
                    skill_ids: skillIds,
                    skill_type: skillType,
                    limit: 10
                }
            });

            if (error) throw error;

            if (data && data.success) {
                buildGraphData(data.data);
            }
        } catch (error) {
            console.error('Error calculating adjacency:', error);
            toast({
                title: 'Error',
                description: 'Failed to calculate skill adjacency',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const buildGraphData = (adjacencyData: any[]) => {
        const nodes: SkillNode[] = [];
        const links: SkillLink[] = [];
        const nodeMap = new Map<string, SkillNode>();

        // Add current (central) skill nodes
        adjacencyData.forEach(item => {
            const currentNode: SkillNode = {
                id: item.skill_id,
                name: item.skill_name,
                type: item.skill_type,
                isCurrent: true
            };
            nodes.push(currentNode);
            nodeMap.set(item.skill_id, currentNode);
        });

        // Add adjacent (ghost) nodes and links
        adjacencyData.forEach(item => {
            item.adjacent_skills?.forEach((adj: any) => {
                const adjacentId = adj.adjacent_skill_id;

                // Add adjacent node if not already added
                if (!nodeMap.has(adjacentId)) {
                    const adjacentNode: SkillNode = {
                        id: adjacentId,
                        name: adj.adjacent_skill_name,
                        type: item.skill_type,
                        isCurrent: false,
                        similarity: adj.similarity_score,
                        learningHours: adj.estimated_learning_hours,
                        salaryImpact: adj.salary_impact_usd,
                        demandScore: adj.demand_score
                    };
                    nodes.push(adjacentNode);
                    nodeMap.set(adjacentId, adjacentNode);
                }

                // Add link
                links.push({
                    source: item.skill_id,
                    target: adjacentId,
                    value: adj.similarity_score
                });
            });
        });

        setGraphData({ nodes, links });
    };

    const handleNodeClick = useCallback((node: any) => {
        setSelectedNode(node as SkillNode);
    }, []);

    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;

        // Node appearance
        const isCurrent = node.isCurrent;
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, isCurrent ? 8 : 6, 0, 2 * Math.PI);

        if (isCurrent) {
            ctx.fillStyle = '#3b82f6'; // Blue for current skills
        } else {
            ctx.fillStyle = isHovered || isSelected ? '#2DD4A8' : 'rgba(45, 212, 168, 0.4)'; // Teal ghost nodes
        }

        ctx.fill();

        // Draw border for selected/hovered
        if (isHovered || isSelected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        // Draw label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(label, node.x, node.y + 12);

        // Draw similarity badge for ghost nodes
        if (!isCurrent && node.similarity) {
            const badgeText = `${Math.round(node.similarity * 100)}%`;
            ctx.font = `${fontSize * 0.8}px Sans-Serif`;
            ctx.fillStyle = '#10b981';
            ctx.fillText(badgeText, node.x, node.y - 12);
        }
    }, [hoveredNode, selectedNode]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
                        Skill Adjacency Graph
                    </CardTitle>
                    <CardDescription>
                        Explore related skills based on AI-powered similarity analysis
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Control Panel */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <Button
                            onClick={() => calculateAdjacency(currentSkillIds)}
                            disabled={loading || currentSkillIds.length === 0}
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
                                {graphData.nodes.filter(n => n.isCurrent).length} current skills •{' '}
                                {graphData.nodes.filter(n => !n.isCurrent).length} adjacent skills
                            </div>
                        )}
                    </div>

                    {/* Graph Visualization */}
                    {graphData.nodes.length > 0 && (
                        <div className="border rounded-lg bg-[var(--bg-secondary)] relative" style={{ height: '500px' }}>
                            <ForceGraph2D
                                graphData={graphData}
                                nodeLabel="name"
                                nodeCanvasObject={nodeCanvasObject}
                                onNodeClick={handleNodeClick}
                                onNodeHover={(node) => setHoveredNode(node as SkillNode | null)}
                                linkWidth={(link: any) => link.value * 3}
                                linkColor={() => 'rgba(139, 92, 246, 0.3)'}
                                linkDirectionalParticles={2}
                                linkDirectionalParticleWidth={2}
                                enableZoomInteraction={true}
                                enablePanInteraction={true}
                                cooldownTicks={100}
                                d3AlphaDecay={0.02}
                                d3VelocityDecay={0.3}
                            />

                            {/* Legend */}
                            <div className="absolute top-4 right-4 bg-[var(--bg-secondary)]/90 backdrop-blur p-3 rounded-lg shadow-lg text-xs space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]"></div>
                                    <span>Current Skills</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)] opacity-40"></div>
                                    <span>Adjacent Skills</span>
                                </div>
                                <div className="text-muted-foreground mt-2 pt-2 border-t">
                                    Click nodes for details
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {graphData.nodes.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Select skills or an occupation to view the adjacency graph</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Selected Node Details */}
            {selectedNode && !selectedNode.isCurrent && (
                <Card className="border-[var(--accent-primary)]/20">
                    <CardHeader>
                        <CardTitle className="text-lg">{selectedNode.name}</CardTitle>
                        <CardDescription>
                            Similar to your current skills by {Math.round((selectedNode.similarity || 0) * 100)}%
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
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
                </Card>
            )}
        </div>
    );
}
