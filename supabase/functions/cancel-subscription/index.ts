import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            throw new Error('Not authenticated');
        }

        const { subscriptionId } = await req.json();

        // STUB: Mock subscription cancellation
        // TODO: Integrate with Stripe API to actually cancel subscription

        const mockResponse = {
            success: true,
            subscriptionId,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            effectiveUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            message: 'Subscription will be cancelled at the end of your current billing period',
            refundEligible: false
        };

        // TODO: Update subscription record in database
        // await supabaseClient.from('subscriptions').update({...})

        return new Response(
            JSON.stringify(mockResponse),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});
