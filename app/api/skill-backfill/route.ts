import { prisma } from "@/lib/prisma";
import { extractAndSaveJobSkills, debugExtract } from "@/lib/skill-extraction";

export const maxDuration = 60;

const BATCH = 5;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ?debug=1 kjører diagnostikk på én stilling og returnerer mellomresultater
  const url = new URL(req.url);
  if (url.searchParams.get("debug") === "1") {
    const listing = await prisma.jobListing.findFirst({
      where: { status: "ACTIVE", title: { not: null } },
      select: { id: true, title: true, body: true },
    });
    if (!listing) return Response.json({ error: "Ingen stilling funnet" });
    const result = await debugExtract(listing.id, listing.title ?? "", listing.body);
    return Response.json({ listing: { id: listing.id, title: listing.title }, ...result });
  }

  const listings = await prisma.jobListing.findMany({
    where: {
      status: "ACTIVE",
      title: { not: null },
      skillProfiles: { none: {} },
    },
    select: { id: true, title: true, body: true },
    take: BATCH,
  });

  let processed = 0;
  let totalSkills = 0;

  for (const listing of listings) {
    const saved = await extractAndSaveJobSkills(
      listing.id,
      listing.title ?? "",
      listing.body
    );
    totalSkills += saved;
    processed++;
  }

  const remaining = await prisma.jobListing.count({
    where: {
      status: "ACTIVE",
      title: { not: null },
      skillProfiles: { none: {} },
    },
  });

  return Response.json({ processed, totalSkills, remaining });
}
