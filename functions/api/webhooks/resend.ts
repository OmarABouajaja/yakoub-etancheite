/**
 * Resend Inbound Email Webhook
 * 
 * Resend sends webhook events as:
 * {
 *   "type": "email.received",
 *   "created_at": "...",
 *   "data": {
 *     "from": "sender@example.com",
 *     "to": ["inbox@yakoub-etancheite.com.tn"],
 *     "subject": "...",
 *     "html": "...",
 *     "text": "..."
 *   }
 * }
 * 
 * Or for simpler setups, the payload may be flat with from/to/subject/html/text directly.
 * This handler supports both formats.
 */
export const onRequestPost = async (context: any) => {
  try {
    const supabaseUrl = context.env.SUPABASE_URL || context.env.VITE_SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      const missingUrl = !supabaseUrl ? 'SUPABASE_URL' : '';
      const missingKey = !supabaseKey ? 'SUPABASE_SERVICE_ROLE_KEY' : '';
      return new Response(`Configuration error: missing ${missingUrl} ${missingKey}`.trim(), { status: 500 });
    }

    const rawBody = await context.request.text();
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('Invalid JSON payload');
      return new Response('Invalid JSON', { status: 400 });
    }

    // Optional: Verify webhook signature if RESEND_WEBHOOK_SECRET is set
    const webhookSecret = context.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const svixId = context.request.headers.get('svix-id');
      const svixTimestamp = context.request.headers.get('svix-timestamp');
      const svixSignature = context.request.headers.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('Missing svix headers for webhook verification');
        return new Response('Missing verification headers', { status: 401 });
      }

      // Basic timestamp validation (reject if older than 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const ts = parseInt(svixTimestamp, 10);
      if (isNaN(ts) || Math.abs(now - ts) > 300) {
        console.error('Webhook timestamp too old or invalid');
        return new Response('Invalid timestamp', { status: 401 });
      }

      // HMAC-SHA256 verification
      const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
      const secretBytes = Uint8Array.from(
        atob(webhookSecret.replace('whsec_', '')),
        c => c.charCodeAt(0)
      );

      const key = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
      const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

      // Resend sends multiple signatures separated by space, each prefixed with version
      const signatures = svixSignature.split(' ');
      const isValid = signatures.some((sig: string) => {
        const [, sigValue] = sig.split(',');
        return sigValue === expectedSignature;
      });

      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    // Parse email data — handle both wrapped (event) and flat formats
    const emailData = payload.data || payload;

    // Extract from/to — can be string, array, or object
    const extractEmail = (field: any): string => {
      if (!field) return 'unknown';
      if (typeof field === 'string') return field;
      if (Array.isArray(field)) return field.map(extractEmail).join(', ');
      if (typeof field === 'object' && field.address) return field.address;
      return String(field);
    };

    const fromEmail = extractEmail(emailData.from);
    const toEmail = extractEmail(emailData.to);
    const subject = emailData.subject || 'Sans Objet';
    const htmlBody = emailData.html || '';
    const textBody = emailData.text || '';

    // Skip non-email events (e.g. email.delivered, email.bounced, etc.)
    if (payload.type && payload.type !== 'email.received') {
      console.log(`Skipping non-inbound event: ${payload.type}`);
      return new Response('OK - skipped', { status: 200 });
    }

    // Insert into Supabase emails table
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

    // --- Notifications and Forwarding ---
    try {
      // 1. Fetch site settings
      const settingsRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?select=email,enable_inbound_notifications,inbound_notification_email,enable_inbound_forwarding,inbound_forward_email`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });
      
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const settings = settingsData[0] || {};
        
        const toEmails = [];
        
        // Notification
        if (settings.enable_inbound_notifications !== false) {
          const primaryEmail = settings.inbound_notification_email || settings.email || 'team@yakoub-etancheite.com.tn';
          toEmails.push(primaryEmail);
        }
        
        // Forwarding
        if (settings.enable_inbound_forwarding && settings.inbound_forward_email) {
          if (!toEmails.includes(settings.inbound_forward_email)) {
             toEmails.push(settings.inbound_forward_email);
          }
        }
        
        if (toEmails.length > 0) {
          const resendApiKey = context.env.RESEND_API_KEY;
          if (resendApiKey) {
            const dashboardUrl = supabaseUrl.replace('https://', 'https://dashboard.').replace('.supabase.co', ''); // Approximation for button link if needed, or hardcode the production URL
            const cleanDashboardUrl = typeof process !== 'undefined' && process.env && process.env.VITE_DASHBOARD_URL ? process.env.VITE_DASHBOARD_URL : 'https://yakoub-etancheite.com.tn';

            const htmlContent = `
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvel Email Reçu | Yakoub Étanchéité</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .main { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
        .header { padding: 30px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #0f172a; }
        .content { padding: 40px 30px; }
        .title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 15px 0; text-align: center; }
        .subtitle { font-size: 16px; line-height: 1.5; color: #64748b; margin: 0 0 30px 0; text-align: center; }
        .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 30px; }
        .data-row { margin-bottom: 15px; }
        .data-row:last-child { margin-bottom: 0; }
        .data-label { display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .data-value { display: block; font-size: 16px; color: #0f172a; font-weight: 500; }
        .data-message { display: block; font-size: 15px; color: #334155; background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #0ea5e9; padding: 20px; margin-top: 10px; border-radius: 4px; overflow-x: auto; }
        .button-container { text-align: center; margin-top: 35px; }
        .button { display: inline-block; background-color: #0ea5e9; color: #ffffff !important; font-weight: 600; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 16px; transition: background-color 0.2s; }
        .footer { padding: 25px 30px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
        .footer-text { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0; }
        .logo-text { font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; margin: 0; }
        .cyan-text { color: #0ea5e9; }
    </style>
</head>
<body>
    <center class="wrapper">
        <table class="main" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td class="header">
                    <h1 class="logo-text">YAKOUB<span class="cyan-text">ÉTANCHÉITÉ</span></h1>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <span style="background-color: #f0fdf4; color: #16a34a; border: 1px solid #86efac; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">📬 Nouveau Message</span>
                    </div>
                    
                    <h2 class="title">Nouvel Email Reçu</h2>
                    <p class="subtitle">
                        Un message vient d'arriver dans la boîte de réception de la plateforme.
                    </p>
                    
                    <div class="info-box">
                        <div class="data-row">
                            <span class="data-label">Expéditeur</span>
                            <span class="data-value"><a href="mailto:${fromEmail}" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">${fromEmail}</a></span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Sujet du Message</span>
                            <span class="data-value" style="font-weight: 600;">${subject}</span>
                        </div>
                        <div class="data-row" style="margin-top: 25px;">
                            <span class="data-label">Contenu du Message</span>
                            <div class="data-message">
                                ${htmlBody || textBody.replace(/\\n/g, '<br/>')}
                            </div>
                        </div>
                    </div>

                    <div class="button-container">
                        <a href="${cleanDashboardUrl}/dashboard/mailbox" class="button">Ouvrir la Boîte Mail</a>
                    </div>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p class="footer-text">
                        Cet email a été transféré automatiquement par votre plateforme.<br>
                        © ${new Date().getFullYear()} Yakoub Étanchéité - Dashboard
                    </p>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
            `;
            
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: 'Yakoub Étanchéité <team@yakoub-etancheite.com.tn>',
                to: toEmails,
                subject: `FWD: ${subject}`,
                html: htmlContent
              })
            });
          } else {
            console.warn('RESEND_API_KEY missing, cannot send notifications/forwarding.');
          }
        }
      }
    } catch (e) {
      console.error('Error processing notifications/forwarding:', e);
      // Don't fail the webhook if notifications fail
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
