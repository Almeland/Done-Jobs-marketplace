import { prisma } from "@/lib/prisma";
import { extractAndSaveJobSkills } from "@/lib/skill-extraction";

export const maxDuration = 60;

const BATCH = 15;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Aktive stillinger som ikke har ESCO-profil ennå
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
