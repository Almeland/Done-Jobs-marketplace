import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM ?? "Done Jobs <noreply@vilect.com>";

type SoknadData = {
  listingTitle: string;
  companyName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  coverText: string | null;
  cvFileUrl: string | null;
  listingUrl: string;
  receiptEmail: string;
};

export async function sendSoknadTilArbeidsgiver(data: SoknadData) {
  const cvLenke = data.cvFileUrl
    ? `<p><a href="${data.cvFileUrl}" style="color:#6B46C1;">Last ned CV →</a></p>`
    : "";

  const dekningsbrev = data.coverText
    ? `<h3 style="color:#1a1a2e;margin-top:24px;">Søknadstekst</h3><p style="white-space:pre-wrap;color:#555;">${data.coverText}</p>`
    : "";

  await resend.emails.send({
    from: FROM,
    to: data.receiptEmail,
    subject: `Ny søknad: ${data.listingTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
        <h2 style="color:#6B46C1;">Ny søknad mottatt</h2>
        <p>Du har mottatt en ny søknad på <strong>${data.listingTitle}</strong>.</p>

        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px 0;color:#888;width:130px;">Navn</td><td style="padding:8px 0;font-weight:600;">${data.applicantName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">E-post</td><td style="padding:8px 0;"><a href="mailto:${data.applicantEmail}" style="color:#6B46C1;">${data.applicantEmail}</a></td></tr>
          ${data.applicantPhone ? `<tr><td style="padding:8px 0;color:#888;">Telefon</td><td style="padding:8px 0;">${data.applicantPhone}</td></tr>` : ""}
        </table>

        ${dekningsbrev}
        ${cvLenke}

        <div style="margin-top:32px;">
          <a href="${data.listingUrl}" style="background:#6B46C1;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">
            Se alle søknader →
          </a>
        </div>

        <hr style="margin:40px 0;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#aaa;">Done Jobs · done-jobs.no</p>
      </div>
    `,
  });
}

type BekreftelsData = {
  listingTitle: string;
  companyName: string;
  applicantName: string;
  applicantEmail: string;
  listingUrl: string;
};

export async function sendBekreftelseTilSoker(data: BekreftelsData) {
  await resend.emails.send({
    from: FROM,
    to: data.applicantEmail,
    subject: `Søknad mottatt — ${data.listingTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
        <h2 style="color:#6B46C1;">Søknaden din er mottatt</h2>
        <p>Hei ${data.applicantName},</p>
        <p>Vi har mottatt søknaden din på <strong>${data.listingTitle}</strong> hos <strong>${data.companyName}</strong>.</p>
        <p style="color:#666;">Bedriften vil kontakte deg direkte dersom du går videre i prosessen.</p>

        <div style="margin-top:32px;">
          <a href="${data.listingUrl}" style="background:#1a1a2e;color:white;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">
            Se stillingen →
          </a>
        </div>

        <hr style="margin:40px 0;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#aaa;">Done Jobs · done-jobs.no</p>
      </div>
    `,
  });
}
