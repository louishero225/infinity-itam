export async function sendEmail(input: {
  to: string[];
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERTES_EMAIL_FROM ?? "INFINITY ITAM <noreply@infinity-africa.com>";

  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY manquante" as const };
  }

  if (input.to.length === 0) {
    return { sent: false, reason: "aucun destinataire" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Envoi e-mail impossible: ${text}`);
  }

  return { sent: true as const };
}

export function parseAlertRecipients() {
  return (process.env.ALERTES_EMAIL_TO ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
