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
            const htmlContent = `
              <div style="font-family: sans-serif; padding: 20px; background: #f9fafb;">
                <h2 style="color: #111827;">Nouvel Email Reçu</h2>
                <p><strong>De:</strong> ${fromEmail}</p>
                <p><strong>Sujet:</strong> ${subject}</p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
                  ${htmlBody || textBody.replace(/\n/g, '<br/>')}
                </div>
                <hr style="margin-top: 30px; border-color: #e5e7eb;" />
                <p style="font-size: 12px; color: #6b7280;">Ceci est un transfert automatique depuis la plateforme Yakoub Étanchéité.</p>
              </div>
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
