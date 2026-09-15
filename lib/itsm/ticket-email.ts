import { parseAlertRecipients, sendEmail } from "@/lib/email/send";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function refLabel(ticket: { ticket_ref: string | null; id: string }) {
  if (ticket.ticket_ref) return ticket.ticket_ref;
  return `#${ticket.id.slice(0, 8).toUpperCase()}`;
}

function siteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || "http://localhost:3000";
}

export function parseItsmStaffRecipients() {
  const dedicated = (process.env.ITSM_NOTIFY_TO ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (dedicated.length > 0) return dedicated;
  return parseAlertRecipients();
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailShell(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:16px 20px;background:#0f172a;color:#f8fafc;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">
              INFINITY IT · Support
            </td>
          </tr>
          <tr>
            <td style="padding:20px;">
              <h1 style="margin:0 0 12px;font-size:18px;font-weight:600;">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 20px;background:#f1f5f9;color:#64748b;font-size:11px;">
              Message automatique — ne pas répondre directement à cet e-mail.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type TicketEmailContext = {
  id: string;
  ticket_ref: string | null;
  demandeur: string;
  categorie: string;
  statut: string;
  priorite: string;
  description: string | null;
  employe_id: string | null;
  sous_canal: string | null;
  canal: string;
};

/** E-mail du demandeur : employé.email → sous_canal portail → null */
export async function resolveDemandeurEmail(ticket: {
  employe_id: string | null;
  sous_canal: string | null;
  canal: string;
  demandeur: string;
}): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  if (ticket.employe_id) {
    const { data } = await supabase
      .from("employes")
      .select("email")
      .eq("id", ticket.employe_id)
      .maybeSingle();
    const email = data?.email?.trim().toLowerCase();
    if (email && email.includes("@")) return email;
  }

  const sous = ticket.sous_canal?.trim().toLowerCase() ?? "";
  if (sous.includes("@")) return sous;

  // Demandeur parfois = email
  const dem = ticket.demandeur.trim().toLowerCase();
  if (dem.includes("@")) return dem;

  return null;
}

export async function notifyRequesterPublicComment(args: {
  ticket: TicketEmailContext;
  comment: string;
  authorEmail: string | null;
}) {
  const to = await resolveDemandeurEmail(args.ticket);
  if (!to) return { sent: false as const, reason: "pas d'e-mail demandeur" as const };

  const ref = refLabel(args.ticket);
  const link = `${siteBaseUrl()}/mes-demandes`;

  return sendEmail({
    to: [to],
    subject: `[Support IT] Réponse sur ${ref} — ${args.ticket.categorie}`,
    html: emailShell(
      `Nouvelle réponse · ${ref}`,
      `<p style="margin:0 0 8px;font-size:14px;color:#64748b;">Ticket · ${escapeHtml(args.ticket.categorie)} · ${escapeHtml(args.ticket.statut)}</p>
       <p style="margin:0 0 4px;font-size:12px;color:#64748b;">De ${escapeHtml(args.authorEmail ?? "Support IT")}</p>
       <div style="margin:12px 0;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(args.comment)}</div>
       <p style="margin:16px 0 0;"><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">Voir mes demandes</a></p>`
    ),
  });
}

export async function notifyRequesterStatusChange(args: {
  ticket: TicketEmailContext;
  fromStatut: string;
  toStatut: string;
}) {
  if (args.fromStatut === args.toStatut) {
    return { sent: false as const, reason: "statut inchangé" as const };
  }

  const to = await resolveDemandeurEmail(args.ticket);
  if (!to) return { sent: false as const, reason: "pas d'e-mail demandeur" as const };

  const ref = refLabel(args.ticket);
  const link = `${siteBaseUrl()}/mes-demandes`;

  return sendEmail({
    to: [to],
    subject: `[Support IT] ${ref} → ${args.toStatut}`,
    html: emailShell(
      `Statut mis à jour · ${ref}`,
      `<p style="margin:0 0 12px;font-size:14px;">Votre demande <strong>${escapeHtml(args.ticket.categorie)}</strong> est passée de <strong>${escapeHtml(args.fromStatut)}</strong> à <strong>${escapeHtml(args.toStatut)}</strong>.</p>
       <p style="margin:16px 0 0;"><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">Suivre ma demande</a></p>`
    ),
  });
}

export async function notifyStaffNewPortalTicket(args: {
  ticketId: string;
  ticketRef: string | null;
  demandeur: string;
  categorie: string;
  priorite: string;
  description: string;
  contactEmail: string | null;
}) {
  const staff = parseItsmStaffRecipients();
  if (staff.length === 0) {
    return { sent: false as const, reason: "ITSM_NOTIFY_TO / ALERTES_EMAIL_TO vide" as const };
  }

  const ref = args.ticketRef || `#${args.ticketId.slice(0, 8).toUpperCase()}`;
  const link = `${siteBaseUrl()}/itsm/tickets/${args.ticketId}`;

  return sendEmail({
    to: staff,
    subject: `[Portail] Nouvelle demande ${ref} — ${args.categorie}`,
    html: emailShell(
      `Nouvelle demande portail · ${ref}`,
      `<p style="margin:0 0 8px;font-size:14px;"><strong>${escapeHtml(args.demandeur)}</strong>${args.contactEmail ? ` · ${escapeHtml(args.contactEmail)}` : ""}</p>
       <p style="margin:0 0 12px;font-size:13px;color:#64748b;">${escapeHtml(args.categorie)} · Priorité ${escapeHtml(args.priorite)}</p>
       <div style="margin:0 0 16px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(args.description)}</div>
       <p style="margin:0;"><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;">Ouvrir le ticket</a></p>`
    ),
  });
}
