const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSign(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { event, payload } = await req.json();
    if (!event || !payload) {
      return new Response(JSON.stringify({ error: 'event and payload required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey, 'Content-Type': 'application/json' };

    // Fetch active webhooks that listen to this event
    const whRes = await fetch(
      `${supabaseUrl}/rest/v1/outgoing_webhooks?is_active=eq.true&events=cs.{${event}}&select=*`,
      { headers }
    );
    if (!whRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch webhooks' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhooks = await whRes.json();
    const results: Array<{ webhook_id: string; status: number | null; ok: boolean }> = [];

    for (const wh of webhooks) {
      const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
      const signature = await hmacSign(wh.secret_key, body);
      let responseStatus: number | null = null;
      let responseBody = '';
      let ok = false;

      try {
        const res = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
          },
          body,
        });
        responseStatus = res.status;
        responseBody = (await res.text()).substring(0, 1000);
        ok = res.ok;
      } catch (e) {
        responseBody = e instanceof Error ? e.message : 'Unknown error';
      }

      // Log
      await fetch(`${supabaseUrl}/rest/v1/outgoing_webhook_logs`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          webhook_id: wh.id,
          event,
          payload,
          response_status: responseStatus,
          response_body: responseBody,
        }),
      });

      results.push({ webhook_id: wh.id, status: responseStatus, ok });
    }

    return new Response(JSON.stringify({ dispatched: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('dispatch-outgoing-webhook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
