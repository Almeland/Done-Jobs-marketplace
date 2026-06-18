import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getJobSeekerSession } from "@/lib/session";
import Link from "next/link";
import FolgKnapp from "../FolgKnapp";
import { CULTURE_TAGS } from "@/lib/culture-options";

export default async function BedriftProfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobSeeker = await getJobSeekerSession();

  const [account, isFollowing] = await Promise.all([
    prisma.account.findUnique({
      where: { id },
      include: {
        listings: {
          where: { status: "ACTIVE" },
          orderBy: { publishedAt: "desc" },
        },
        _count: { select: { followers: true } },
      },
    }),
    jobSeeker
      ? prisma.companyFollow.findUnique({
          where: { email_accountId: { email: jobSeeker.email, accountId: id } },
          select: { id: true },
        }).then(Boolean)
      : Promise.resolve(false),
  ]);

  if (!account) notFound();

  const locations = [...new Set(account.listings.map((l) => l.location).filter(Boolean))];
  const industries = [...new Set(account.listings.map((l) => l.industry).filter(Boolean))];

  const cultureValues: string[] = (() => {
    try { return JSON.parse(account.cultureValues ?? "[]"); } catch { return []; }
  })();
  const benefits: string[] = (() => {
    try { return JSON.parse(account.benefits ?? "[]"); } catch { return []; }
  })();

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/bedrifter" className="text-sm text-midnight/50 hover:text-midnight mb-8 inline-block">
        ← Alle bedrifter
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          {account.logoUrl ? (
            <img src={account.logoUrl} alt={account.companyName} className="w-16 h-16 rounded-2xl object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-lavender flex items-center justify-center flex-shrink-0">
              <span className="text-violet font-bold text-2xl">{account.companyName[0]}</span>
            </div>
          )}
          <div>
            <h1 className="text-[28px] font-semibold text-midnight tracking-tight">{account.companyName}</h1>
            {account.tagline && (
              <p className="text-[15px] text-midnight/60 mt-1 italic">{account.tagline}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {industries.map((i) => (
                <span key={i} className="text-xs bg-lavender text-violet px-2.5 py-1 rounded-full">{i}</span>
              ))}
              {locations.map((l) => (
                <span key={l} className="text-xs bg-platinum text-midnight/60 px-2.5 py-1 rounded-full">📍 {l}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-midnight/40 flex-wrap">
              <span>{account._count.followers} følger{account._count.followers !== 1 ? "e" : ""}</span>
              {account.employeeCount && <span>👥 {account.employeeCount} ansatte</span>}
              {account.foundedYear && <span>📅 Est. {account.foundedYear}</span>}
              {account.website && (
                <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-violet hover:text-violet/70">
                  {account.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        </div>
        <FolgKnapp
          accountId={account.id}
          companyName={account.companyName}
          isFollowing={isFollowing}
          isLoggedIn={!!jobSeeker}
        />
      </div>

      {account.description && (
        <p className="text-[16px] text-midnight/70 leading-relaxed mb-10">
          {account.description}
        </p>
      )}

      {/* Kulturverdier */}
      {cultureValues.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-3">
            Kultur og verdier
          </h2>
          <div className="flex flex-wrap gap-2">
            {cultureValues.map((tag) => (
              <span
                key={tag}
                className="text-sm bg-lavender text-violet px-3.5 py-1.5 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Goder */}
      {benefits.length > 0 && (
        <section className="mb-10 border-t border-platinum pt-8">
          <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-4">
            Goder og fordeler
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {benefits.map((perk) => (
              <div
                key={perk}
                className="flex items-center gap-2 bg-white border border-platinum rounded-xl px-4 py-3"
              >
                <span className="text-emerald-brand text-base">✓</span>
                <span className="text-sm text-midnight/70">{perk}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(account.description || cultureValues.length > 0 || benefits.length > 0) && (
        <div className="border-t border-platinum mb-10" />
      )}

      {/* Aktive stillinger */}
      <section>
        <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-4">
          Aktive stillinger ({account.listings.length})
        </h2>
        {account.listings.length === 0 ? (
          <p className="text-sm text-midnight/40 italic">Ingen aktive stillinger for øyeblikket.</p>
        ) : (
          <ul className="space-y-3">
            {account.listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/stillinger/${l.id}`}
                  className="group flex items-center justify-between gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <h3 className="text-[15px] font-semibold text-midnight group-hover:text-violet transition-colors">
                      {l.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {l.location && <span className="text-xs text-midnight/40">📍 {l.location}</span>}
                      {l.jobCategory && <span className="text-xs bg-platinum text-midnight/50 px-2 py-0.5 rounded-full">{l.jobCategory}</span>}
                    </div>
                  </div>
                  {l.applicationDeadline && (
                    <p className="text-xs text-midnight/30 whitespace-nowrap">
                      Frist {new Date(l.applicationDeadline).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
