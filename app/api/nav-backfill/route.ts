import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const FEED_BASE = "https://pam-stilling-feed.nav.no";
const BATCH_SIZE = 40; // serielt for å unngå rate-limit

function extractJwt(raw: string): string {
  const match = raw.match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
  return match ? match[0] : raw.trim();
}

async function getToken(): Promise<string> {
  const stored = process.env.NAV_API_TOKEN;
  if (stored) return extractJwt(stored);
  const res = await fetch(`${FEED_BASE}/api/publicToken`, { cache: "no-store" });
  if (!res.ok) throw new Error("Kunne ikke hente NAV-token");
  return extractJwt(await res.text());
}

function capitalize(str?: string): string | null {
  if (!str) return null;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const token = await getToken();

    // Hent aktive NAV-stillinger uten body
    const listings = await prisma.jobListing.findMany({
      where: {
        source: "nav",
        status: "ACTIVE",
        body: null,
        vilectId: { not: "nav:__cursor__" },
      },
      select: { id: true, vilectId: true },
      take: BATCH_SIZE,
    });

    let updated = 0;
    let stillEmpty = 0;
    let deactivated = 0;

    for (const listing of listings) {
      const uuid = listing.vilectId!.replace("nav:", "");
      const url = `${FEED_BASE}/api/v1/feedentry/${uuid}`;

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          stillEmpty++;
          continue;
        }

        const entry = await res.json() as {
          status?: string;
          ad_content?: {
            title?: string;
            description?: string;
            applicationUrl?: string;
            sourceurl?: string;
            applicationDue?: string;
            expires?: string;
            workLocations?: { city?: string; municipal?: string }[];
            occupationCategories?: { level1?: string; level2?: string }[];
            employer?: { name?: string; orgnr?: string };
          };
        };

        if (entry.status === "INACTIVE" || !entry.ad_content) {
          // Ikke lenger aktiv
          await prisma.jobListing.update({
            where: { id: listing.id },
            data: { status: "EXPIRED" },
          });
          deactivated++;
          continue;
        }

        const ac = entry.ad_content;
        const loc = ac.workLocations?.[0];
        const occ = ac.occupationCategories?.[0];

        const receiptUrl = ac.applicationUrl ?? ac.sourceurl ?? null;

        await prisma.jobListing.update({
          where: { id: listing.id },
          data: {
            body: ac.description ?? null,
            title: ac.title ?? undefined,
            location: loc?.city ? capitalize(loc.city) : loc?.municipal ? capitalize(loc.municipal) : undefined,
            industry: occ?.level1 ?? undefined,
            jobCategory: occ?.level2 ?? undefined,
            applicationDeadline: ac.applicationDue ? new Date(ac.applicationDue) : undefined,
            expiresAt: ac.expires ? new Date(ac.expires) : undefined,
            receiptMethod: receiptUrl ? "EXTERNAL_URL" : undefined,
            receiptUrl: receiptUrl,
          },
        });

        if (ac.description) updated++;
        else stillEmpty++;
      } catch {
        stillEmpty++;
      }
    }

    return Response.json({
      processed: listings.length,
      updated,
      deactivated,
      still_empty: stillEmpty,
      remaining: await prisma.jobListing.count({
        where: { source: "nav", status: "ACTIVE", body: null, vilectId: { not: "nav:__cursor__" } },
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
