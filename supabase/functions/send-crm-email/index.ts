const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Send a CRM email to a lead using the AI-generated content.
 * 
 * This function:
 * 1. Receives the lead info + generated email content
 * 2. Parses subject from [SUBJECT: ...] format
 * 3. Sends the email via the transactional email queue (when infra is ready)
 * 4. Returns success/failure so the automation can decide whether to mark as contacted
 * 
 * When email infrastructure isn't set up yet, it returns a clear "not_configured" status.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName, subject, htmlBody, textBody, leadId, ruleName } = await req.json();

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ success: false, status: 'error', error: 'recipientEmail is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Try to send via the transactional email system
    // Check if send-transactional-email function exists by trying to invoke it
    try {
      const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: 'crm-lead-outreach',
          recipientEmail,
          idempotencyKey: `crm-outreach-${leadId}-${Date.now()}`,
          templateData: {
            recipientName: recipientName || '',
            subject: subject || 'We have something for you',
            body: textBody || htmlBody || '',
            ruleName: ruleName || '',
          },
        }),
      });

      if (sendRes.ok) {
        const sendData = await sendRes.json();
        console.log(`CRM email queued for ${recipientEmail}:`, sendData);
        return new Response(
          JSON.stringify({ success: true, status: 'sent', data: sendData }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If the transactional email function returned an error
      const errText = await sendRes.text();
      console.error(`Transactional email error (${sendRes.status}):`, errText);

      // If function not found (404) or infra not ready, return not_configured
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
