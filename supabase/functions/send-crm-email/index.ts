const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map lead source to the correct branded template
const SOURCE_TEMPLATE_MAP: Record<string, string> = {
  fokuspark: 'crm-fokuspark-outreach',
  universmind: 'crm-universmind-outreach',
  evofinz: 'crm-lead-outreach',
};

function getTemplateForSource(source?: string, isFollowUp?: boolean): string {
  if (isFollowUp) return 'crm-follow-up';
  if (!source) return 'crm-lead-outreach';
  const key = source.toLowerCase().replace(/[_\- ]/g, '');
  for (const [prefix, template] of Object.entries(SOURCE_TEMPLATE_MAP)) {
    if (key.includes(prefix)) return template;
  }
  return 'crm-lead-outreach';
}

const APP_NAME_MAP: Record<string, string> = {
  fokuspark: 'Fokuspark',
  universmind: 'UniversMind',
  evofinz: 'EvoFinz',
};

function getAppName(source?: string): string {
  if (!source) return 'EvoFinz';
  const key = source.toLowerCase().replace(/[_\- ]/g, '');
  for (const [prefix, name] of Object.entries(APP_NAME_MAP)) {
    if (key.includes(prefix)) return name;
  }
  return 'EvoFinz';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName, subject, htmlBody, textBody, leadId, ruleName, leadSource, isFollowUp, stepNumber } = await req.json();

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ success: false, status: 'error', error: 'recipientEmail is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Import supabase client for logging interactions
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Pick template based on lead source
    let templateName = getTemplateForSource(leadSource, isFollowUp);
    const appName = getAppName(leadSource);
    let abVariant: string | null = null;
    let abTestId: string | null = null;

    // A/B Test routing: check if there's an active test for this template
    try {
      const { data: abTests } = await supabaseAdmin
        .from('email_ab_tests')
        .select('*')
        .eq('status', 'active')
        .or(`template_a.eq.${templateName},template_b.eq.${templateName}`)
        .limit(1);

      if (abTests && abTests.length > 0) {
        const test = abTests[0];
        abTestId = test.id;
        const ratio = test.split_ratio || 0.5;
        abVariant = Math.random() < ratio ? 'A' : 'B';
        templateName = abVariant === 'A' ? test.template_a : test.template_b;
        console.log(`A/B Test "${test.name}": routing to variant ${abVariant} → ${templateName}`);
      }
    } catch (abErr) {
      console.error('A/B test lookup error (non-fatal):', abErr);
    }

    try {
      const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName,
          recipientEmail,
          idempotencyKey: `crm-${isFollowUp ? 'followup' : 'outreach'}-${leadId}-${Date.now()}`,
          templateData: {
            recipientName: recipientName || '',
            subject: subject || (isFollowUp ? '¿Pudiste revisar nuestro mensaje?' : 'Tenemos algo para ti'),
            body: textBody || htmlBody || '',
            ruleName: ruleName || '',
            appName,
            stepNumber: stepNumber || 1,
          },
        }),
      });

      if (sendRes.ok) {
        const sendData = await sendRes.json();
        console.log(`CRM email queued (${templateName}) for ${recipientEmail}:`, sendData);

        // Auto-log to lead_interactions if leadId provided
        if (leadId) {
          try {
            await supabaseAdmin.from('lead_interactions').insert({
              lead_id: leadId,
              interaction_type: 'email',
              content: `[CRM ${isFollowUp ? 'Follow-up' : 'Outreach'}] ${subject || 'Sin asunto'} (${appName})`,
              metadata: { template: templateName, appName, stepNumber, isFollowUp },
            });
          } catch (logErr) {
            console.error('Failed to log interaction:', logErr);
          }
        }

        return new Response(
          JSON.stringify({ success: true, status: 'sent', data: sendData, template: templateName }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const errText = await sendRes.text();
      console.error(`Transactional email error (${sendRes.status}):`, errText);

      if (sendRes.status === 404) {
        return new Response(
          JSON.stringify({
            success: false,
            status: 'not_configured',
            error: 'Email infrastructure not yet configured. Complete email domain setup in Cloud → Emails.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, status: 'failed', error: errText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (invokeErr) {
      console.error('Error invoking send-transactional-email:', invokeErr);
      return new Response(
        JSON.stringify({
          success: false,
          status: 'not_configured',
          error: 'Email sending infrastructure not available yet.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('send-crm-email error:', error);
    return new Response(
      JSON.stringify({ success: false, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
