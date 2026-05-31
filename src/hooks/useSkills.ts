import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserSkill {
    id: string;
    user_id: string;
    skill_name: string;
    proficiency: number;
    created_at: string;
}

function getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null && 'message' in err) {
        const message = (err as { message?: unknown }).message;
        if (typeof message === 'string' && message.length > 0) return message;
    }
    return fallback;
}

export function useSkills() {
    const [skills, setSkills] = useState<UserSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSkills = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setSkills([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('user_skills')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setSkills(data || []);
        } catch (err: unknown) {
            console.error('Error fetching skills:', err);
            setError(getErrorMessage(err, 'Failed to fetch skills'));
        } finally {
            setLoading(false);
        }
    };

    const addSkill = async (skillName: string, proficiency: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('user_skills')
                .insert([
                    { user_id: user.id, skill_name: skillName, proficiency }
                ])
                .select()
                .single();

            if (error) throw error;

            setSkills([data, ...skills]);
            toast.success('Skill added successfully');
            return data;
        } catch (err: unknown) {
            console.error('Error adding skill:', err);
            toast.error(getErrorMessage(err, 'Failed to add skill'));
            throw err;
        }
    };

    const updateSkill = async (id: string, proficiency: number) => {
        try {
            const { data, error } = await supabase
                .from('user_skills')
                .update({ proficiency })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setSkills(skills.map(s => s.id === id ? data : s));
            toast.success('Skill updated successfully');
            return data;
        } catch (err: unknown) {
            console.error('Error updating skill:', err);
            toast.error(getErrorMessage(err, 'Failed to update skill'));
            throw err;
        }
    };

    const deleteSkill = async (id: string) => {
        try {
            const { error } = await supabase
                .from('user_skills')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSkills(skills.filter(s => s.id !== id));
            toast.success('Skill removed successfully');
        } catch (err: unknown) {
            console.error('Error deleting skill:', err);
            toast.error(getErrorMessage(err, 'Failed to delete skill'));
            throw err;
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    return {
        skills,
        loading,
        error,
        addSkill,
        updateSkill,
        deleteSkill,
        refreshSkills: fetchSkills
    };
}
