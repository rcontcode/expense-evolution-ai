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

    // Fetch enabled rules WITH delay > 0
    const rulesRes = await fetch(
      `${supabaseUrl}/rest/v1/automation_rules?is_enabled=eq.true&delay_minutes=gt.0&select=*`,
      { headers }
    );

    if (!rulesRes.ok) {
      console.error('Failed to fetch delayed rules:', await rulesRes.text());
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rules = await rulesRes.json();
    if (rules.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No delayed rules found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    const results: string[] = [];

    for (const rule of rules) {
      const delayMinutes = rule.delay_minutes || 0;
      const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000).toISOString();

      // Find leads created before the cutoff that haven't been processed by this rule
      // Step 1: Get leads matching the trigger type created within a reasonable window (7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      let leadsQuery = `${supabaseUrl}/rest/v1/quiz_leads?created_at=gte.${sevenDaysAgo}&created_at=lte.${cutoffTime}&select=*&limit=50`;
      
      // Filter by priority if not new_lead
      if (rule.trigger_type !== 'new_lead') {
        leadsQuery += `&priority=eq.${rule.trigger_type}`;
      }

      const leadsRes = await fetch(leadsQuery, { headers });
      if (!leadsRes.ok) continue;

      const leads = await leadsRes.json();

      for (const lead of leads) {
        // Check if already executed (dedup)
        const logCheck = await fetch(
          `${supabaseUrl}/rest/v1/automation_logs?rule_id=eq.${rule.id}&lead_id=eq.${lead.id}&status=eq.success&select=id&limit=1`,
          { headers }
        );
        if (logCheck.ok) {
          const existing = await logCheck.json();
          if (existing.length > 0) continue;
        }

        // Evaluate trigger conditions
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

        // Execute via run-automations (it will handle the action)
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

    console.log(`Delayed automations: processed ${processed} lead-rule pairs`);

    // Notify admin if there were executions
    if (processed > 0) {
      try {
        // Get admin user IDs
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
                message_es: `Se ejecutaron ${processed} automatizaciones diferidas: ${results.slice(0, 3).join(', ')}${results.length > 3 ? '...' : ''}`,
                message_en: `${processed} delayed automations executed: ${results.slice(0, 3).join(', ')}${results.length > 3 ? '...' : ''}`,
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

    return new Response(JSON.stringify({ processed, results }), {
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
