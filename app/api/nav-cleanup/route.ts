import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const FEED_BASE = "https://pam-stilling-feed.nav.no";
const CHECK_BATCH = 20;

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

async function isStillActive(uuid: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`${FEED_BASE}/api/v1/feedentry/${uuid}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 404) return false;
    if (!res.ok) return true; // behold ved midlertidig feil
    const data = await res.json() as { status?: string };
    return data.status === "ACTIVE";
  } catch {
    return true; // behold ved nettverksfeil
  }
}

export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const token = await getToken();

    // Alle aktive NAV-stillinger (ekskluder cursor-post)
    const active = await prisma.jobListing.findMany({
      where: {
        source: "nav",
        status: "ACTIVE",
        NOT: { vilectId: "nav:__cursor__" },
      },
      select: { id: true, vilectId: true },
    });

    let expired = 0;
    let checked = 0;

    // Sjekk i batches for å holde oss innenfor timeout
    for (let i = 0; i < active.length; i += CHECK_BATCH) {
      const batch = active.slice(i, i + CHECK_BATCH);
      const results = await Promise.all(
        batch.map((l) => {
          const uuid = l.vilectId!.replace("nav:", "");
          return isStillActive(uuid, token);
        })
      );

      const toExpire = batch
        .filter((_, j) => !results[j])
        .map((l) => l.id);

      if (toExpire.length > 0) {
        await prisma.jobListing.updateMany({
          where: { id: { in: toExpire } },
          data: { status: "EXPIRED" },
        });
        expired += toExpire.length;
      }

      checked += batch.length;
    }

    return Response.json({ checked, expired });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[nav-cleanup]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
