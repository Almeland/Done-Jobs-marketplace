import { prisma } from "./prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function triggerJobAlerts(listingId: string) {
  const listing = await prisma.jobListing.findUnique({
    where: { id: listingId },
    include: { account: true },
  });
  if (!listing) return;

  const [alerts, followers] = await Promise.all([
    prisma.jobAlert.findMany({
      where: {
        AND: [
          listing.industry
            ? { OR: [{ bransje: null }, { bransje: listing.industry }] }
            : { bransje: null },
          listing.jobCategory
            ? { OR: [{ kategori: null }, { kategori: listing.jobCategory }] }
            : { kategori: null },
          listing.location
            ? { OR: [{ sted: null }, { sted: listing.location }] }
            : { sted: null },
        ],
      },
    }),
    prisma.companyFollow.findMany({
      where: { accountId: listing.accountId },
    }),
  ]);

  const listingUrl = `${BASE_URL}/stillinger/${listing.id}`;

  for (const alert of alerts) {
    const avmeldUrl = `${BASE_URL}/varsler/avslutt?token=${alert.token}`;
    console.log(
      `[e-post stub] Jobbvarsel → ${alert.email}\n` +
      `  Stilling: "${listing.title}" hos ${listing.account.companyName}\n` +
      `  Les mer: ${listingUrl}\n` +
      `  Avslutt varsel: ${avmeldUrl}`
    );
    await prisma.jobAlert.update({
      where: { id: alert.id },
      data: { lastSentAt: new Date() },
    });
  }

  for (const follower of followers) {
    const avmeldUrl = `${BASE_URL}/varsler/avslutt-bedrift?token=${follower.token}`;
    console.log(
      `[e-post stub] Bedriftsvarsel → ${follower.email}\n` +
      `  ${listing.account.companyName} har publisert: "${listing.title}"\n` +
      `  Les mer: ${listingUrl}\n` +
      `  Slutt å følge: ${avmeldUrl}`
    );
  }

  console.log(`[varsler] ${alerts.length} jobbvarsler, ${followers.length} bedriftsfølgere varslet`);
}
