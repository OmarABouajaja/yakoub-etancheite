import type { LeadData } from './api';

export function getLeadNotificationHtml(data: LeadData, dashboardUrl: string): string {
    const isUrgent = data.is_urgent;
    
    // Professional styling constants
    const brandColor = '#0891b2'; // Cyan-600
    const darkColor = '#0f172a'; // Slate-900
    const lightBg = '#f8fafc'; // Slate-50
    const borderColor = '#e2e8f0'; // Slate-200
    const textColor = '#334155'; // Slate-700
    const mutedColor = '#64748b'; // Slate-500
    
    const badgeHtml = isUrgent 
        ? `<span style="background-color: #fef2f2; color: #ef4444; border: 1px solid #fca5a5; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">⚡ Demande Urgente</span>` 
        : `<span style="background-color: #f0fdf4; color: #16a34a; border: 1px solid #86efac; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">📋 Nouvelle Demande</span>`;

    return `
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau Prospect | Yakoub Étanchéité</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: ${lightBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textColor}; }
        .wrapper { width: 100%; table-layout: fixed; background-color: ${lightBg}; padding: 40px 0; }
        .main { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid ${borderColor}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
        .header { padding: 30px; text-align: center; border-bottom: 1px solid ${borderColor}; background-color: ${darkColor}; }
        .content { padding: 40px 30px; }
        .title { font-size: 24px; font-weight: 700; color: ${darkColor}; margin: 0 0 15px 0; text-align: center; }
        .subtitle { font-size: 16px; line-height: 1.5; color: ${mutedColor}; margin: 0 0 30px 0; text-align: center; }
        .info-box { background-color: ${lightBg}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 25px; margin-bottom: 30px; }
        .data-row { margin-bottom: 15px; }
        .data-row:last-child { margin-bottom: 0; }
        .data-label { display: block; font-size: 12px; font-weight: 700; color: ${mutedColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .data-value { display: block; font-size: 16px; color: ${darkColor}; font-weight: 500; }
        .data-message { display: block; font-size: 15px; color: ${textColor}; font-style: italic; background-color: #ffffff; border-left: 3px solid ${brandColor}; padding: 12px 15px; margin-top: 5px; white-space: pre-wrap; line-height: 1.5; }
        .button-container { text-align: center; margin-top: 35px; }
        .button { display: inline-block; background-color: ${brandColor}; color: #ffffff !important; font-weight: 600; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 16px; transition: background-color 0.2s; }
        .footer { padding: 25px 30px; text-align: center; background-color: ${lightBg}; border-top: 1px solid ${borderColor}; }
        .footer-text { font-size: 13px; color: ${mutedColor}; line-height: 1.5; margin: 0; }
        .logo-text { font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; margin: 0; }
        .cyan-text { color: ${brandColor}; }
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
                        ${badgeHtml}
                    </div>
                    
                    <h2 class="title">Nouvelle Demande de Devis</h2>
                    <p class="subtitle">
                        Un prospect vient de soumettre une demande via votre site web.<br>Voici les détails fournis :
                    </p>
                    
                    <div class="info-box">
                        <div class="data-row">
                            <span class="data-label">Nom du Client</span>
                            <span class="data-value">${data.client_name}</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Numéro de Téléphone</span>
                            <span class="data-value"><a href="tel:${data.phone}" style="color: ${brandColor}; text-decoration: none; font-weight: 600;">${data.phone}</a></span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Type de Problème</span>
                            <span class="data-value" style="text-transform: capitalize;">${data.problem_type}</span>
                        </div>
                        <div class="data-row">
                            <span class="data-label">Superficie Estimée</span>
                            <span class="data-value">${data.surface_area ? data.surface_area + ' m²' : '<span style="color: #94a3b8;">Non spécifiée</span>'}</span>
                        </div>
                        <div class="data-row" style="margin-top: 20px;">
                            <span class="data-label">Message & Adresse</span>
                            <div class="data-message">${data.message || 'Aucun message supplémentaire fourni.'}</div>
                        </div>
                    </div>

                    <div class="button-container">
                        <a href="${dashboardUrl}/dashboard/leads" class="button">Traiter la demande</a>
                    </div>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p class="footer-text">
                        Cet email a été généré automatiquement par votre plateforme.<br>
                        © ${new Date().getFullYear()} Yakoub Étanchéité - Dashboard
                    </p>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
    `;
}
