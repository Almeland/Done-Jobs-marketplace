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
  DRAFT: "bg-platinum text-midnight/60",
  ACTIVE: "bg-emerald-brand/10 text-emerald-brand",
  STOPPED: "bg-amber-brand/10 text-amber-brand",
  EXPIRED: "bg-red-brand/10 text-red-brand",
};

export default async function ArbeidgiverPage() {
  const user = await requireAuth();

  await expireStaleListings(user.accountId);

  const [listings, followerCount] = await Promise.all([
    prisma.jobListing.findMany({
      where: { accountId: user.accountId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { applications: true } } },
    }),
    prisma.companyFollow.count({ where: { accountId: user.accountId } }),
  ]);

  const drafts = listings.filter((l) => l.status === "DRAFT");
  const published = listings.filter((l) => l.status !== "DRAFT");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-semibold text-midnight tracking-tight">Annonser</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/arbeidsgiver/profil"
            className="flex items-center gap-1.5 text-sm text-midnight/60 hover:text-midnight border border-platinum rounded-full px-4 py-2.5 hover:bg-platinum transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Bedriftsprofil
          </Link>
          <Link
            href="/arbeidsgiver/folgere"
            className="flex items-center gap-1.5 text-sm text-midnight/60 hover:text-midnight border border-platinum rounded-full px-4 py-2.5 hover:bg-platinum transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {followerCount} følger{followerCount !== 1 ? "e" : ""}
          </Link>
          <form action={opprettAnnonse}>
            <button
              type="submit"
              className="bg-midnight text-pearl rounded-full px-5 py-2.5 text-sm font-medium hover:bg-midnight/90 transition-colors"
            >
              + Ny annonse
            </button>
          </form>
        </div>
      </div>

      {listings.length === 0 && (
        <p className="text-midnight/50 text-sm">
          Du har ingen annonser ennå. Klikk «Ny annonse» for å komme i gang.
        </p>
      )}

      {/* Utkast */}
      {drafts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-3">
            Utkast
          </h2>
          <ul className="divide-y divide-platinum border border-platinum rounded-2xl bg-white">
            {drafts.map((l) => {
              const pct = utfyllingsgrad(l);
              return (
                <li key={l.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/arbeidsgiver/annonser/${l.id}/rediger`}
                      className="text-sm font-medium text-midnight hover:text-violet"
                    >
                      {l.title ?? (
                        <span className="italic text-midnight/40">Uten tittel</span>
                      )}
                    </Link>
                    <span className="text-xs text-midnight/30">
                      Sist redigert {relativTid(l.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-platinum rounded-full h-1.5">
                      <div
                        className="bg-violet h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-midnight/50 w-10 text-right">
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
          <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-3">
            Publiserte annonser
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-platinum">
            <table className="min-w-full text-sm">
              <thead className="bg-lavender text-xs font-semibold text-midnight/50 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Stilling</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Publisert</th>
                  <th className="px-4 py-3 text-left">Søknadsfrist</th>
                  <th className="px-4 py-3 text-left">Dager igjen</th>
                  <th className="px-4 py-3 text-right">Visninger</th>
                  <th className="px-4 py-3 text-right">Søknadsknapp</th>
                  <th className="px-4 py-3 text-right">Søknader</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum bg-white">
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
                    <tr key={l.id} className="hover:bg-pearl">
                      {/* Stilling */}
                      <td className="px-4 py-3 font-medium text-midnight max-w-[200px]">
                        <Link
                          href={`/arbeidsgiver/annonser/${l.id}/rediger`}
                          className="hover:text-violet truncate block"
                        >
                          {l.title ?? <span className="italic text-midnight/30">Uten tittel</span>}
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            STATUS_COLORS[l.status] ?? "bg-platinum text-midnight/60"
                          }`}
                        >
                          {STATUS_LABELS[l.status] ?? l.status}
                        </span>
                      </td>

                      {/* Publisert dato */}
                      <td className="px-4 py-3 text-midnight/50 whitespace-nowrap">
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
                          <span className={deadlineSoon ? "text-amber-brand font-medium" : "text-midnight/50"}>
                            {deadline.toLocaleDateString("nb-NO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {deadlineSoon && " ⚠"}
                          </span>
                        ) : (
                          <span className="text-midnight/20">—</span>
                        )}
                      </td>

                      {/* Dager igjen */}
                      <td className="px-4 py-3">
                        {daysLeft !== null ? (
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 bg-platinum rounded-full h-1.5">
                              <div
                                className="bg-emerald-brand h-1.5 rounded-full"
                                style={{
                                  width: `${(daysLeft / LISTING_DURATION_DAYS) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-midnight/50 whitespace-nowrap">
                              {daysLeft}/{LISTING_DURATION_DAYS}
                            </span>
                          </div>
                        ) : (
                          <span className="text-midnight/20 text-xs">—</span>
                        )}
                      </td>

                      {/* Visninger */}
                      <td className="px-4 py-3 text-right">
                        {everActive ? (
                          <span className="font-medium text-midnight">{l.viewCount}</span>
                        ) : (
                          <span className="text-midnight/20">—</span>
                        )}
                      </td>

                      {/* Søknadsknapp-klikk */}
                      <td className="px-4 py-3 text-right">
                        {everActive ? (
                          <span className="font-medium text-midnight">{l.applyClickCount}</span>
                        ) : (
                          <span className="text-midnight/20">—</span>
                        )}
                      </td>

                      {/* Søknader */}
                      <td className="px-4 py-3 text-right">
                        {l._count.applications > 0 ? (
                          <Link
                            href={`/arbeidsgiver/annonser/${l.id}/soknader`}
                            className="font-semibold text-violet hover:text-violet/80"
                          >
                            {l._count.applications}
                          </Link>
                        ) : (
                          <span className="text-midnight/20">0</span>
                        )}
                      </td>

                      {/* Rediger */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/arbeidsgiver/annonser/${l.id}/rediger`}
                          className="text-violet hover:text-violet/80 text-xs font-medium"
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
