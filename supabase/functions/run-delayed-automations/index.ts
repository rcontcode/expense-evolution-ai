const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reemplaza los merge tags del copy fijo de nurturing: {{name}}, {{stage}}.
// Si el lead no trae una etapa explícita, usa un fallback que lee natural.
function renderVars(text: string, lead: any): string {
  const firstName = String(lead?.name || '').trim().split(/\s+/)[0] || '';
  const stage = lead?.baby_stage || lead?.stage || 'que tu bebé vive ahora';
  return String(text || '')
    .replace(/\{\{\s*name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*stage\s*\}\}/gi, String(stage));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('authorization');

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
    // PART 1: Process delayed automation rules
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
    // PART 2: Process nurturing sequence logs — REAL EMAIL SENDING
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

          // Skip if lead was already contacted
          if (lead.contacted_at) {
            await fetch(`${supabaseUrl}/rest/v1/lead_nurturing_log?id=eq.${log.id}`, {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ status: 'skipped', executed_at: now, message_generated: 'Lead already contacted — skipped' }),
            });
            continue;
          }

          const channel = step?.channel || 'email';
          const messageHint = step?.message_hint || step?.template_type || 'follow_up';
          const leadSource = lead.source || 'evofinz';

          // Determine the app name from the lead source
          let targetApp = 'evofinz';
          const srcLower = (leadSource || '').toLowerCase();
          if (srcLower.includes('fokuspark')) targetApp = 'fokuspark';
          else if (srcLower.includes('universmind')) targetApp = 'universmind';

          // Un paso con `body` fijo usa copy curado (sin IA). Si no, cae al flujo de IA legacy.
          const isFixed = !!(step && typeof step.body === 'string' && step.body.trim());

          let generatedMessage = '';
          let emailSent = false;

          if (isFixed && channel === 'email') {
            // ───── COPY FIJO (nurturing Universmind Little) — sin IA ─────
            const subject = renderVars(step.subject || sequence.name, lead);
            const body = renderVars(step.body, lead);
            generatedMessage = body;

            if (lead.email) {
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
                    ruleName: sequence.name,
                    leadSource,
                    templateName: step.template_name || 'crm-universmind-little-nurture',
                    ctaText: step.cta_text || '',
                    ctaUrl: step.cta_url || '',
                    isFollowUp: false,
                    stepNumber: log.step_index + 1,
                  }),
                });
                if (sendRes.ok) {
                  const sendData = await sendRes.json();
                  emailSent = sendData.success === true;
                }
              } catch (sendErr) {
                console.error(`Fixed-copy send error for nurturing log ${log.id}:`, sendErr);
              }
            }
          } else {
            // ───── FLUJO IA (legacy, sin cambios para evofinz/fokuspark) ─────
            // Step A: Generate AI message
            try {
              const msgRes = await fetch(`${supabaseUrl}/functions/v1/generate-lead-message`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  lead,
                  messageType: channel === 'email' ? 'email' : 'whatsapp',
                  language: 'es',
                  targetApp,
                  templateType: messageHint,
                }),
              });

              if (msgRes.ok) {
                const msgData = await msgRes.json();
                generatedMessage = msgData.message || '';
              }
            } catch (aiErr) {
              console.error(`AI generation error for nurturing log ${log.id}:`, aiErr);
            }

            // Fallback message if AI generation failed
            if (!generatedMessage) {
              generatedMessage = `[${channel.toUpperCase()}] Nurturing paso ${log.step_index + 1} para ${lead.name || lead.email}: ${messageHint}`;
            }

            // Step B: If email channel and we have a message, send via send-crm-email
            if (channel === 'email' && lead.email && generatedMessage) {
              let subject = `Seguimiento paso ${log.step_index + 1}`;
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
                    ruleName: sequence.name,
                    leadSource,
                    isFollowUp: log.step_index > 0,
                    stepNumber: log.step_index + 1,
                  }),
                });

                if (sendRes.ok) {
                  const sendData = await sendRes.json();
                  emailSent = sendData.success === true;
                }
              } catch (sendErr) {
                console.error(`Email send error for nurturing log ${log.id}:`, sendErr);
              }
            }
          }

          // Mark as sent
          await fetch(`${supabaseUrl}/rest/v1/lead_nurturing_log?id=eq.${log.id}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              status: emailSent ? 'sent' : 'sent',
              executed_at: now,
              message_generated: generatedMessage,
            }),
          });

          // Log interaction
          try {
            await fetch(`${supabaseUrl}/rest/v1/lead_interactions`, {
              method: 'POST',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({
                lead_id: lead.id,
                interaction_type: channel === 'email' ? 'email' : 'note',
                direction: 'outbound',
                content: `[Nurturing] ${sequence.name} step ${log.step_index + 1}: ${generatedMessage.substring(0, 200)}`,
              }),
            });
          } catch {}

          nurturingProcessed++;
          results.push(`Nurturing: ${sequence.name} step ${log.step_index + 1} → ${lead.name || lead.email}${emailSent ? ' ✉️' : ''}`);
        } catch (e) {
          console.error(`Nurturing error for log ${log.id}:`, e);
        }
      }
    }

    processed += nurturingProcessed;

    // ────────────────────────────────────────────────────
    // PART 3: Overdue follow-up notifications
    // ────────────────────────────────────────────────────
    let overdueCount = 0;
    try {
      const overdueRes = await fetch(
        `${supabaseUrl}/rest/v1/lead_follow_ups?status=eq.pending&scheduled_at=lte.${now}&select=id,lead_id,follow_up_type,scheduled_at,notes&limit=50`,
        { headers }
      );
      if (overdueRes.ok) {
        const overdueFollowUps = await overdueRes.json();
        overdueCount = overdueFollowUps.length;

        if (overdueCount > 0) {
          // Get lead names for context
          const leadIds = [...new Set(overdueFollowUps.map((f: any) => f.lead_id))];
          const leadNamesMap: Record<string, string> = {};
          
          for (const lid of leadIds.slice(0, 10)) {
            const lRes = await fetch(
              `${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lid}&select=name,email&limit=1`,
              { headers }
            );
            if (lRes.ok) {
              const ld = await lRes.json();
              if (ld.length > 0) leadNamesMap[lid] = ld[0].name || ld[0].email || 'Unknown';
            }
          }

          const topNames = overdueFollowUps.slice(0, 3).map((f: any) => leadNamesMap[f.lead_id] || 'Lead').join(', ');

          // Notify admins
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
                  notification_type: 'followup_overdue',
                  source_app: 'evofinz',
                  title_es: `🔴 ${overdueCount} follow-up(s) vencidos`,
                  title_en: `🔴 ${overdueCount} overdue follow-up(s)`,
                  message_es: `Tienes ${overdueCount} follow-ups vencidos: ${topNames}${overdueCount > 3 ? '...' : ''}`,
                  message_en: `You have ${overdueCount} overdue follow-ups: ${topNames}${overdueCount > 3 ? '...' : ''}`,
                  emoji: '🔴',
                  action_url: '/admin/crm?tab=agenda',
                }),
              });
            }
          }
          results.push(`⚠️ ${overdueCount} overdue follow-ups notified`);
        }
      }
    } catch (overdueErr) {
      console.error('Overdue follow-ups check error:', overdueErr);
    }

    // ────────────────────────────────────────────────────
    // PART 4: Lead decay — auto-tag stale leads
    // ────────────────────────────────────────────────────
    let decayedCount = 0;
    try {
      // HOT leads not contacted in 48h → urgent notification
      const hot48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const hotRes = await fetch(
        `${supabaseUrl}/rest/v1/quiz_leads?priority=eq.hot&contacted_at=is.null&created_at=lte.${hot48h}&select=id,name,email&limit=20`,
        { headers }
      );
      if (hotRes.ok) {
        const hotLeads = await hotRes.json();
        if (hotLeads.length > 0) {
          const adminRes = await fetch(
            `${supabaseUrl}/rest/v1/user_roles?role=eq.admin&select=user_id`,
            { headers }
          );
          if (adminRes.ok) {
            const admins = await adminRes.json();
            const hotNames = hotLeads.slice(0, 3).map((l: any) => l.name || l.email).join(', ');
            for (const admin of admins) {
              await fetch(`${supabaseUrl}/rest/v1/ecosystem_notifications`, {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                  user_id: admin.user_id,
                  notification_type: 'lead_decay_urgent',
                  source_app: 'evofinz',
                  title_es: `🔥 ${hotLeads.length} leads HOT sin contactar (48h+)`,
                  title_en: `🔥 ${hotLeads.length} HOT leads uncontacted (48h+)`,
                  message_es: `Leads HOT envejeciendo: ${hotNames}${hotLeads.length > 3 ? '...' : ''}`,
                  message_en: `HOT leads aging: ${hotNames}${hotLeads.length > 3 ? '...' : ''}`,
                  emoji: '🔥',
                  action_url: '/admin/crm?tab=queue',
                }),
              });
            }
          }
          results.push(`🔥 ${hotLeads.length} HOT leads aging (48h+)`);
        }
      }

      // Leads not contacted in 7 days → auto-tag "decayed"
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const decayRes = await fetch(
        `${supabaseUrl}/rest/v1/quiz_leads?contacted_at=is.null&created_at=lte.${sevenDaysAgo}&pipeline_stage=neq.lost&select=id,tags&limit=50`,
        { headers }
      );
      if (decayRes.ok) {
        const staleLeads = await decayRes.json();
        for (const lead of staleLeads) {
          const existingTags = lead.tags || [];
          if (existingTags.includes('decayed')) continue;
          const newTags = [...existingTags, 'decayed'];
          await fetch(`${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lead.id}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ tags: newTags }),
          });
          decayedCount++;
        }
        if (decayedCount > 0) {
          results.push(`🏷️ ${decayedCount} leads tagged as "decayed"`);
        }
      }

      // Leads not contacted in 30 days → move to "lost"
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const lostRes = await fetch(
        `${supabaseUrl}/rest/v1/quiz_leads?contacted_at=is.null&created_at=lte.${thirtyDaysAgo}&pipeline_stage=neq.lost&select=id&limit=50`,
        { headers }
      );
      if (lostRes.ok) {
        const lostLeads = await lostRes.json();
        let lostCount = 0;
        for (const lead of lostLeads) {
          await fetch(`${supabaseUrl}/rest/v1/quiz_leads?id=eq.${lead.id}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ pipeline_stage: 'lost' }),
          });
          lostCount++;
        }
        if (lostCount > 0) {
          results.push(`💀 ${lostCount} leads moved to "lost"`);
        }
      }
    } catch (decayErr) {
      console.error('Lead decay error:', decayErr);
    }

    console.log(`Delayed automations: processed ${processed} total (${nurturingProcessed} nurturing), ${overdueCount} overdue, ${decayedCount} decayed`);

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

    return new Response(JSON.stringify({ processed, nurturingProcessed, overdueCount, decayedCount, results }), {
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
