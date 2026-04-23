export const onRequestPost = async (context: any) => {
  try {
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing in env');
      return new Response('Configuration error', { status: 500 });
    }

    // Parse the Resend Inbound Webhook payload
    // Resend sends a JSON with `from`, `to`, `subject`, `html`, `text` directly, or wrapped depending on the webhook setup.
    // Generally, for inbound emails, Resend sends a payload containing the email data.
    const payload = await context.request.json();

    const fromEmail = payload.from || 'unknown';
    const toEmail = payload.to || 'unknown';
    const subject = payload.subject || 'No Subject';
    const htmlBody = payload.html || '';
    const textBody = payload.text || '';

    // Insert into Supabase
    const supabaseRestUrl = `${supabaseUrl}/rest/v1/emails`;
    const res = await fetch(supabaseRestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        from_email: fromEmail,
        to_email: toEmail,
        subject: subject,
        html_body: htmlBody,
        text_body: textBody,
        direction: 'inbound',
        is_read: false
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase Insert Error:', errText);
      return new Response('Failed to save email', { status: 500 });
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
