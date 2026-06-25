import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const FEED_BASE = "https://pam-stilling-feed.nav.no";
const MAX_PAGES_PER_RUN = 30;
const MAX_NEW_FETCHES = 100;
const DETAIL_BATCH = 10;
const NAV_SYSTEM_EMAIL = "nav-sync@done-jobs.internal";

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

type FeedItem = {
  id: string;
  url: string;
  title: string;
  date_modified: string;
  _feed_entry: {
    uuid: string;
    status: "ACTIVE" | "INACTIVE";
    title: string;
    businessName: string;
    municipal: string;
    sistEndret: string;
  };
};

type FeedPage = {
  next_url: string | null;
  items: FeedItem[];
};

type ListingDetail = {
  uuid: string;
  title?: string;
  published?: string;
  expires?: string;
  description?: string;
  applicationDue?: string;
  applicationUrl?: string;
  sourceurl?: string;
  occupationCategories?: { level1?: string; level2?: string }[];
  workLocations?: { municipal?: string; county?: string }[];
  employer?: { name?: string; orgnr?: string };
  engagementtype?: string;
};

async function getToken(): Promise<string> {
  const stored = process.env.NAV_API_TOKEN;
  if (stored) return stored;
  // Fall back to public token
  const res = await fetch(`${FEED_BASE}/api/publicToken`, { cache: "no-store" });
  if (!res.ok) throw new Error("Kunne ikke hente offentlig NAV-token");
  const text = await res.text();
  return text.trim().replace(/^"|"$/g, "");
}

async function fetchFeedPage(url: string, token: string): Promise<FeedPage> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`NAV feed svarte ${res.status} på ${url}`);
  return res.json() as Promise<FeedPage>;
}

async function fetchDetail(url: string, token: string): Promise<ListingDetail | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<ListingDetail>;
  } catch {
    return null;
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
    if (secret) {
      if (req.headers.get("authorization") !== `Bearer ${secret}`) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const [token, systemUserId] = await Promise.all([getToken(), ensureSystemUser()]);

    // --- Paginer gjennom hele feedet og samle alle items ---
    const allItems: FeedItem[] = [];
    let nextUrl: string | null = `${FEED_BASE}/api/v1/feed`;

    let pagesRead = 0;
    while (nextUrl && pagesRead < MAX_PAGES_PER_RUN) {
      const page = await fetchFeedPage(nextUrl, token);
      allItems.push(...page.items);
      nextUrl = page.next_url;
      pagesRead++;
    }

    // --- Last eksisterende data fra DB ---
    const [existingListings, existingAccountsByOrgnr, existingAccountsByName] =
      await Promise.all([
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
    const accountByOrgnr = new Map(existingAccountsByOrgnr.map((a) => [a.orgNumber!, a.id]));
    const accountByName = new Map(existingAccountsByName.map((a) => [a.companyName.toLowerCase(), a.id]));

    // --- Del inn i aktive og inaktive ---
    const activeItems = allItems.filter((i) => i._feed_entry.status === "ACTIVE");
    const inactiveUuids = new Set(
      allItems
        .filter((i) => i._feed_entry.status === "INACTIVE")
        .map((i) => `nav:${i._feed_entry.uuid}`)
    );

    const activeNavKeys = new Set(activeItems.map((i) => `nav:${i._feed_entry.uuid}`));

    // --- Deaktiver utgåtte (inaktive + ikke lenger i feed) ---
    const toDeactivate = existingListings.filter(
      (l) => l.vilectId && (inactiveUuids.has(l.vilectId) || !activeNavKeys.has(l.vilectId))
    );
    if (toDeactivate.length > 0) {
      await prisma.jobListing.updateMany({
        where: { id: { in: toDeactivate.map((l) => l.id) } },
        data: { status: "EXPIRED" },
      });
    }

    // --- Finn nye stillinger som trenger full henting ---
    const newItems = activeItems.filter((i) => !listingMap.has(`nav:${i._feed_entry.uuid}`));
    const toFetch = newItems.slice(0, MAX_NEW_FETCHES);

    let added = 0;

    // Fetch details in parallel batches to stay within timeout
    for (let i = 0; i < toFetch.length; i += DETAIL_BATCH) {
      const batch = toFetch.slice(i, i + DETAIL_BATCH);
      const details = await Promise.all(batch.map((item) => fetchDetail(item.url, token)));

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const detail = details[j];
        const entry = item._feed_entry;
        const navKey = `nav:${entry.uuid}`;

        const companyName = detail?.employer?.name ?? entry.businessName ?? "Ukjent bedrift";
        const orgnr = detail?.employer?.orgnr?.replace(/\s/g, "") ?? null;

        // Finn eller opprett account
        let accountId: string;
        if (orgnr && accountByOrgnr.has(orgnr)) {
          accountId = accountByOrgnr.get(orgnr)!;
        } else if (!orgnr && accountByName.has(companyName.toLowerCase())) {
          accountId = accountByName.get(companyName.toLowerCase())!;
        } else {
          const created = await prisma.account.create({
            data: { companyName, orgNumber: orgnr ?? null },
          });
          accountId = created.id;
          if (orgnr) accountByOrgnr.set(orgnr, accountId);
          else accountByName.set(companyName.toLowerCase(), accountId);
        }

        const occ = detail?.occupationCategories?.[0];
        const loc = detail?.workLocations?.[0];
        const location = loc?.municipal
          ? capitalize(loc.municipal)
          : capitalize(entry.municipal) ?? null;

        let receiptMethod = "NONE";
        let receiptUrl: string | null = null;
        if (detail?.applicationUrl) {
          receiptMethod = "EXTERNAL_URL";
          receiptUrl = detail.applicationUrl;
        } else if (detail?.sourceurl) {
          receiptMethod = "EXTERNAL_URL";
          receiptUrl = detail.sourceurl;
        }

        const publishedAt = detail?.published ? new Date(detail.published) : new Date();

        await prisma.jobListing.create({
          data: {
            accountId,
            createdById: systemUserId,
            vilectId: navKey,
            source: "nav",
            title: detail?.title ?? entry.title ?? null,
            body: detail?.description ?? null,
            location,
            industry: occ?.level1 ?? null,
            jobCategory: occ?.level2 ?? null,
            applicationDeadline: parseDeadline(detail?.applicationDue),
            expiresAt: parseDeadline(detail?.expires),
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
      total_in_feed: allItems.length,
      active: activeItems.length,
      added,
      deactivated: toDeactivate.length,
      skipped_new: newItems.length - toFetch.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sync-nav]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
