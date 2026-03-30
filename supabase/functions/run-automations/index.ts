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

// ===== DEDUP GUARD =====
async function wasAlreadyExecuted(
  supabaseUrl: string, headers: Record<string, string>, ruleId: string, leadId: string
): Promise<boolean> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/automation_logs?rule_id=eq.${ruleId}&lead_id=eq.${leadId}&status=eq.success&select=id&limit=1`,
    { headers }
  );
  if (!res.ok) return false;
  const data = await res.json();
  return data.length > 0;
}

// ===== TRIGGER CONDITION EVALUATOR =====
function evaluateTriggerConditions(lead: any, conditions: any): { match: boolean; reason?: string } {
  if (!conditions || typeof conditions !== 'object') return { match: true };
  const conds = Array.isArray(conditions) ? conditions : [conditions];

  for (const cond of conds) {
    const field = cond.field;
    const op = cond.operator || 'eq';
    const value = cond.value;
    if (!field) continue;

    const leadVal = lead[field];

    switch (op) {
      case 'eq':
        if (String(leadVal).toLowerCase() !== String(value).toLowerCase()) return { match: false, reason: `${field} != ${value}` };
        break;
      case 'neq':
        if (String(leadVal).toLowerCase() === String(value).toLowerCase()) return { match: false, reason: `${field} == ${value}` };
        break;
      case 'gte':
        if (Number(leadVal || 0) < Number(value)) return { match: false, reason: `${field} < ${value}` };
        break;
      case 'lte':
        if (Number(leadVal || 0) > Number(value)) return { match: false, reason: `${field} > ${value}` };
        break;
      case 'contains':
        if (!String(leadVal || '').toLowerCase().includes(String(value).toLowerCase())) return { match: false, reason: `${field} !contains ${value}` };
        break;
      case 'exists':
        if (value === true && !leadVal) return { match: false, reason: `${field} is empty` };
        if (value === false && leadVal) return { match: false, reason: `${field} is not empty` };
        break;
      default:
        break;
    }
  }
  return { match: true };
}

// ===== ACTION EXECUTORS =====
async function executeAIMessage(
  supabaseUrl: string, serviceKey: string, lead: any, rule: any, actionConfig: any, actionType: string, lovableApiKey: string | undefined
): Promise<ActionResult> {
  if (!lovableApiKey) {
    return { status: 'skipped', data: { reason: 'LOVABLE_API_KEY not configured' } };
  }

  // Step 1: Generate the message with AI
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
  const generatedMessage = msgData.message || '';

  // Step 2: For email type, attempt actual email delivery
  if (actionType === 'email' && lead.email) {
    // Parse subject from [SUBJECT: ...] format
    let subject = `${rule.name}`;
    let body = generatedMessage;
    const subjectMatch = generatedMessage.match(/\[SUBJECT:\s*(.+?)\]/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      body = generatedMessage.replace(subjectMatch[0], '').trim();
    }

    try {
      const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-crm-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: lead.email,
          recipientName: lead.name || '',
          subject,
          textBody: body,
          leadId: lead.id,
          ruleName: rule.name,
        }),
      });

      if (sendRes.ok) {
        const sendData = await sendRes.json();
        if (sendData.success && sendData.status === 'sent') {
          return {
            status: 'success',
            data: {
              message: generatedMessage,
              messageType: actionType,
              templateType: actionConfig.template_type,
              email_sent: true,
            },
          };
        }
        // Email infra not configured or failed — message generated but NOT sent
        return {
          status: 'success',
          data: {
            message: generatedMessage,
            messageType: actionType,
            templateType: actionConfig.template_type,
            email_sent: false,
            email_status: sendData.status,
            email_error: sendData.error,
          },
        };
      }
    } catch (sendErr) {
      console.error(`Email send error for ${lead.email}:`, sendErr);
    }

    // Email sending failed but message was generated
    return {
      status: 'success',
      data: {
        message: generatedMessage,
        messageType: actionType,
        templateType: actionConfig.template_type,
        email_sent: false,
        email_status: 'error',
      },
    };
  }

  // For whatsapp or other types: message generated only (no real delivery yet)
  return {
    status: 'success',
    data: {
      message: generatedMessage,
      messageType: actionType,
      templateType: actionConfig.template_type,
      email_sent: false,
    },
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
  if (tagsToAdd.length === 0) return { status: 'skipped', data: { reason: 'No tags configured' } };
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

// ===== AUTO-SAVE TEMPLATE =====
async function autoSaveTemplate(
  supabaseUrl: string, headers: Record<string, string>, result: ActionResult, actionType: string, actionConfig: any
) {
  if (result.status !== 'success' || !result.data?.message) return;
  try {
    await dbPost(`${supabaseUrl}/rest/v1/lead_message_templates`, headers, {
      name: `[AUTO] ${actionType} — ${actionConfig.template_type || 'general'}`,
      content: result.data.message,
      message_type: actionType,
      template_type: actionConfig.template_type || 'first_contact',
      target_app: actionConfig.target_app || 'evofinz',
      language: actionConfig.language || 'es',
      is_auto: true,
    });
  } catch (e) {
    console.error('Auto-save template error:', e);
  }
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
    const skipped: string[] = [];
    const leadPriority = lead.priority || 'cold';

    for (const rule of rules) {
      // Check trigger match
      const matches = rule.trigger_type === 'new_lead' || rule.trigger_type === leadPriority;
      if (!matches) continue;

      // Skip delayed rules (no cron yet)
      if ((rule.delay_minutes || 0) > 0) continue;

      // ===== TRIGGER CONDITION EVAL =====
      const condResult = evaluateTriggerConditions(lead, rule.trigger_condition);
      if (!condResult.match) {
        skipped.push(`${rule.name} (condition: ${condResult.reason})`);
        // Log as skipped
        await dbPost(`${supabaseUrl}/rest/v1/automation_logs`, headers, {
          rule_id: rule.id, lead_id: lead.id, action_type: rule.action_type,
          status: 'skipped', result_data: { reason: `Condition not met: ${condResult.reason}` },
        });
        continue;
      }

      // ===== DEDUP GUARD =====
      const alreadyDone = await wasAlreadyExecuted(supabaseUrl, headers, rule.id, lead.id);
      if (alreadyDone) {
        skipped.push(`${rule.name} (already executed)`);
        await dbPost(`${supabaseUrl}/rest/v1/automation_logs`, headers, {
          rule_id: rule.id, lead_id: lead.id, action_type: rule.action_type,
          status: 'skipped', result_data: { reason: 'already_executed' },
        });
        continue;
      }

      const actionType = rule.action_type;
      const actionConfig = rule.action_config || {};
      let result: ActionResult;

      try {
        switch (actionType) {
          case 'whatsapp':
          case 'email':
            result = await executeAIMessage(supabaseUrl, serviceKey, lead, rule, actionConfig, actionType, lovableApiKey);
            if (result.status === 'success') {
              await dbPatch(`${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lead.id}`, headers, {
                contacted_at: new Date().toISOString(),
                contact_notes: `[AUTO] ${actionType} generated by rule: ${rule.name}`,
              });
              // Auto-save as template
              await autoSaveTemplate(supabaseUrl, headers, result, actionType, actionConfig);
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
          rule_id: rule.id, lead_id: lead.id, action_type: actionType,
          status: result.status, result_data: result.data,
        }),
        dbPatch(`${supabaseUrl}/rest/v1/automation_rules?id=eq.${rule.id}`, headers, {
          execution_count: (rule.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString(),
        }),
      ]);

      executed.push(rule.name);
    }

    console.log(`Executed ${executed.length} rules, skipped ${skipped.length} for lead ${lead.id}`);

    // ===== ADMIN NOTIFICATIONS =====
    const failures = executed.length === 0 ? [] : [];
    // Check for any failed results in this run
    if (executed.length > 0 || skipped.some(s => s.includes('failed'))) {
      try {
        const adminRes = await fetch(
          `${supabaseUrl}/rest/v1/user_roles?role=eq.admin&select=user_id`,
          { headers }
        );
        if (adminRes.ok) {
          const admins = await adminRes.json();
          // Notify on executions (batch — not every single one)
          if (executed.length > 0) {
            for (const admin of admins) {
              await dbPost(`${supabaseUrl}/rest/v1/ecosystem_notifications`, headers, {
                user_id: admin.user_id,
                notification_type: 'automation_executed',
                source_app: 'evofinz',
                title_es: `⚡ ${executed.length} regla(s) ejecutada(s)`,
                title_en: `⚡ ${executed.length} rule(s) executed`,
                message_es: `Lead: ${lead.name || lead.email} → ${executed.join(', ')}`,
                message_en: `Lead: ${lead.name || lead.email} → ${executed.join(', ')}`,
                emoji: '⚡',
                action_url: '/admin?tab=automation',
              });
            }
          }
        }
      } catch (notifErr) {
        console.error('Admin notification error:', notifErr);
      }
    }

    return new Response(JSON.stringify({ executed: executed.length, rules: executed, skipped }), {
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
