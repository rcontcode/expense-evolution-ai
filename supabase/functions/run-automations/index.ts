import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead } = await req.json();
    if (!lead) {
      return new Response(JSON.stringify({ error: 'No lead provided' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fetch active automation rules
    const rulesRes = await fetch(`${supabaseUrl}/rest/v1/automation_rules?is_enabled=eq.true&order=created_at.asc`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
      },
    });

    if (!rulesRes.ok) {
      console.error('Failed to fetch rules:', await rulesRes.text());
      return new Response(JSON.stringify({ executed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rules = await rulesRes.json();
    const executed: string[] = [];

    for (const rule of rules) {
      const triggerType = rule.trigger_type;
      const leadPriority = lead.priority || 'cold';

      // Check if rule trigger matches this lead
      let matches = false;
      if (triggerType === 'new_lead') {
        matches = true;
      } else if (triggerType === leadPriority) {
        matches = true;
      }

      if (!matches) continue;

      // Only execute immediate rules (delay_minutes = 0) for now
      if (rule.delay_minutes > 0) continue;

      const actionType = rule.action_type;
      const actionConfig = rule.action_config || {};

      // Log the automation execution as an interaction
      await fetch(`${supabaseUrl}/rest/v1/lead_interactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          interaction_type: 'automation',
          direction: 'outbound',
          notes: `[AUTO] Rule "${rule.name}" triggered: ${actionType}`,
        }),
      });

      // If action is to auto-contact (mark contacted)
      if (actionConfig.auto_contact) {
        await fetch(`${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lead.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            contacted_at: new Date().toISOString(),
            contact_notes: `Auto-contacted by rule: ${rule.name}`,
          }),
        });
      }

      executed.push(rule.name);
    }

    console.log(`Executed ${executed.length} automation rules for lead ${lead.id}:`, executed);

    return new Response(JSON.stringify({ executed: executed.length, rules: executed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in run-automations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
