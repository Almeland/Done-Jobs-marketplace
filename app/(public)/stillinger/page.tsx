import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FilterPanel from "./FilterPanel";
import JobAlertForm from "./JobAlertForm";

export default async function StillingerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const bransje = sp.bransje ?? "";
  const kategori = sp.kategori ?? "";
  const sted = sp.sted ?? "";

  const [listings, locationRows] = await Promise.all([
    prisma.jobListing.findMany({
      where: {
        status: "ACTIVE",
        ...(bransje ? { industry: bransje } : {}),
        ...(kategori ? { jobCategory: kategori } : {}),
        ...(sted ? { location: sted } : {}),
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
  const hasFilters = !!(bransje || kategori || sted);

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-[32px] font-semibold text-midnight mb-2 tracking-tight">
        Ledige stillinger
      </h1>
      <p className="text-[16px] text-midnight/50 mb-8">
        {listings.length === 0 && hasFilters
          ? "Ingen treff på valgte filtre."
          : listings.length === 0
          ? "Ingen aktive stillinger for øyeblikket."
          : `${listings.length} stilling${listings.length !== 1 ? "er" : ""} utlyst`}
      </p>

      <FilterPanel bransje={bransje} kategori={kategori} sted={sted} locations={locations} />

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
                    <p className="text-sm text-midnight/40 mb-1">{l.account.companyName}</p>
                    <h2 className="text-[16px] font-semibold text-midnight group-hover:text-violet transition-colors">
                      {l.title}
                    </h2>
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
  );
}
