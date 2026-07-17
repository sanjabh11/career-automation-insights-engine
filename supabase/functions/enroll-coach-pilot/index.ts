import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const ALLOWED_ORIGINS = [
    Deno.env.get('APP_URL') || 'http://localhost:5173',
];

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function verifyJwtAndGetUser(req: Request, supabaseUrl: string, supabaseAnonKey: string) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpError(401, 'Missing or invalid Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseAnonKey,
        },
    });
    if (!response.ok) {
        throw new HttpError(401, 'Invalid or expired token');
    }
    const user = await response.json();
    if (!user?.id) {
        throw new HttpError(401, 'Unable to verify user identity');
    }
    return { user, token };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
        );
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

        const { user } = await verifyJwtAndGetUser(req, supabaseUrl, supabaseAnonKey);
        const userId = user.id;

        const body = await req.json();
        const { country, terms_version, terms_hash } = body;

        if (!country) {
            throw new HttpError(400, 'country is required');
        }

        const allowedCountries = ['US', 'CA'];
        if (!allowedCountries.includes(country)) {
            throw new HttpError(403, 'Pilot is available in US and Canada only');
        }

        if (!terms_version) {
            throw new HttpError(400, 'terms_version is required');
        }

        if (typeof terms_hash !== 'string' || !/^[0-9a-f]{64}$/i.test(terms_hash)) {
            throw new HttpError(400, 'terms_hash must be a 64-character SHA-256 hex digest');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // G-08: Verify terms_version is approved before allowing enrollment
        const { data: termsRecord, error: termsError } = await supabase
            .from('pilot_terms_versions')
            .select('status, version, content_hash')
            .eq('version', terms_version)
            .single();

        if (termsError || !termsRecord) {
            throw new HttpError(400, `Unknown terms version: ${terms_version}`);
        }

        if (termsRecord.status !== 'approved') {
            throw new HttpError(403, `Pilot terms (${terms_version}) are not yet approved for enrollment. Status: ${termsRecord.status}`);
        }

        if (termsRecord.content_hash.toLowerCase() !== terms_hash.toLowerCase()) {
            throw new HttpError(409, 'The accepted terms hash does not match the approved terms version');
        }

        // Upsert pilot participant record
        const { data, error } = await supabase
            .from('pilot_participants')
            .upsert({
                user_id: userId,
                country: country,
                terms_version: terms_version,
                terms_hash: terms_hash.toLowerCase(),
                consent_source: 'web_enrollment',
                active: true,
                pilot_status: 'enrolled',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            throw new HttpError(500, 'Failed to enroll in pilot');
        }

        return new Response(
            JSON.stringify({
                success: true,
                enrollment: {
                    user_id: data.user_id,
                    country: data.country,
                    terms_version: data.terms_version,
                    active: data.active,
                    pilot_status: data.pilot_status,
                    enrolled_at: data.accepted_at,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
        );
    } catch (error) {
        const status = error instanceof HttpError ? error.status : 400;
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ success: false, error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
        );
    }
});
