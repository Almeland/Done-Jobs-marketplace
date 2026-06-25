import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FilterPanel from "./FilterPanel";
import JobAlertForm from "./JobAlertForm";
import { formaterLonn } from "@/lib/listing-utils";

export const metadata: Metadata = {
  title: "Ledige stillinger",
  description:
    "Bla gjennom ledige stillinger fra norske bedrifter. Filtrer på bransje, sted og lønn.",
};

const SALARY_BRACKETS = [
  { label: "Under 500 000 kr/år", value: "u500", min: null, max: 499999 },
  { label: "500 000 – 700 000 kr/år", value: "500-700", min: 500000, max: 700000 },
  { label: "700 000 – 900 000 kr/år", value: "700-900", min: 700000, max: 900000 },
  { label: "Over 900 000 kr/år", value: "o900", min: 900000, max: null },
];

export { SALARY_BRACKETS };

export default async function StillingerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const bransje = sp.bransje ?? "";
  const kategori = sp.kategori ?? "";
  const sted = sp.sted ?? "";
  const lonn = sp.lonn ?? "";
  const q = sp.q ?? "";

  const bracket = SALARY_BRACKETS.find((b) => b.value === lonn);

  const [listings, locationRows] = await Promise.all([
    prisma.jobListing.findMany({
      where: {
        status: "ACTIVE",
        ...(bransje ? { industry: bransje } : {}),
        ...(kategori ? { jobCategory: kategori } : {}),
        ...(sted ? { location: sted } : {}),
        ...(q ? {
          OR: [
            { title: { contains: q } },
            { body: { contains: q } },
            { location: { contains: q } },
            { account: { companyName: { contains: q } } },
          ],
        } : {}),
        ...(bracket
          ? {
              salaryType: "ANNUAL",
              ...(bracket.min !== null ? { salaryMax: { gte: bracket.min } } : {}),
              ...(bracket.max !== null ? { salaryMin: { lte: bracket.max } } : {}),
            }
          : {}),
      },
      include: { account: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.jobListing.findMany({
      where: { status: "ACTIVE", NOT: { location: null } },
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
    }),
  ]);

  const locations = locationRows.map((r) => r.location as string).sort();
  const hasFilters = !!(bransje || kategori || sted || lonn || q);

  return (
    <>
      {/* Hero */}
      <div className="bg-violet-drift px-6 py-14 text-center overflow-hidden">
        <h1 className="text-[26px] sm:text-[40px] font-semibold text-white tracking-tight leading-tight mb-3">
          Finn din neste jobb
        </h1>
        <p className="text-white/75 text-[14px] sm:text-[17px] max-w-md mx-auto">
          {listings.length > 0
            ? `${listings.length} ledige stilling${listings.length !== 1 ? "er" : ""} — nye muligheter hver dag`
            : "Nye stillinger publiseres daglig"}
        </p>
      </div>

    <div className="mx-auto max-w-3xl px-6 py-10">
      <FilterPanel bransje={bransje} kategori={kategori} sted={sted} lonn={lonn} q={q} locations={locations} />

      <div className="mb-8">
        <JobAlertForm bransje={bransje} kategori={kategori} sted={sted} />
      </div>

      {listings.length > 0 && (
        <ul className="space-y-3">
          {listings.map((l) => {
            const deadline = l.applicationDeadline ? new Date(l.applicationDeadline) : null;
            const deadlineSoon =
              deadline &&
              deadline.getTime() - Date.now() < 7 * 86_400_000 &&
              deadline.getTime() > Date.now();

            return (
              <li key={l.id}>
                <Link
                  href={`/stillinger/${l.id}`}
                  className="group flex items-start justify-between gap-4 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-midnight/60 mb-1">{l.account.companyName}</p>
                    <h2 className="text-[17px] font-semibold text-midnight group-hover:text-violet transition-colors">
                      {l.title}
                    </h2>
                    {l.source === "nav" && (
                      <span className="inline-block text-[10px] font-medium text-midnight/40 border border-midnight/15 rounded px-1.5 py-0.5 mt-1">
                        Kilde: NAV
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      {l.location && (
                        <span className="text-xs text-midnight/50 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {l.location}
                        </span>
                      )}
                      {l.industry && (
                        <span className="text-xs bg-lavender text-violet px-2 py-0.5 rounded-full">
                          {l.industry}
                        </span>
                      )}
                      {l.jobCategory && (
                        <span className="text-xs bg-platinum text-midnight/60 px-2 py-0.5 rounded-full">
                          {l.jobCategory}
                        </span>
                      )}
                    </div>
                    {formaterLonn(l.salaryMin, l.salaryMax, l.salaryType) && (
                      <span className="text-xs text-emerald-brand font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formaterLonn(l.salaryMin, l.salaryMax, l.salaryType)}
                      </span>
                    )}
                    {deadline && (
                      <p className={`text-xs mt-2 ${deadlineSoon ? "text-amber-brand font-medium" : "text-midnight/40"}`}>
                        Frist:{" "}
                        {deadline.toLocaleDateString("nb-NO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {deadlineSoon && " ⚠"}
                      </p>
                    )}
                  </div>
                  {(l.logoUrl ?? l.account.logoUrl) && (
                    <img
                      src={l.logoUrl ?? l.account.logoUrl ?? ""}
                      alt={l.account.companyName}
                      className="w-12 h-12 object-contain rounded-xl flex-shrink-0"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </>
  );
}
