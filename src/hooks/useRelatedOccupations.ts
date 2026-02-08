import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RelatedOccupation {
    code: string;
    title: string;
    similarity_score: number;
    relationship_type?: string;
}

/**
 * Hook to fetch related occupations from O*NET data
 * Uses the onet_related_occupations table or falls back to O*NET API
 */
export function useRelatedOccupations(occupationCode: string | null) {
    return useQuery({
        queryKey: ['related-occupations', occupationCode],
        queryFn: async () => {
            if (!occupationCode) return [];

            const normalizedCode = occupationCode.replace(/\.00$/, '');

            // First, try to get from our database
            const { data: dbData, error: dbError } = await supabase
                .from('onet_related_occupations')
                .select('*')
                .eq('occupation_code', normalizedCode)
                .order('similarity_score', { ascending: false })
                .limit(3);

            if (!dbError && dbData && dbData.length > 0) {
                return dbData as RelatedOccupation[];
            }

            // Fallback: Try to fetch from O*NET API via Edge Function
            try {
                const { data: apiData, error: apiError } = await supabase.functions.invoke('fetch-related-occupations', {
                    body: { occupationCode: normalizedCode }
                });

                if (!apiError && apiData && Array.isArray(apiData)) {
                    return apiData.slice(0, 3) as RelatedOccupation[];
                }
            } catch (err) {
                // Silently fail - this is expected if function doesn't exist
                // No console.warn to avoid cluttering console
            }

            // If all else fails, return empty array (component will show fallback UI)
            return [];
        },
        enabled: !!occupationCode,
        staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - related occupations are relatively stable
        retry: 1
    });
}
