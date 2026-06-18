import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StillingerPage() {
  const listings = await prisma.jobListing.findMany({
    where: { status: "ACTIVE" },
    include: { account: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Ledige stillinger
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {listings.length === 0
          ? "Ingen aktive stillinger for øyeblikket."
          : `${listings.length} stilling${listings.length !== 1 ? "er" : ""} utlyst`}
      </p>

      {listings.length > 0 && (
        <ul className="space-y-4">
          {listings.map((l) => {
            const daysLeft = l.expiresAt
              ? Math.max(0, Math.ceil((new Date(l.expiresAt).getTime() - Date.now()) / 86_400_000))
              : null;
            const deadline = l.applicationDeadline
              ? new Date(l.applicationDeadline)
              : null;
            const deadlineSoon =
              deadline &&
              deadline.getTime() - Date.now() < 7 * 86_400_000 &&
              deadline.getTime() > Date.now();

            return (
              <li key={l.id}>
                <Link
                  href={`/stillinger/${l.id}`}
                  className="block border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-gray-900 mb-1">
                        {l.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {l.account.companyName}
                      </p>
                    </div>
                    {(l.logoUrl ?? l.account.logoUrl) && (
                      <img
                        src={l.logoUrl ?? l.account.logoUrl ?? ""}
                        alt={l.account.companyName}
                        className="w-12 h-12 object-contain rounded"
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                    {deadline && (
                      <span className={deadlineSoon ? "text-orange-600 font-medium" : ""}>
                        Frist:{" "}
                        {deadline.toLocaleDateString("nb-NO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {deadlineSoon && " ⚠"}
                      </span>
                    )}
                    {daysLeft !== null && (
                      <span>{daysLeft} dager igjen</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
