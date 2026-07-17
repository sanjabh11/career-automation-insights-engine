import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// This worker is intentionally service-role-only. The Supabase gateway may
// validate a JWT before invocation, but a normal user JWT must never be able
// to claim or delete another user's report artifacts.
function isServiceRoleRequest(req: Request, serviceRoleKey: string | undefined): boolean {
    const authorization = req.headers.get('Authorization') || '';
    return Boolean(serviceRoleKey) && authorization === `Bearer ${serviceRoleKey}`;
}

function parseLimit(value: unknown): number {
    if (typeof value !== 'number' || !Number.isInteger(value)) return 20;
    return Math.min(Math.max(value, 1), 100);
}

serve(async (req) => {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!isServiceRoleRequest(req, serviceRoleKey)) {
        return new Response(JSON.stringify({ success: false, error: 'Service-role authorization required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase worker configuration is incomplete');
        }

        const body = (await req.json().catch(() => ({}))) as { limit?: unknown };
        const limit = parseLimit(body?.limit);
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { data: releasedReservations, error: reservationError } = await supabase.rpc(
            'release_expired_report_reservations',
            { p_limit: limit },
        );
        if (reservationError) throw new Error(`Expired reservation release failed: ${reservationError.message}`);

        const { data: rows, error: claimError } = await supabase.rpc('claim_report_cleanup_batch', {
            p_limit: limit,
        });
        if (claimError) throw new Error(`Cleanup queue claim failed: ${claimError.message}`);

        const results: Array<{ queue_id: string; status: 'completed' | 'failed'; error?: string }> = [];
        for (const row of rows || []) {
            const queueId = row.id as string;
            const artifactPath = typeof row.artifact_path === 'string' ? row.artifact_path : '';
            let storageError: string | undefined;

            if (!artifactPath) {
                storageError = 'Cleanup row has no artifact path';
            } else {
                const { error } = await supabase.storage
                    .from('coach-report-artifacts')
                    .remove([artifactPath]);
                if (error) storageError = error.message;
            }

            const { data: finalized, error: finalizeError } = await supabase.rpc(
                'finalize_report_cleanup_queue',
                {
                    p_queue_id: queueId,
                    p_storage_deleted: !storageError,
                    p_error: storageError || null,
                },
            );

            if (finalizeError || finalized !== true) {
                results.push({
                    queue_id: queueId,
                    status: 'failed',
                    error: finalizeError?.message || storageError || 'Cleanup finalization was not confirmed',
                });
            } else {
                results.push({
                    queue_id: queueId,
                    status: storageError ? 'failed' : 'completed',
                    ...(storageError ? { error: storageError } : {}),
                });
            }
        }

        return new Response(JSON.stringify({
            success: results.every((result) => result.status === 'completed'),
            released_reservations: releasedReservations || 0,
            claimed: results.length,
            results,
            evidence_boundary: 'Service-role cleanup execution only; it does not prove retention compliance until deployed scheduling and storage results are observed.',
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Cleanup worker failed';
        console.error('Report artifact cleanup failed:', message);
        return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
