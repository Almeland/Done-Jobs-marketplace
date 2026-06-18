import { prisma } from "@/lib/prisma";

export async function expireStaleListings(accountId: string) {
  const now = new Date();

  const expired = await prisma.jobListing.findMany({
    where: {
      accountId,
      status: { in: ["ACTIVE", "STOPPED"] },
      expiresAt: { lt: now },
    },
  });

  for (const l of expired) {
    await prisma.jobListing.update({
      where: { id: l.id },
      data: { status: "EXPIRED" },
    });
  }

  // Stub: warn 7 and 3 days before expiry
  const soon = await prisma.jobListing.findMany({
    where: {
      accountId,
      status: "ACTIVE",
      expiresAt: { gte: now },
    },
  });

  for (const l of soon) {
    if (!l.expiresAt) continue;
    const daysLeft = Math.ceil(
      (l.expiresAt.getTime() - now.getTime()) / 86_400_000
    );
    if (daysLeft === 7 || daysLeft === 3) {
      console.log(
        `[e-post stub] Annonse «${l.title}» utløper om ${daysLeft} dager`
      );
    }
  }
}
