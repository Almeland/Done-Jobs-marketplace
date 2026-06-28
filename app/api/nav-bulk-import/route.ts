/**
 * NAV bulk import — leser feeden fra starten uten 90-dagersgrense.
 * Bruker separat cursor (nav:__bulk_cursor__) for å ikke påvirke den løpende synken.
 * Kjør manuelt eller via cron inntil feed_done: true og remaining_fetches: 0.
 */
import { prisma } from "@/lib/prisma";
import { fetchEnrichment } from "@/lib/brreg";

export const maxDuration = 60;

const FEED_BASE = "https://pam-stilling-feed.nav.no";
const MAX_PAGES_PER_RUN = 40;
const MAX_NEW_FETCHES = 250;
const DETAIL_PARALLEL = 25;
const NAV_SYSTEM_EMAIL = "nav-sync@done-jobs.internal";
const BULK_CURSOR_ID = "nav:__bulk_cursor__";

type FeedItem = {
  id: string;
  url: string;
  title: string;
  _feed_entry: {
    uuid: string;
    status: "ACTIVE" | "INACTIVE";
    title: string;
    businessName: string;
    municipal: string;
    sistEndret: string;
  };
};

type FeedPage = { next_url: string | null; items: FeedItem[] };

type AdContent = {
  title?: string;
  published?: string;
  expires?: string;
  description?: string;
  applicationDue?: string;
  applicationUrl?: string;
  sourceurl?: string;
  occupationCategories?: { level1?: string; level2?: string }[];
  workLocations?: { city?: string; municipal?: string; county?: string }[];
  employer?: { name?: string; orgnr?: string };
};

type FeedEntry = { uuid: string; status: string; ad_content?: AdContent };

async function ensureSystemUser(): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: NAV_SYSTEM_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;

  const account = await prisma.account.create({
    data: { companyName: "NAV (Arbeids- og velferdsetaten)" },
  });
  const user = await prisma.user.create({
    data: {
      accountId: account.id,
      name: "NAV Sync",
      email: NAV_SYSTEM_EMAIL,
      passwordHash: "system",
      role: "SYSTEM",
    },
  });
  return user.id;
}

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

function toAbsolute(url: string): string {
  return url.startsWith("http") ? url : `${FEED_BASE}${url}`;
}

async function fetchFeedPage(url: string, token: string): Promise<FeedPage> {
  const res = await fetch(toAbsolute(url), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NAV feed ${res.status}`);
  return res.json() as Promise<FeedPage>;
}

async function fetchDetail(url: string, token: string): Promise<AdContent | null> {
  if (!url) return null;
  try {
    const res = await fetch(toAbsolute(url), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = await res.json() as Record<string, unknown>;
    // NAV uses two layouts: { ad_content: {...} } for newer, direct object for older
    if (body.ad_content && typeof body.ad_content === "object") {
      return body.ad_content as AdContent;
    }
    if (body.title || body.description) {
      return body as unknown as AdContent;
    }
    return null;
  } catch {
    return null;
  }
}

async function sampleDetail(url: string, token: string): Promise<unknown> {
  if (!url) return { error: "empty_url" };
  try {
    const res = await fetch(toAbsolute(url), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { http_status: res.status, url };
    return await res.json();
  } catch (e) {
    return { error: String(e), url };
  }
}

async function readBulkCursor(): Promise<string | null> {
  const rec = await prisma.jobListing.findUnique({
    where: { vilectId: BULK_CURSOR_ID },
    select: { receiptUrl: true },
  });
  return rec?.receiptUrl ?? null;
}

async function writeBulkCursor(nextUrl: string | null, systemUserId: string): Promise<void> {
  if (!nextUrl) return;
  const existing = await prisma.jobListing.findUnique({ where: { vilectId: BULK_CURSOR_ID } });
  if (existing) {
    await prisma.jobListing.update({
      where: { vilectId: BULK_CURSOR_ID },
      data: { receiptUrl: nextUrl },
    });
  } else {
    const user = await prisma.user.findUnique({
      where: { email: NAV_SYSTEM_EMAIL },
      select: { accountId: true },
    });
    if (!user) return;
    await prisma.jobListing.create({
      data: {
        vilectId: BULK_CURSOR_ID,
        accountId: user.accountId,
        createdById: systemUserId,
        source: "nav",
        title: "__bulk_cursor__",
        status: "DRAFT",
        receiptUrl: nextUrl,
      },
    });
  }
}

function parseDeadline(raw?: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
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

    const [token, systemUserId] = await Promise.all([getToken(), ensureSystemUser()]);

    const urlObj = new URL(req.url);

    // ?reset=1 — sletter bulk-cursor slik at neste kjøring starter fra begynnelsen
    if (urlObj.searchParams.get("reset") === "1") {
      const existing = await prisma.jobListing.findUnique({ where: { vilectId: BULK_CURSOR_ID } });
      if (existing) {
        await prisma.jobListing.delete({ where: { vilectId: BULK_CURSOR_ID } });
        return Response.json({ reset: true });
      }
      return Response.json({ reset: false, reason: "no_cursor_found" });
    }

    // ?sample=1 — henter første aktive item fra cursor-posisjon og viser rårespons fra detail-API
    if (urlObj.searchParams.get("sample") === "1") {
      const savedCursor = await readBulkCursor();
      const startUrl = savedCursor ?? `${FEED_BASE}/api/v1/feed`;
      const page = await fetchFeedPage(startUrl, token);
      const activeItem = page.items.find((i) => i._feed_entry?.status === "ACTIVE");
      if (!activeItem) {
        return Response.json({ error: "no_active_item_on_page", sample_url: startUrl, items_count: page.items.length });
      }
      const raw = await sampleDetail(activeItem.url, token);
      return Response.json({ feed_item: activeItem, detail_response: raw });
    }

    const savedCursor = await readBulkCursor();
    let nextUrl: string | null = savedCursor ?? `${FEED_BASE}/api/v1/feed`;

    // Les sider fra bulk-cursor-posisjon
    const allItems: FeedItem[] = [];
    let pagesRead = 0;

    while (nextUrl && pagesRead < MAX_PAGES_PER_RUN) {
      const page = await fetchFeedPage(nextUrl, token);
      allItems.push(...page.items);
      nextUrl = page.next_url;
      pagesRead++;
    }

    await writeBulkCursor(nextUrl, systemUserId);
    const feedDone = nextUrl === null;

    // Last eksisterende NAV-stillinger
    const [existingListings, existingByOrgnr, existingByName] = await Promise.all([
      prisma.jobListing.findMany({
        where: { source: "nav" },
        select: { id: true, vilectId: true },
      }),
      prisma.account.findMany({
        where: { orgNumber: { not: null } },
        select: { id: true, orgNumber: true },
      }),
      prisma.account.findMany({
        where: { orgNumber: null, vilectDepartmentId: null },
        select: { id: true, companyName: true },
      }),
    ]);

    const listingMap = new Map(existingListings.map((l) => [l.vilectId!, l.id]));
    const accountByOrgnr = new Map(existingByOrgnr.map((a) => [a.orgNumber!, a.id]));
    const accountByName = new Map(existingByName.map((a) => [a.companyName.toLowerCase(), a.id]));

    // Deaktiver INACTIVE-hendelser vi så i denne batchen
    const inactiveUuids = new Set(
      allItems
        .filter((i) => i._feed_entry?.status === "INACTIVE")
        .map((i) => `nav:${i._feed_entry.uuid}`)
    );
    const toDeactivate = existingListings.filter(
      (l) => l.vilectId && l.vilectId !== BULK_CURSOR_ID && l.vilectId !== "nav:__cursor__" &&
        inactiveUuids.has(l.vilectId)
    );
    if (toDeactivate.length > 0) {
      await prisma.jobListing.updateMany({
        where: { id: { in: toDeactivate.map((l) => l.id) } },
        data: { status: "EXPIRED" },
      });
    }

    // Nye aktive stillinger — ingen aldersgrense (det er poenget med bulk-ruten)
    const activeItems = allItems.filter((i) => i._feed_entry?.status === "ACTIVE");
    const newItems = activeItems.filter(
      (i) => !listingMap.has(`nav:${i._feed_entry.uuid}`)
    );
    const toFetch = newItems.slice(0, MAX_NEW_FETCHES);
    let added = 0;

    // Parallell detail-henting i bolker
    for (let i = 0; i < toFetch.length; i += DETAIL_PARALLEL) {
      const batch = toFetch.slice(i, i + DETAIL_PARALLEL);

      const results = await Promise.all(
        batch.map(async (item) => {
          const detail = await fetchDetail(item.url, token);
          return { item, detail };
        })
      );

      for (const { item, detail } of results) {
        if (!detail) continue;

        const entry = item._feed_entry;
        const navKey = `nav:${entry.uuid}`;

        const companyName = detail.employer?.name ?? entry.businessName ?? "Ukjent bedrift";
        const orgnr = detail.employer?.orgnr?.replace(/\s/g, "") ?? null;

        let accountId: string;
        let isNewAccount = false;

        if (orgnr && accountByOrgnr.has(orgnr)) {
          accountId = accountByOrgnr.get(orgnr)!;
        } else if (!orgnr && accountByName.has(companyName.toLowerCase())) {
          accountId = accountByName.get(companyName.toLowerCase())!;
        } else {
          const created = await prisma.account.create({
            data: { companyName, orgNumber: orgnr ?? null },
          });
          accountId = created.id;
          isNewAccount = true;
          if (orgnr) accountByOrgnr.set(orgnr, accountId);
          else accountByName.set(companyName.toLowerCase(), accountId);
        }

        if (isNewAccount && orgnr) {
          fetchEnrichment(orgnr)
            .then((brreg) => {
              if (!brreg) return;
              return prisma.account.update({
                where: { id: accountId },
                data: {
                  website: brreg.website ?? undefined,
                  employeeCount: brreg.employeeCount ?? undefined,
                  foundedYear: brreg.foundedYear ?? undefined,
                },
              });
            })
            .catch(() => null);
        }

        const occ = detail.occupationCategories?.[0];
        const loc = detail.workLocations?.[0];
        const location = loc?.city
          ? capitalize(loc.city)
          : loc?.municipal
          ? capitalize(loc.municipal)
          : capitalize(entry.municipal) ?? null;

        let receiptMethod = "NONE";
        let receiptUrl: string | null = null;
        if (detail.applicationUrl) {
          receiptMethod = "EXTERNAL_URL";
          receiptUrl = detail.applicationUrl;
        } else if (detail.sourceurl) {
          receiptMethod = "EXTERNAL_URL";
          receiptUrl = detail.sourceurl;
        }

        const publishedAt = detail.published ? new Date(detail.published) : new Date();

        const existing = await prisma.jobListing.findUnique({
          where: { vilectId: navKey },
          select: { id: true },
        });
        if (existing) continue;

        await prisma.jobListing.create({
          data: {
            accountId,
            createdById: systemUserId,
            vilectId: navKey,
            source: "nav",
            title: detail.title ?? entry.title ?? null,
            body: detail.description ?? null,
            location,
            industry: occ?.level1 ?? null,
            jobCategory: occ?.level2 ?? null,
            applicationDeadline: parseDeadline(detail.applicationDue),
            expiresAt: parseDeadline(detail.expires),
            receiptMethod,
            receiptUrl,
            status: "ACTIVE",
            publishedAt,
            firstPublishedAt: publishedAt,
          },
        });

        listingMap.set(navKey, "created");
        added++;
      }
    }

    return Response.json({
      cursor_was: savedCursor ? "stored" : "beginning",
      pages_read: pagesRead,
      feed_done: feedDone,
      active_in_batch: activeItems.length,
      new_found: newItems.length,
      added,
      deactivated: toDeactivate.length,
      skipped: newItems.length - toFetch.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[nav-bulk-import]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
