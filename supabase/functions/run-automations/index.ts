import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ActionResult {
  status: 'success' | 'failed' | 'skipped';
  data: Record<string, unknown>;
}

async function dbPatch(url: string, headers: Record<string, string>, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`PATCH ${url} failed:`, await res.text());
  return res;
}

async function dbPost(url: string, headers: Record<string, string>, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`POST ${url} failed:`, await res.text());
  return res;
}

async function executeAIMessage(
  supabaseUrl: string, serviceKey: string, lead: any, rule: any, actionConfig: any, actionType: string, lovableApiKey: string | undefined
): Promise<ActionResult> {
  if (!lovableApiKey) {
    return { status: 'skipped', data: { reason: 'LOVABLE_API_KEY not configured' } };
  }

  const msgRes = await fetch(`${supabaseUrl}/functions/v1/generate-lead-message`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead,
      messageType: actionConfig.message_type || actionType,
      language: actionConfig.language || 'es',
      targetApp: actionConfig.target_app || 'evofinz',
      templateType: actionConfig.template_type || 'first_contact',
    }),
  });

  if (!msgRes.ok) {
    const errText = await msgRes.text();
    console.error(`AI message failed for rule ${rule.name}:`, errText);
    return { status: 'failed', data: { error: errText } };
  }

  const msgData = await msgRes.json();
  return {
    status: 'success',
    data: { message: msgData.message, messageType: actionType, templateType: actionConfig.template_type },
  };
}

async function executeAutoContact(supabaseUrl: string, headers: Record<string, string>, lead: any, rule: any): Promise<ActionResult> {
  await dbPatch(`${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lead.id}`, headers, {
    contacted_at: new Date().toISOString(),
    contact_notes: `Auto-contacted by rule: ${rule.name}`,
  });
  return { status: 'success', data: { action: 'auto_contact' } };
}

async function executeAutoTag(supabaseUrl: string, headers: Record<string, string>, lead: any, actionConfig: any): Promise<ActionResult> {
  const tagsToAdd = actionConfig.tags || [];
  if (tagsToAdd.length === 0) {
    return { status: 'skipped', data: { reason: 'No tags configured' } };
  }
  const existingTags = lead.tags || [];
  const mergedTags = [...new Set([...existingTags, ...tagsToAdd])];
  await dbPatch(`${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lead.id}`, headers, { tags: mergedTags });
  return { status: 'success', data: { tags_added: tagsToAdd, total_tags: mergedTags } };
}

async function executeAutoStage(supabaseUrl: string, headers: Record<string, string>, lead: any, actionConfig: any): Promise<ActionResult> {
  const stage = actionConfig.stage || 'new';
  await dbPatch(`${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lead.id}`, headers, { pipeline_stage: stage });
  return { status: 'success', data: { stage } };
}

async function executeAutoFollowup(supabaseUrl: string, headers: Record<string, string>, lead: any, rule: any, actionConfig: any): Promise<ActionResult> {
  const delayHours = actionConfig.followup_delay_hours || 72;
  const followupType = actionConfig.followup_type || 'call';
  const scheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();

  await dbPost(`${supabaseUrl}/rest/v1/lead_follow_ups`, headers, {
    lead_id: lead.id,
    follow_up_type: followupType,
    scheduled_at: scheduledAt,
    notes: `[AUTO] Created by rule: ${rule.name}`,
    status: 'pending',
  });
  return { status: 'success', data: { scheduled_at: scheduledAt, type: followupType } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead } = await req.json();
    if (!lead?.id) {
      return new Response(JSON.stringify({ error: 'No lead provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const headers = {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
    };

    // Fetch active automation rules
    const rulesRes = await fetch(
      `${supabaseUrl}/rest/v1/automation_rules?is_enabled=eq.true&order=created_at.asc`,
      { headers }
    );

    if (!rulesRes.ok) {
      console.error('Failed to fetch rules:', await rulesRes.text());
      return new Response(JSON.stringify({ executed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rules = await rulesRes.json();
    const executed: string[] = [];
    const leadPriority = lead.priority || 'cold';

    for (const rule of rules) {
      // Check trigger match
      const matches = rule.trigger_type === 'new_lead' || rule.trigger_type === leadPriority;
      if (!matches) continue;

      // Skip delayed rules (no cron yet)
      if ((rule.delay_minutes || 0) > 0) continue;

      const actionType = rule.action_type;
      const actionConfig = rule.action_config || {};
      let result: ActionResult;

      try {
        switch (actionType) {
          case 'whatsapp':
          case 'email':
            result = await executeAIMessage(supabaseUrl, serviceKey, lead, rule, actionConfig, actionType, lovableApiKey);
            // Mark as auto-contacted on success
            if (result.status === 'success') {
              await dbPatch(`${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lead.id}`, headers, {
                contacted_at: new Date().toISOString(),
                contact_notes: `[AUTO] ${actionType} generated by rule: ${rule.name}`,
              });
            }
            break;
          case 'auto_contact':
            result = await executeAutoContact(supabaseUrl, headers, lead, rule);
            break;
          case 'auto_tag':
            result = await executeAutoTag(supabaseUrl, headers, lead, actionConfig);
            break;
          case 'auto_stage':
            result = await executeAutoStage(supabaseUrl, headers, lead, actionConfig);
            break;
          case 'auto_followup':
            result = await executeAutoFollowup(supabaseUrl, headers, lead, rule, actionConfig);
            break;
          default:
            result = { status: 'skipped', data: { reason: `Unknown action_type: ${actionType}` } };
        }

        // Log as interaction
        await dbPost(`${supabaseUrl}/rest/v1/lead_interactions`, headers, {
          lead_id: lead.id,
          interaction_type: 'automation',
          direction: 'outbound',
          notes: `[AUTO] Rule "${rule.name}" → ${actionType} (${result.status})`,
        });

      } catch (actionErr) {
        console.error(`Action error for rule ${rule.name}:`, actionErr);
        result = { status: 'failed', data: { error: String(actionErr) } };
      }

      // Log to automation_logs + update rule stats in parallel
      await Promise.all([
        dbPost(`${supabaseUrl}/rest/v1/automation_logs`, headers, {
          rule_id: rule.id,
          lead_id: lead.id,
          action_type: actionType,
          status: result.status,
          result_data: result.data,
        }),
        dbPatch(`${supabaseUrl}/rest/v1/automation_rules?id=eq.${rule.id}`, headers, {
          execution_count: (rule.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString(),
        }),
      ]);

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
