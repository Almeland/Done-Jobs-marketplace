import { prisma } from "@/lib/prisma";
import { fetchEnrichment } from "@/lib/brreg";

export const maxDuration = 60;

const BATCH = 20;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Accounts med orgNumber som mangler website OG foundedYear (ikke beriket ennå)
  const accounts = await prisma.account.findMany({
    where: {
      orgNumber: { not: null },
      website: null,
      foundedYear: null,
    },
    select: { id: true, orgNumber: true },
    take: BATCH,
  });

  let enriched = 0;
  let notFound = 0;

  for (const account of accounts) {
    const brreg = await fetchEnrichment(account.orgNumber!).catch(() => null);
    if (!brreg) {
      notFound++;
      // Marker som forsøkt ved å sette foundedYear=0 (unngår gjentatte kall)
      await prisma.account.update({
        where: { id: account.id },
        data: { foundedYear: 0 },
      });
      continue;
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        website: brreg.website ?? undefined,
        employeeCount: brreg.employeeCount ?? undefined,
        foundedYear: brreg.foundedYear ?? 0,
      },
    });
    enriched++;
  }

  const remaining = await prisma.account.count({
    where: { orgNumber: { not: null }, website: null, foundedYear: null },
  });

  return Response.json({ processed: accounts.length, enriched, notFound, remaining });
}
