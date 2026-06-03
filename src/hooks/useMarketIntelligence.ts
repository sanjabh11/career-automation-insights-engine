import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch market intelligence data for an occupation
 * Uses the market-intelligence Edge Function to get comprehensive market data
 */
export function useMarketIntelligence(occupationCode: string | null) {
    return useQuery({
        queryKey: ['market-intelligence', occupationCode],
        queryFn: async () => {
            if (!occupationCode) return null;

            // In local dev, skip calling the Edge Function unless explicitly enabled
            const enableDev = import.meta.env.VITE_ENABLE_MARKET_INTEL_DEV === 'true';
            const isDevBuild = !!import.meta.env.DEV;
            if (isDevBuild && !enableDev) {
                return null;
            }

            const { data, error } = await supabase.functions.invoke('market-intelligence', {
                body: {
                    occupation: occupationCode.replace(/\.00$/, ''), // Required field
                    occupationCode: occupationCode.replace(/\.00$/, ''),
                    location: 'United States',
                    timeframe: 5
                }
            });

            if (error) {
                console.error('Market intelligence error:', error);
                throw error;
            }

            return data;
        },
        enabled: !!occupationCode,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours - market data doesn't change frequently
        retry: 2,
        retryDelay: 1000
    });
}
