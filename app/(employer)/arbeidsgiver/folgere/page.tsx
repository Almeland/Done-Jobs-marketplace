import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function FolgerePage() {
  const user = await requireAuth();

  const followers = await prisma.companyFollow.findMany({
    where: { accountId: user.accountId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/arbeidsgiver"
            className="text-sm text-midnight/50 hover:text-midnight mb-2 inline-block"
          >
            ← Tilbake
          </Link>
          <h1 className="text-[28px] font-semibold text-midnight tracking-tight">
            Følgere
          </h1>
        </div>
        <span className="text-2xl font-semibold text-violet">{followers.length}</span>
      </div>

      {followers.length === 0 ? (
        <div className="text-center py-16 text-midnight/40">
          <p className="text-4xl mb-4">👥</p>
          <p className="text-sm">Ingen følger bedriften din ennå.</p>
          <p className="text-xs mt-1">Følgere vises her når kandidater trykker «Følg bedriften» på en av annonsene dine.</p>
        </div>
      ) : (
        <div className="border border-platinum rounded-2xl overflow-hidden bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-lavender text-xs font-semibold text-midnight/50 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Navn</th>
                <th className="px-5 py-3 text-left">E-post</th>
                <th className="px-5 py-3 text-left">Følger siden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-platinum">
              {followers.map((f) => (
                <tr key={f.id} className="hover:bg-pearl">
                  <td className="px-5 py-3 font-medium text-midnight">
                    {f.followerName ?? <span className="text-midnight/30 italic">Ikke oppgitt</span>}
                  </td>
                  <td className="px-5 py-3">
                    <a
                      href={`mailto:${f.email}`}
                      className="text-violet hover:text-violet/70"
                    >
                      {f.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-midnight/50">
                    {new Date(f.createdAt).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-midnight/30 mt-6">
        Følgere har samtykket til at bedriften kan se at de følger dere.
      </p>
    </div>
  );
}
