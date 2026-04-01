const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, serviceKey);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch leads from last 7 days
    const { data: recentLeads } = await supabase
      .from('quiz_leads')
      .select('id, name, email, source, priority, pipeline_stage, contacted_at, created_at')
      .gte('created_at', sevenDaysAgo);

    const leads = recentLeads || [];
    const totalNew = leads.length;
    const contacted = leads.filter((l: any) => l.contacted_at).length;
    const converted = leads.filter((l: any) => l.pipeline_stage === 'converted').length;
    const hotUncontacted = leads.filter((l: any) => l.priority === 'hot' && !l.contacted_at).length;

    // By source
    const bySource: Record<string, number> = {};
    leads.forEach((l: any) => { bySource[l.source || 'evofinz'] = (bySource[l.source || 'evofinz'] || 0) + 1; });

    // Overdue follow-ups
    const { count: overdueFollowups } = await supabase
      .from('lead_follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('scheduled_at', new Date().toISOString());

    // Email stats
    const { data: emailStats } = await supabase
      .from('email_send_log')
      .select('status')
      .gte('created_at', sevenDaysAgo);

    const emailsSent = (emailStats || []).filter((e: any) => e.status === 'sent').length;
    const emailsFailed = (emailStats || []).filter((e: any) => e.status === 'dlq' || e.status === 'failed').length;

    const contactRate = totalNew > 0 ? Math.round((contacted / totalNew) * 100) : 0;
    const conversionRate = totalNew > 0 ? Math.round((converted / totalNew) * 100) : 0;

    // Build report body
    const sourceLines = Object.entries(bySource).map(([src, cnt]) => `• ${src}: ${cnt} leads`).join('\n');

    const reportBody = `
📊 REPORTE SEMANAL CRM — ${new Date().toLocaleDateString('es-CL')}

═══════════════════════════════════
📈 MÉTRICAS CLAVE (últimos 7 días)
═══════════════════════════════════

🆕 Leads nuevos: ${totalNew}
📞 Contactados: ${contacted} (${contactRate}%)
✅ Convertidos: ${converted} (${conversionRate}%)
🔥 HOT sin contactar: ${hotUncontacted}
⏰ Follow-ups vencidos: ${overdueFollowups || 0}

═══════════════════════════════════
📧 EMAILS
═══════════════════════════════════

✉️ Enviados: ${emailsSent}
❌ Fallidos: ${emailsFailed}

═══════════════════════════════════
🌐 LEADS POR FUENTE
═══════════════════════════════════

${sourceLines || '• Sin datos'}

═══════════════════════════════════

${hotUncontacted > 0 ? `⚠️ ALERTA: ${hotUncontacted} lead(s) HOT sin contactar. ¡Acción inmediata requerida!` : '✅ Todos los leads HOT han sido contactados.'}

— CRM EvoFinz (Reporte Automático)
    `.trim();

    // Get admin user IDs
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ success: false, reason: 'No admins found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get admin emails
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', admins.map((a: any) => a.user_id));

    let sentCount = 0;
    for (const admin of (adminProfiles || [])) {
      if (!admin.email) continue;

      try {
        await fetch(`${supabaseUrl}/functions/v1/send-crm-email`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: admin.email,
            recipientName: 'Admin',
            subject: `📊 Reporte Semanal CRM — ${new Date().toLocaleDateString('es-CL')}`,
            textBody: reportBody,
            leadSource: 'evofinz',
            isFollowUp: false,
          }),
        });
        sentCount++;
      } catch (e) {
        console.error(`Failed to send weekly report to ${admin.email}:`, e);
      }
    }

    // Also create a notification
    for (const admin of admins) {
      await supabase.from('ecosystem_notifications').insert({
        user_id: admin.user_id,
        notification_type: 'weekly_report',
        source_app: 'evofinz',
        title_es: '📊 Reporte semanal disponible',
        title_en: '📊 Weekly report available',
        message_es: `${totalNew} leads nuevos, ${contactRate}% contactados, ${conversionRate}% convertidos`,
        message_en: `${totalNew} new leads, ${contactRate}% contacted, ${conversionRate}% converted`,
        emoji: '📊',
        action_url: '/admin/crm',
      });
    }

    return new Response(JSON.stringify({
      success: true,
      sentTo: sentCount,
      metrics: { totalNew, contacted, converted, hotUncontacted, overdueFollowups, emailsSent, emailsFailed },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('send-weekly-report error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
