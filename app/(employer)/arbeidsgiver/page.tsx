import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { opprettAnnonse } from "@/app/actions/listings";
import { utfyllingsgrad, relativTid } from "@/lib/listing-utils";
import { expireStaleListings } from "@/lib/expire-listings";
import { LISTING_DURATION_DAYS } from "@/lib/constants";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Utkast",
  ACTIVE: "Aktiv",
  STOPPED: "Stoppet",
  EXPIRED: "Utløpt",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-700",
  STOPPED: "bg-yellow-100 text-yellow-700",
  EXPIRED: "bg-red-100 text-red-600",
};

export default async function ArbeidgiverPage() {
  const user = await requireAuth();

  await expireStaleListings(user.accountId);

  const listings = await prisma.jobListing.findMany({
    where: { accountId: user.accountId },
    orderBy: { updatedAt: "desc" },
  });

  const drafts = listings.filter((l) => l.status === "DRAFT");
  const published = listings.filter((l) => l.status !== "DRAFT");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Annonser</h1>
        <form action={opprettAnnonse}>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + Ny annonse
          </button>
        </form>
      </div>

      {listings.length === 0 && (
        <p className="text-gray-500 text-sm">
          Du har ingen annonser ennå. Klikk «Ny annonse» for å komme i gang.
        </p>
      )}

      {/* Utkast */}
      {drafts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Utkast
          </h2>
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {drafts.map((l) => {
              const pct = utfyllingsgrad(l);
              return (
                <li key={l.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/arbeidsgiver/annonser/${l.id}/rediger`}
                      className="text-sm font-medium text-gray-800 hover:text-blue-600"
                    >
                      {l.title ?? (
                        <span className="italic text-gray-400">Uten tittel</span>
                      )}
                    </Link>
                    <span className="text-xs text-gray-400">
                      Sist redigert {relativTid(l.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Statistikktabell */}
      {published.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Publiserte annonser
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Stilling</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Publisert</th>
                  <th className="px-4 py-3 text-left">Søknadsfrist</th>
                  <th className="px-4 py-3 text-left">Dager igjen</th>
                  <th className="px-4 py-3 text-right">Visninger</th>
                  <th className="px-4 py-3 text-right">Søknadsknapp</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {published.map((l) => {
                  const everActive = l.firstPublishedAt !== null;
                  const daysLeft =
                    l.status === "ACTIVE" && l.expiresAt
                      ? Math.max(
                          0,
                          Math.ceil(
                            (new Date(l.expiresAt).getTime() - Date.now()) /
                              86_400_000
                          )
                        )
                      : null;

                  const deadline = l.applicationDeadline
                    ? new Date(l.applicationDeadline)
                    : null;
                  const deadlineSoon =
                    deadline &&
                    deadline.getTime() - Date.now() < 7 * 86_400_000 &&
                    deadline.getTime() > Date.now();

                  return (
                    <tr key={l.id} className="hover:bg-gray-50">
                      {/* Stilling */}
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                        <Link
                          href={`/arbeidsgiver/annonser/${l.id}/rediger`}
                          className="hover:text-blue-600 truncate block"
                        >
                          {l.title ?? <span className="italic text-gray-400">Uten tittel</span>}
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            STATUS_COLORS[l.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[l.status] ?? l.status}
                        </span>
                      </td>

                      {/* Publisert dato */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {l.publishedAt
                          ? new Date(l.publishedAt).toLocaleDateString("nb-NO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Søknadsfrist */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {deadline ? (
                          <span className={deadlineSoon ? "text-orange-600 font-medium" : "text-gray-500"}>
                            {deadline.toLocaleDateString("nb-NO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {deadlineSoon && " ⚠"}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Dager igjen */}
                      <td className="px-4 py-3">
                        {daysLeft !== null ? (
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{
                                  width: `${(daysLeft / LISTING_DURATION_DAYS) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {daysLeft}/{LISTING_DURATION_DAYS}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Visninger */}
                      <td className="px-4 py-3 text-right">
                        {everActive ? (
                          <span className="font-medium text-gray-700">{l.viewCount}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Søknadsknapp-klikk */}
                      <td className="px-4 py-3 text-right">
                        {everActive ? (
                          <span className="font-medium text-gray-700">{l.applyClickCount}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Rediger */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/arbeidsgiver/annonser/${l.id}/rediger`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Rediger
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
