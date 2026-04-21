import type { LeadData } from './api';

export function getLeadNotificationHtml(data: LeadData, dashboardUrl: string): string {
    const isUrgentTag = data.is_urgent 
        ? `<span style="color:#FCA5A5; font-size:13px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">⚡ PROSPECT URGENT</span>` 
        : `<span style="color:#93C5FD; font-size:13px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">📋 NOUVEAU PROSPECT</span>`;

    const urgentBg = data.is_urgent ? '#7F1D1D' : '#1E3A5F';

    return `
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau Prospect ! | Yakoub Travaux</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #050a15; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f8fafc; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #050a15; padding: 40px 0; }
        .main { background-color: #0f172a; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
        .header { padding: 30px; text-align: center; border-bottom: 1px solid #1e293b; background-color: #0B0F19; }
        .content { padding: 40px 30px; }
        .title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 25px; text-align: center; }
        .text { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }
        .data-table { width: 100%; background-color: #1e293b; border-radius: 8px; margin-bottom: 30px; border-collapse: collapse; }
        .data-table td { padding: 15px; border-bottom: 1px solid #334155; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-label { color: #94a3b8; font-weight: 600; font-size: 14px; width: 40%; }
        .data-value { color: #ffffff; font-weight: 500; font-size: 15px; }
        .button { display: inline-block; background-color: #06b6d4; color: #ffffff !important; font-weight: bold; padding: 14px 28px; border-radius: 6px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3); font-size: 16px; text-align: center; margin: 0 auto; display: block; text-decoration: none; }
        .footer { padding: 30px; text-align: center; background-color: #0B0F19; border-top: 1px solid #1e293b; }
        .footer-text { font-size: 14px; color: #64748b; line-height: 1.5; margin: 0; }
        .logo-text { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 1px; }
        .cyan-text { color: #06b6d4; }
    </style>
</head>
<body>
    <center class="wrapper">
        <table class="main" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td class="header">
                    <div class="logo-text">YAKOUB<span class="cyan-text">TRAVAUX</span></div>
                </td>
            </tr>
            <tr>
                <td style="padding: 24px 30px 0; text-align: center;">
                    <div style="background-color: ${urgentBg}; border-radius: 6px; padding: 12px 20px; display: inline-block;">
                        ${isUrgentTag}
                    </div>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <h1 class="title">Nouveau Prospect Capturé 🎯</h1>
                    <p class="text">
                        Un nouveau client potentiel vient de soumettre une demande via le formulaire du site web. Voici les détails :
                    </p>
                    
                    <table class="data-table" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td class="data-label">Nom</td>
                            <td class="data-value">${data.client_name}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Téléphone</td>
                            <td class="data-value"><a href="tel:${data.phone}" style="color: #06b6d4; text-decoration: none;">${data.phone}</a></td>
                        </tr>
                        <tr>
                            <td class="data-label">Problème Signalé</td>
                            <td class="data-value" style="text-transform: capitalize;">${data.problem_type}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Superficie Estimée</td>
                            <td class="data-value">${data.surface_area ? data.surface_area + ' m²' : 'Non spécifiée'}</td>
                        </tr>
                        <tr>
                            <td class="data-label">Message & Lieu</td>
                            <td class="data-value" style="font-style: italic; color: #cbd5e1; white-space: pre-wrap;">"${data.message || 'Aucun message'}"</td>
                        </tr>
                    </table>

                    <a href="${dashboardUrl}/dashboard/leads" class="button">Gérer dans le Dashboard</a>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p class="footer-text">
                        Alerte Automatique du Système<br>© ${new Date().getFullYear()} Yakoub Travaux Dashboard
                    </p>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
    `;
}
