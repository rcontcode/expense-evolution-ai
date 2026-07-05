// Temporary probe: posts to webhook-leads using LEADS_WEBHOOK_SHARED_SECRET
// from env. Delete after verification.
Deno.serve(async () => {
  const secret = Deno.env.get('LEADS_WEBHOOK_SHARED_SECRET') ?? '';
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-leads`;
  const email = `probe-good-${Date.now()}@example.com`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-leads-secret': secret },
    body: JSON.stringify({ name: 'Probe OK', email, source: 'auth-test-probe' }),
  });
  const body = await res.text();
  return new Response(
    JSON.stringify({ status: res.status, body: body.slice(0, 500), email, secret_len: secret.length }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
