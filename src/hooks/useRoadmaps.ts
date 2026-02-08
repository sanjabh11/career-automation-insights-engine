import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeminiService } from '@/services/GeminiService';
import { toast } from 'sonner';

export interface Milestone {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    order_index: number;
}

export interface Roadmap {
    id: string;
    target_role: string;
    current_role: string | null;
    status: 'active' | 'completed' | 'archived';
    generated_at: string;
    milestones?: Milestone[];
}

export function useRoadmaps() {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const fetchRoadmaps = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setRoadmaps([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('roadmaps')
                .select('*, milestones(*)')
                .order('generated_at', { ascending: false });

            if (error) throw error;

            // Sort milestones by order_index
            const sortedData = data?.map(r => ({
                ...r,
                milestones: r.milestones?.sort((a: Milestone, b: Milestone) => a.order_index - b.order_index)
            }));

            setRoadmaps(sortedData || []);
        } catch (err: any) {
            console.error('Error fetching roadmaps:', err);
            toast.error('Failed to load roadmaps');
        } finally {
            setLoading(false);
        }
    };

    const generateRoadmap = async (targetRole: string, startingRole: string) => {
        try {
            console.log('Starting roadmap generation for:', { targetRole, startingRole });
            setGenerating(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.error('User not authenticated');
                throw new Error('User not authenticated');
            }
            console.log('User authenticated:', user.id);

            // 1. Generate content via Edge Function (V2)
            console.log('Calling generate-roadmap Edge Function...');
            const { data: roadmapData, error: functionError } = await supabase.functions.invoke('generate-roadmap', {
                body: { targetRole, startingRole }
            });

            if (functionError) {
                console.error('Edge Function Error:', functionError);
                throw new Error(functionError.message || 'Failed to generate roadmap');
            }

            console.log('Edge Function Response:', roadmapData);

            if (!roadmapData || !roadmapData.roadmap) {
                console.error('Invalid AI response format:', roadmapData);
                throw new Error('Invalid AI response format');
            }

            const { roadmap: aiRoadmap } = roadmapData;
            console.log('Parsed AI Roadmap:', aiRoadmap);

            // 2. Create Roadmap in DB
            console.log('Inserting roadmap into DB...');
            const { data: roadmap, error: roadmapError } = await supabase
                .from('roadmaps')
                .insert([{
                    user_id: user.id,
                    target_role: targetRole,
                    current_role: startingRole,
                }])
                .select()
                .single();

            if (roadmapError) {
                console.error('DB Insert Error (Roadmap):', roadmapError);
                throw roadmapError;
            }
            console.log('Roadmap inserted:', roadmap);

            // 3. Create Milestones in DB
            console.log('Preparing milestones for insertion...');
            let allMilestones: any[] = [];
            let orderIndex = 0;

            if (aiRoadmap.phases && Array.isArray(aiRoadmap.phases)) {
                aiRoadmap.phases.forEach((phase: any) => {
                    if (phase.milestones && Array.isArray(phase.milestones)) {
                        phase.milestones.forEach((m: any) => {
                            allMilestones.push({
                                roadmap_id: roadmap.id,
                                title: m.title,
                                description: `[${phase.title}] ${m.description}`,
                                order_index: orderIndex++,
                                status: 'pending'
                            });
                        });
                    }
                });
            }

            console.log(`Inserting ${allMilestones.length} milestones...`);
            const { error: milestonesError } = await supabase
                .from('milestones')
                .insert(allMilestones);

            if (milestonesError) {
                console.error('DB Insert Error (Milestones):', milestonesError);
                throw milestonesError;
            }

            console.log('Milestones inserted successfully');
            toast.success('Roadmap generated successfully!');

            console.log('Refreshing roadmaps list...');
            await fetchRoadmaps();
            return roadmap.id;
        } catch (err: any) {
            console.error('Error generating roadmap (CATCH BLOCK):', err);
            toast.error(err.message || 'Failed to generate roadmap');
            throw err;
        } finally {
            setGenerating(false);
        }
    };

    const updateMilestoneStatus = async (id: string, status: 'pending' | 'in_progress' | 'completed') => {
        try {
            const { error } = await supabase
                .from('milestones')
                .update({
                    status,
                    completed_at: status === 'completed' ? new Date().toISOString() : null
                })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setRoadmaps(prev => prev.map(r => ({
                ...r,
                milestones: r.milestones?.map(m => m.id === id ? { ...m, status } : m)
            })));

            if (status === 'completed') {
                toast.success('Milestone completed!');
            }
        } catch (err: any) {
            console.error('Error updating milestone:', err);
            toast.error('Failed to update milestone');
        }
    };

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    return {
        roadmaps,
        loading,
        generating,
        generateRoadmap,
        updateMilestoneStatus,
        refreshRoadmaps: fetchRoadmaps
    };
}
