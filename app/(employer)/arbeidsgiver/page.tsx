import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { opprettAnnonse } from "@/app/actions/listings";
import { utfyllingsgrad, relativTid } from "@/lib/listing-utils";
import { expireStaleListings } from "@/lib/expire-listings";
import Link from "next/link";

export default async function ArbeidgiverPage() {
  const user = await requireAuth();

  await expireStaleListings(user.accountId);

  const listings = await prisma.jobListing.findMany({
    where: { accountId: user.accountId },
    orderBy: { updatedAt: "desc" },
  });

  const drafts = listings.filter((l) => l.status === "DRAFT");
  const active = listings.filter((l) => l.status !== "DRAFT");

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

      {drafts.length > 0 && (
        <section className="mb-8">
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

      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Aktive annonser
          </h2>
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {active.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">{l.title}</span>
                <Link
                  href={`/arbeidsgiver/annonser/${l.id}/rediger`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Rediger
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
