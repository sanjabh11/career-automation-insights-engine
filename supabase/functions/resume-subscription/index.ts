import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
            return new Response(
                JSON.stringify({ error: 'Not authenticated' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { subscriptionId } = await req.json();
        if (!subscriptionId) {
            return new Response(
                JSON.stringify({ error: 'subscriptionId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const serviceClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: sub, error: subError } = await serviceClient
            .from('subscriptions')
            .select('stripe_subscription_id, user_id, status')
            .eq('user_id', user.id)
            .single();

        if (subError || !sub) {
            return new Response(
                JSON.stringify({ error: 'Subscription not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        const stripeSub = await stripe.subscriptions.resume(sub.stripe_subscription_id);

        await serviceClient
            .from('subscriptions')
            .update({
                status: 'active',
                cancelled_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        return new Response(
            JSON.stringify({
                success: true,
                subscriptionId,
                status: 'active',
                message: 'Subscription resumed successfully',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('resume-subscription error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
