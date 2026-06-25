import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getJobSeekerSession } from "@/lib/session";
import Link from "next/link";
import FolgKnapp from "./FolgKnapp";
import BedriftSøk from "./BedriftSøk";

export const metadata: Metadata = {
  title: "Bedrifter",
  description:
    "Utforsk norske bedrifter med profil på Done Jobs. Se aktive stillinger, firmadata og følg bedrifter du er interessert i.",
};

export default async function BedrifterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const jobSeeker = await getJobSeekerSession();

  const accounts = await prisma.account.findMany({
    where: q
      ? { companyName: { contains: q } }
      : undefined,
    include: {
      _count: {
        select: {
          listings: { where: { status: "ACTIVE" } },
          followers: true,
        },
      },
    },
    orderBy: { listings: { _count: "desc" } },
  });

  const followedIds = jobSeeker
    ? new Set(
        (await prisma.companyFollow.findMany({
          where: { jobSeekerId: jobSeeker.id },
          select: { accountId: true },
        })).map((f) => f.accountId)
      )
    : new Set<string>();

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-[32px] font-semibold text-midnight mb-2 tracking-tight">Bedrifter</h1>
      <p className="text-[16px] text-midnight/50 mb-6">
        {accounts.length} bedrift{accounts.length !== 1 ? "er" : ""}{q ? ` for «${q}»` : " med profil på Done Jobs"}
      </p>

      <BedriftSøk q={q} />

      <ul className="space-y-3">
        {accounts.map((a) => {
          const isFollowing = followedIds.has(a.id);
          return (
            <li key={a.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <Link href={`/bedrifter/${a.id}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                  {a.logoUrl ? (
                    <img src={a.logoUrl} alt={a.companyName} className="w-12 h-12 rounded-xl object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-lavender flex items-center justify-center flex-shrink-0">
                      <span className="text-violet font-semibold text-lg">{a.companyName[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold text-midnight group-hover:text-violet transition-colors truncate">
                      {a.companyName}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-midnight/50">
                        {a._count.listings} aktiv{a._count.listings !== 1 ? "e" : ""} stilling{a._count.listings !== 1 ? "er" : ""}
                      </span>
                      {a._count.followers > 0 && (
                        <span className="text-xs text-midnight/30">
                          {a._count.followers} følger{a._count.followers !== 1 ? "e" : ""}
                        </span>
                      )}
                      {a.website && (
                        <a
                          href={a.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet hover:text-violet/70 truncate max-w-[140px]"
                        >
                          {a.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
                <FolgKnapp
                  accountId={a.id}
                  companyName={a.companyName}
                  isFollowing={isFollowing}
                  isLoggedIn={!!jobSeeker}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
