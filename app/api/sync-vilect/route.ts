import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const FEED_URL = process.env.VILECT_FEED_URL!;
const SYSTEM_USER_ID = process.env.VILECT_SYSTEM_USER_ID!;

function parseDeadline(raw: string | null): Date | null {
  if (!raw) return null;
  const [d, m, y] = raw.split(".");
  if (!d || !m || !y) return null;
  return new Date(`${y}-${m}-${d}`);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const res = await fetch(FEED_URL, { cache: "no-store" });
  if (!res.ok) return Response.json({ error: "Feed utilgjengelig" }, { status: 502 });
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    isArray: (name) => ["Vacancy", "Department", "Version"].includes(name),
  });

  const data = parser.parse(xml);
  const vacancies: unknown[] = data?.VacancyList?.Vacancy ?? [];

  // --- Steg 1: Hent alle eksisterende Vilect-kontoer og stillinger i én query ---
  const [existingAccounts, existingListings] = await Promise.all([
    prisma.account.findMany({
      where: { vilectDepartmentId: { not: null } },
      select: { id: true, vilectDepartmentId: true, companyName: true },
    }),
    prisma.jobListing.findMany({
      where: { source: "vilect" },
      select: { id: true, vilectId: true, accountId: true },
    }),
  ]);

  const accountMap = new Map(existingAccounts.map((a) => [a.vilectDepartmentId!, a]));
  const listingMap = new Map(existingListings.map((l) => [l.vilectId!, l]));

  // --- Steg 2: Parse XML og bygg opp lister for creates/updates ---
  type AccountCreate = { companyName: string; vilectDepartmentId: string };
  type ListingData = {
    vilectId: string; accountDeptId: string; title: string | null; body: string | null;
    location: string | null; applicationDeadline: Date | null; expiresAt: Date | null;
    publishedAt: Date; receiptUrl: string | null;
  };

  const newAccounts: AccountCreate[] = [];
  const listingsToProcess: ListingData[] = [];
  const activeVilectIds = new Set<string>();

  for (const v of vacancies as Record<string, unknown>[]) {
    const vilectId = String(v["@_id"]);
    activeVilectIds.add(vilectId);

    const versions = (v.Versions as Record<string, unknown>)?.Version as Record<string, unknown>[];
    const version = versions?.find((ver) => ver["@_language"] === "no") ?? versions?.[0] ?? {};
    const depts = (v.Departments as Record<string, unknown>)?.Department as Record<string, unknown>[];
    const dept = depts?.[0] ?? {};

    const vilectDepartmentId = String(dept["@_id"] ?? `dept-${vilectId}`);
    const companyName = (dept.Name as string) || "Ukjent bedrift";

    if (!accountMap.has(vilectDepartmentId)) {
      if (!newAccounts.find((a) => a.vilectDepartmentId === vilectDepartmentId)) {
        newAccounts.push({ companyName, vilectDepartmentId });
      }
    }

    const title = (version.Title as string) || null;
    const heading = (version.TitleHeading as string) || null;
    const engagement = (version.Engagement as string) || null;
    const county = ((version.Region as Record<string, unknown>)?.Country as Record<string, unknown>)?.County as string;
    const location = [version.Location as string, county].filter(Boolean).join(", ") || null;
    const deadlineRaw = (version.ApplicationDeadline as string) || null;
    const dateEnd = v["@_date_end"] as string | null;
    const dateStart = v["@_date_start"] as string | null;

    const bodyParts: string[] = [];
    if (heading) bodyParts.push(`<p><strong>${heading}</strong></p>`);
    if (engagement) bodyParts.push(`<p>Stillingstype: ${engagement}</p>`);

    listingsToProcess.push({
      vilectId,
      accountDeptId: vilectDepartmentId,
      title,
      body: bodyParts.join("\n") || null,
      location,
      applicationDeadline: parseDeadline(deadlineRaw),
      expiresAt: dateEnd ? new Date(dateEnd) : null,
      publishedAt: dateStart ? new Date(dateStart) : new Date(),
      receiptUrl: (dept.VacancyURL as string) || null,
    });
  }

  // --- Steg 3: Opprett manglende kontoer sekvensielt (få unike selskaper) ---
  for (const acc of newAccounts) {
    const created = await prisma.account.create({
      data: { companyName: acc.companyName, vilectDepartmentId: acc.vilectDepartmentId },
    });
    accountMap.set(acc.vilectDepartmentId, { id: created.id, vilectDepartmentId: acc.vilectDepartmentId, companyName: acc.companyName });
  }

  // --- Steg 4: Batch creates og updates for stillinger ---
  const toCreate = listingsToProcess.filter((l) => !listingMap.has(l.vilectId));
  const toUpdate = listingsToProcess.filter((l) => listingMap.has(l.vilectId));

  let added = 0, updated = 0, deactivated = 0;

  // Batch create
  if (toCreate.length > 0) {
    await prisma.jobListing.createMany({
      data: toCreate.map((l) => ({
        accountId: accountMap.get(l.accountDeptId)!.id,
        createdById: SYSTEM_USER_ID,
        vilectId: l.vilectId,
        source: "vilect",
        title: l.title,
        body: l.body,
        location: l.location,
        applicationDeadline: l.applicationDeadline,
        expiresAt: l.expiresAt,
        receiptMethod: "EXTERNAL_URL",
        receiptUrl: l.receiptUrl,
        status: "ACTIVE",
        publishedAt: l.publishedAt,
        firstPublishedAt: l.publishedAt,
      })),
    });
    added = toCreate.length;
  }

  // Batch updates via transaction
  if (toUpdate.length > 0) {
    await prisma.$transaction(
      toUpdate.map((l) =>
        prisma.jobListing.update({
          where: { vilectId: l.vilectId },
          data: {
            title: l.title,
            body: l.body,
            location: l.location,
            applicationDeadline: l.applicationDeadline,
            expiresAt: l.expiresAt,
            status: "ACTIVE",
            accountId: accountMap.get(l.accountDeptId)!.id,
            publishedAt: l.publishedAt,
          },
        })
      )
    );
    updated = toUpdate.length;
  }

  // Deaktiver utgåtte
  const toDeactivate = existingListings.filter(
    (l) => l.vilectId && !activeVilectIds.has(l.vilectId)
  );
  if (toDeactivate.length > 0) {
    await prisma.jobListing.updateMany({
      where: { id: { in: toDeactivate.map((l) => l.id) } },
      data: { status: "EXPIRED" },
    });
    deactivated = toDeactivate.length;
  }

  return Response.json({ added, updated, deactivated, total: activeVilectIds.size });
}
