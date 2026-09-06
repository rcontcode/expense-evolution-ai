const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// La etapa que la mama eligio en el quiz se guarda en la columna `situation`.
// Este codigo la buscaba en `baby_stage` y `stage`, dos columnas que no existen
// en `quiz_leads`: el resultado es que el reemplazo NUNCA encontraba nada y todas
// leian el texto de relleno -- "Tu resultado dice que estas en la etapa que tu bebe
// vive ahora", una frase que no dice nada, en el correo de bienvenida.
const ETAPA_EN_PROSA: Record<string, string> = {
  'esperando bebé': 'de espera',
  'esperando bebe': 'de espera',
  'pregnant': 'de espera',
  '0-3 meses': 'de los primeros tres meses',
  '0-3 months': 'de los primeros tres meses',
  '3-6 meses': 'de los tres a los seis meses',
  '3-6 months': 'de los tres a los seis meses',
  '6-9 meses': 'de los seis a los nueve meses',
  '6-9 months': 'de los seis a los nueve meses',
  '9-12 meses': 'de los nueve a los doce meses',
  '9-12 months': 'de los nueve a los doce meses',
};

// El obstaculo que ella marco en la Brujula ("no se que actividades hacer",
// "falta de apoyo"...) entra al primer correo como UNA frase, no como un correo
// distinto: reconocer en voz alta lo que ella dijo que le pesa es lo que hace que
// el correo se lea escrito para ella y no para una lista.
//
// Los cinco textos hablan de la ESPERA, no de un bebe ya nacido: esta secuencia
// es la del embarazo. Cuando se escriban las otras cuatro etapas, cada una traera
// sus propios puentes.
const PUENTE_POR_OBSTACULO: Record<string, string> = {
  'falta de tiempo':
    'Marcaste que el tiempo es lo que más te falta. Lo tomé en cuenta: nada de lo que te voy a mandar pide una tarde libre.',
  'lack of time':
    'Marcaste que el tiempo es lo que más te falta. Lo tomé en cuenta: nada de lo que te voy a mandar pide una tarde libre.',

  'no sé qué actividades hacer':
    'Marcaste que no sabes bien qué hacer. Es la respuesta más honesta que se puede dar antes de que nazca, y es exactamente lo que vamos a ordenar.',
  'no se que actividades hacer':
    'Marcaste que no sabes bien qué hacer. Es la respuesta más honesta que se puede dar antes de que nazca, y es exactamente lo que vamos a ordenar.',
  "don't know what activities to do":
    'Marcaste que no sabes bien qué hacer. Es la respuesta más honesta que se puede dar antes de que nazca, y es exactamente lo que vamos a ordenar.',

  // El quiz de Little ya no le muestra "mi bebe no coopera" a quien esta embarazada
  // -- ella no tiene todavia un bebe con quien no cooperar --, sino "el embarazo no
  // va como esperaba". Las dos claves siguen aqui: los leads viejos guardaron la
  // primera y hay que saber contestarles igual.
  'el embarazo no va como esperaba':
    'Marcaste que el embarazo no va como esperabas. Lo tomo en cuenta: nada de lo que te mande da por supuesto que todo marcha según el plan.',
  "my pregnancy isn't going as i expected":
    'Marcaste que el embarazo no va como esperabas. Lo tomo en cuenta: nada de lo que te mande da por supuesto que todo marcha según el plan.',
  'mi bebé no coopera':
    'Marcaste que temes que las cosas no salgan como en los manuales. Te adelanto algo: casi nunca salen así, y no es señal de que lo estés haciendo mal.',
  'mi bebe no coopera':
    'Marcaste que temes que las cosas no salgan como en los manuales. Te adelanto algo: casi nunca salen así, y no es señal de que lo estés haciendo mal.',
  "my baby doesn't cooperate":
    'Marcaste que temes que las cosas no salgan como en los manuales. Te adelanto algo: casi nunca salen así, y no es señal de que lo estés haciendo mal.',

  'falta de apoyo':
    'Marcaste que te falta apoyo. Eso cambia lo que sirve y lo que no: lo que te voy a mandar está pensado para hacerse sin un equipo alrededor.',
  'lack of support':
    'Marcaste que te falta apoyo. Eso cambia lo que sirve y lo que no: lo que te voy a mandar está pensado para hacerse sin un equipo alrededor.',

  'información contradictoria':
    'Marcaste que te cansa la información contradictoria. Por eso cada cosa que te mande viene con el estudio de donde salió, para que puedas revisarlo tú.',
  'informacion contradictoria':
    'Marcaste que te cansa la información contradictoria. Por eso cada cosa que te mande viene con el estudio de donde salió, para que puedas revisarlo tú.',
  'contradictory information':
    'Marcaste que te cansa la información contradictoria. Por eso cada cosa que te mande viene con el estudio de donde salió, para que puedas revisarlo tú.',
};

// Reemplaza los merge tags del copy fijo de nurturing: {{name}}, {{stage}}, {{puente}}.
function renderVars(text: string, lead: any): string {
  const firstName = String(lead?.name || '').trim().split(/\s+/)[0] || '';
  const elegida = String(lead?.situation || '').trim();
  // La frase es "estas en la etapa {{stage}}", asi que el valor crudo del quiz
  // ("0-3 meses") queda torpe. Se traduce a prosa; si llega una etapa que no
  // conocemos, se usa el valor tal cual antes que perderlo.
  const stage = ETAPA_EN_PROSA[elegida.toLowerCase()] || elegida || 'que tu bebé vive ahora';
  const obstaculo = String(lead?.obstacle || '').trim().toLowerCase();
  const puente = PUENTE_POR_OBSTACULO[obstaculo] || '';

  let out = String(text || '');

  // Sin nombre, "Tu Brujula esta lista, {{name}}" quedaba como "Tu Brujula esta
  // lista,  🧭" -- una coma colgando en el asunto. Y "{{name}}, antes que nada"
  // quedaba empezando con minuscula. Se limpian las dos formas antes de reemplazar.
  if (!firstName) {
    out = out
      .replace(/,\s*\{\{\s*name\s*\}\}/gi, '')
      .replace(/\{\{\s*name\s*\}\}\s*,\s*(\p{L})/gu, (_m, letra: string) => letra.toUpperCase());
  }

  return out
    .replace(/\{\{\s*name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*stage\s*\}\}/gi, String(stage))
    // El puente viaja en su propia linea. Si esta vacio se lleva tambien el salto
    // de linea que lo precede, para no dejar un hueco en medio del correo.
    .replace(/\n*\{\{\s*puente\s*\}\}/gi, puente ? '\n\n' + puente : '');
}

// ── Condiciones: un solo evaluador para las reglas y para los frenos ──
// Las reglas de inscripcion ya escritas usan `contains` y `in`, y este evaluador
// solo conocia `eq`, `gte` y `exists`: un operador desconocido no coincidia con
// ningun caso, la condicion se daba por cumplida y la regla aceptaba a CUALQUIER
// lead. La regla que filtra por `source contains "universmind"` habria metido a
// clientes de EvoFinz en la secuencia de bebes el dia que se encendiera.
function cumpleCondicion(cond: any, lead: any): boolean {
  const bruto = lead?.[cond?.field];
  const texto = String(bruto ?? '').toLowerCase();
  const val = cond?.value;
  const opciones = () => (Array.isArray(val) ? val : [val]).map((v) => String(v).toLowerCase());

  switch (cond?.operator || 'eq') {
    case 'eq': return texto === String(val).toLowerCase();
    case 'neq': return texto !== String(val).toLowerCase();
    case 'contains': return texto.includes(String(val).toLowerCase());
    case 'in': return opciones().includes(texto);
    case 'not_in': return !opciones().includes(texto);
    case 'gte': return Number(bruto || 0) >= Number(val);
    case 'lte': return Number(bruto || 0) <= Number(val);
    case 'exists': return val === true ? !!bruto : !bruto;
    // `tags` es un arreglo en la base; asi se pregunta "¿tiene esta etiqueta?".
    case 'array_contains':
      return Array.isArray(bruto) && bruto.map((v) => String(v).toLowerCase()).includes(String(val).toLowerCase());
    // Un operador que no conocemos NO se da por cumplido: si no sabemos leer la
    // condicion, no filtramos a nadie hacia adentro.
    default: return false;
  }
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

          // Una regla inscribe solo si el lead cumple TODAS sus condiciones.
          const conditions = rule.trigger_condition;
          if (conditions && Array.isArray(conditions) && conditions.length > 0) {
            if (!conditions.every((cond: any) => cumpleCondicion(cond, lead))) continue;
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

          // ═══ FRENOS DE LA SECUENCIA ═══════════════════════════════════════
          // Un paso que no corresponde no se "salta": se apaga la secuencia
          // entera para ese lead. La diferencia importa — si ella compra la
          // guia el dia 15, saltarse solo ese paso le mandaria igual la oferta
          // del dia 21, ofreciendole lo que ya pago.
          const frenar = async (motivo: string) => {
            await fetch(
              `${supabaseUrl}/rest/v1/lead_nurturing_log?lead_id=eq.${log.lead_id}&sequence_id=eq.${log.sequence_id}&status=eq.pending`,
              {
                method: 'PATCH',
                headers: { ...headers, 'Prefer': 'return=minimal' },
                body: JSON.stringify({ status: 'skipped', executed_at: now, message_generated: motivo }),
              }
            );
          };

          // 1) Se dio de baja, reboto o marco spam. El envio ya lo bloquea mas
          //    abajo, pero sin este freno la secuencia seguiria generando pasos
          //    para alguien que pidio no volver a recibir nada.
          let sePuedeSeguir = true;
          if (lead.email) {
            const supRes = await fetch(
              `${supabaseUrl}/rest/v1/suppressed_emails?email=eq.${encodeURIComponent(String(lead.email).toLowerCase())}&select=reason&limit=1`,
              { headers }
            );
            if (supRes.ok) {
              const sup = await supRes.json();
              if (sup.length > 0) {
                await frenar(`Correo dado de baja (${sup[0].reason}) — secuencia detenida`);
                sePuedeSeguir = false;
              }
            }
          }
          if (!sePuedeSeguir) continue;

          // 2) Nacio el bebe (o cambio de etapa). El quiz NO actualiza el lead
          //    viejo: cada respuesta crea una fila nueva. O sea que una mama que
          //    responde la Brujula embarazada y vuelve a responderla con su bebe
          //    de dos meses deja la fila vieja intacta -- y esa fila vieja seguiria
          //    mandandole correos que hablan de "antes de que nazca". Por eso el
          //    freno no mira esta fila: mira si hay una MAS NUEVA con el mismo
          //    correo y otra etapa.
          if (lead.email && lead.situation) {
            const nuevoRes = await fetch(
              `${supabaseUrl}/rest/v1/quiz_leads?email=eq.${encodeURIComponent(String(lead.email).toLowerCase())}&created_at=gt.${lead.created_at}&select=situation,created_at&order=created_at.desc&limit=5`,
              { headers }
            );
            if (nuevoRes.ok) {
              const posteriores = await nuevoRes.json();
              const cambio = posteriores.find(
                (l: any) => l.situation && String(l.situation).toLowerCase() !== String(lead.situation).toLowerCase()
              );
              if (cambio) {
                await frenar(`Volvio a responder la Brujula y ahora dice "${cambio.situation}" — secuencia detenida`);
                sePuedeSeguir = false;
              }
            }
          }
          if (!sePuedeSeguir) continue;

          // 3) Los frenos que declara la propia secuencia (compras, etiquetas).
          //    Basta que se cumpla UNO. Mismo evaluador que las reglas.
          const frenos = sequence.stop_conditions;
          if (Array.isArray(frenos) && frenos.length > 0) {
            const cumplido = frenos.find((c: any) => cumpleCondicion(c, lead));
            if (cumplido) {
              await frenar(`Freno de la secuencia: ${cumplido.field} ${cumplido.operator} ${JSON.stringify(cumplido.value)}`);
              continue;
            }
          }
          // ══════════════════════════════════════════════════════════════════

          // Skip if lead was already contacted
          if (lead.contacted_at) {
            await fetch(`${supabaseUrl}/rest/v1/lead_nurturing_log?id=eq.${log.id}`, {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ status: 'skipped', executed_at: now, message_generated: 'Lead already contacted — skipped' }),
            });
            continue;
          }

          // ===== MARKETING CONSENT GATE (PIPEDA / Ley 19.628) =====
          // El nurturing SIEMPRE es marketing: no se envía a un lead sin
          // consentimiento. Éste es el punto REAL de envío, así que cubre
          // también revocaciones de consentimiento y enrolamientos previos a
          // esta política. Fail-closed: solo continúa si marketing_consent === true.
          if (lead.marketing_consent !== true) {
            await fetch(`${supabaseUrl}/rest/v1/lead_nurturing_log?id=eq.${log.id}`, {
              method: 'PATCH',
              headers: { ...headers, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ status: 'skipped', executed_at: now, message_generated: 'Sin consentimiento de marketing — omitido' }),
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
                    ctaSecondaryText: step.cta2_text || '',
                    ctaSecondaryUrl: step.cta2_url || '',
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
