const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for security
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('authorization');

    // Allow either cron-secret or valid service role bearer token
    const isAuthorized = cronSecret === expectedSecret || 
      authHeader === `Bearer ${expectedSecret}`;

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const headers = {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
    };

    let processed = 0;
    const results: string[] = [];

    // ────────────────────────────────────────────────────
    // PART 1: Process delayed automation rules (existing)
    // ────────────────────────────────────────────────────
    const rulesRes = await fetch(
      `${supabaseUrl}/rest/v1/automation_rules?is_enabled=eq.true&delay_minutes=gt.0&select=*`,
      { headers }
    );

    if (rulesRes.ok) {
      const rules = await rulesRes.json();

      for (const rule of rules) {
        const delayMinutes = rule.delay_minutes || 0;
        const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        let leadsQuery = `${supabaseUrl}/rest/v1/quiz_leads?created_at=gte.${sevenDaysAgo}&created_at=lte.${cutoffTime}&select=*&limit=50`;
        
        if (rule.trigger_type !== 'new_lead') {
          leadsQuery += `&priority=eq.${rule.trigger_type}`;
        }

        const leadsRes = await fetch(leadsQuery, { headers });
        if (!leadsRes.ok) continue;

        const leads = await leadsRes.json();

        for (const lead of leads) {
          const logCheck = await fetch(
            `${supabaseUrl}/rest/v1/automation_logs?rule_id=eq.${rule.id}&lead_id=eq.${lead.id}&status=eq.success&select=id&limit=1`,
            { headers }
          );
          if (logCheck.ok) {
            const existing = await logCheck.json();
            if (existing.length > 0) continue;
          }

          const conditions = rule.trigger_condition;
          if (conditions && Array.isArray(conditions)) {
            let skip = false;
            for (const cond of conditions) {
              const leadVal = lead[cond.field];
              const op = cond.operator || 'eq';
              const val = cond.value;
              if (op === 'eq' && String(leadVal).toLowerCase() !== String(val).toLowerCase()) { skip = true; break; }
              if (op === 'gte' && Number(leadVal || 0) < Number(val)) { skip = true; break; }
              if (op === 'exists' && val === true && !leadVal) { skip = true; break; }
            }
            if (skip) continue;
          }

          try {
            const execRes = await fetch(`${supabaseUrl}/functions/v1/run-automations`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ lead }),
            });
            if (execRes.ok) {
              processed++;
              results.push(`${rule.name} → ${lead.name || lead.email}`);
            }
          } catch (e) {
            console.error(`Delayed exec error for rule ${rule.name}, lead ${lead.id}:`, e);
          }
        }
      }
    }

    // ────────────────────────────────────────────────────
    // PART 2: Process nurturing sequence logs
    // ────────────────────────────────────────────────────
    let nurturingProcessed = 0;

    const now = new Date().toISOString();
    const pendingLogsRes = await fetch(
      `${supabaseUrl}/rest/v1/lead_nurturing_log?status=eq.pending&scheduled_for=lte.${now}&select=*&limit=50&order=scheduled_for.asc`,
      { headers }
    );

    if (pendingLogsRes.ok) {
      const pendingLogs = await pendingLogsRes.json();

      for (const log of pendingLogs) {
        try {
          // Get the sequence to check if still enabled
          const seqRes = await fetch(
            `${supabaseUrl}/rest/v1/lead_nurturing_sequences?id=eq.${log.sequence_id}&is_enabled=eq.true&select=*&limit=1`,
            { headers }
          );
          if (!seqRes.ok) continue;
          const seqs = await seqRes.json();
          if (seqs.length === 0) {
            // Sequence disabled — skip this log
            await fetch(`${supabaseUrl}/rest/v1/lead_nurturing_log?id=eq.${log.id}`, {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ status: 'skipped', executed_at: now }),
            });
            continue;
          }

          const sequence = seqs[0];
          const steps = sequence.steps || [];
          const step = steps[log.step_index];

          // Get lead info
          const leadRes = await fetch(
            `${supabaseUrl}/rest/v1/quiz_leads?id=eq.${log.lead_id}&select=*&limit=1`,
            { headers }
          );
          if (!leadRes.ok) continue;
          const leads = await leadRes.json();
          if (leads.length === 0) continue;
          const lead = leads[0];

          // Check if lead was already contacted (skip if so)
          if (lead.contacted_at) {
            await fetch(`${supabaseUrl}/rest/v1/lead_nurturing_log?id=eq.${log.id}`, {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ status: 'skipped', executed_at: now, message_generated: 'Lead already contacted — skipped' }),
            });
            continue;
          }

          // Generate a simple message based on step config
          const messageHint = step?.message_hint || step?.template_type || 'follow_up';
          const channel = step?.channel || 'whatsapp';
          const message = `[${channel.toUpperCase()}] Nurturing paso ${log.step_index + 1} para ${lead.name || lead.email}: ${messageHint}`;

          // Mark as sent
          await fetch(`${supabaseUrl}/rest/v1/lead_nurturing_log?id=eq.${log.id}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              status: 'sent',
              executed_at: now,
              message_generated: message,
            }),
          });

          nurturingProcessed++;
          results.push(`Nurturing: ${sequence.name} step ${log.step_index + 1} → ${lead.name || lead.email}`);
        } catch (e) {
          console.error(`Nurturing error for log ${log.id}:`, e);
        }
      }
    }

    processed += nurturingProcessed;
    console.log(`Delayed automations: processed ${processed} total (${nurturingProcessed} nurturing)`);

    // Notify admin if there were executions
    if (processed > 0) {
      try {
        const adminRes = await fetch(
          `${supabaseUrl}/rest/v1/user_roles?role=eq.admin&select=user_id`,
          { headers }
        );
        if (adminRes.ok) {
          const admins = await adminRes.json();
          for (const admin of admins) {
            await fetch(`${supabaseUrl}/rest/v1/ecosystem_notifications`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({
                user_id: admin.user_id,
                notification_type: 'automation_delayed',
                source_app: 'evofinz',
                title_es: '⏰ Automatizaciones diferidas ejecutadas',
                title_en: '⏰ Delayed automations executed',
                message_es: `Se ejecutaron ${processed} automatizaciones (${nurturingProcessed} nurturing): ${results.slice(0, 3).join(', ')}${results.length > 3 ? '...' : ''}`,
                message_en: `${processed} automations executed (${nurturingProcessed} nurturing): ${results.slice(0, 3).join(', ')}${results.length > 3 ? '...' : ''}`,
                emoji: '⏰',
                action_url: '/admin?tab=automation',
              }),
            });
          }
        }
      } catch (notifErr) {
        console.error('Failed to notify admins:', notifErr);
      }
    }

    return new Response(JSON.stringify({ processed, nurturingProcessed, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in run-delayed-automations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
