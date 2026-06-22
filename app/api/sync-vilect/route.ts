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

  let added = 0, updated = 0, deactivated = 0;
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
    const vacancyUrl = (dept.VacancyURL as string) || null;

    // Upsert ett selskap per department
    const account = await prisma.account.upsert({
      where: { vilectDepartmentId },
      create: { companyName, vilectDepartmentId },
      update: { companyName },
    });

    const title = (version.Title as string) || null;
    const heading = (version.TitleHeading as string) || null;
    const engagement = (version.Engagement as string) || null;
    const county = ((version.Region as Record<string, unknown>)?.Country as Record<string, unknown>)?.County as string;
    const locationParts = [version.Location as string, county].filter(Boolean);
    const location = locationParts.join(", ") || null;
    const deadlineRaw = (version.ApplicationDeadline as string) || null;
    const dateEnd = v["@_date_end"] as string | null;
    const dateStart = v["@_date_start"] as string | null;

    const bodyParts: string[] = [];
    if (heading) bodyParts.push(`<p><strong>${heading}</strong></p>`);
    if (engagement) bodyParts.push(`<p>Stillingstype: ${engagement}</p>`);
    const body = bodyParts.join("\n") || null;

    const applicationDeadline = parseDeadline(deadlineRaw);
    const expiresAt = dateEnd ? new Date(dateEnd) : null;
    const publishedAt = dateStart ? new Date(dateStart) : new Date();

    const existing = await prisma.jobListing.findUnique({ where: { vilectId } });

    if (existing) {
      await prisma.jobListing.update({
        where: { id: existing.id },
        data: { title, body, location, applicationDeadline, expiresAt, status: "ACTIVE", accountId: account.id, publishedAt, firstPublishedAt: publishedAt },
      });
      updated++;
    } else {
      await prisma.jobListing.create({
        data: {
          accountId: account.id,
          createdById: SYSTEM_USER_ID,
          vilectId,
          source: "vilect",
          title,
          body,
          location,
          applicationDeadline,
          expiresAt,
          receiptMethod: "EXTERNAL_URL",
          receiptUrl: vacancyUrl,
          status: "ACTIVE",
          publishedAt,
          firstPublishedAt: publishedAt,
        },
      });
      added++;
    }
  }

  // Deaktiver stillinger som ikke lenger er i feeden
  const toCheck = await prisma.jobListing.findMany({
    where: { source: "vilect", status: "ACTIVE" },
    select: { id: true, vilectId: true },
  });

  for (const l of toCheck) {
    if (l.vilectId && !activeVilectIds.has(l.vilectId)) {
      await prisma.jobListing.update({ where: { id: l.id }, data: { status: "EXPIRED" } });
      deactivated++;
    }
  }

  return Response.json({ added, updated, deactivated, total: activeVilectIds.size });
}
