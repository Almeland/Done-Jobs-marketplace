import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getJobSeekerSession } from "@/lib/session";
import Link from "next/link";
import FolgKnapp from "../FolgKnapp";
import { fetchEnhet, fetchRegnskap } from "@/lib/brreg";

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

  const [brregEnhet, brregRegnskap] = account.orgNumber
    ? await Promise.all([fetchEnhet(account.orgNumber), fetchRegnskap(account.orgNumber)])
    : [null, []];

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

      {/* Firmadata fra Brønnøysund */}
      {brregEnhet && (
        <section className="mb-10 border-t border-platinum pt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest">
              Firmadata
            </h2>
            <span className="text-xs text-midnight/25">· Kilde: Brønnøysundregistrene</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {brregEnhet.antallAnsatte != null && (
              <Faktaboks label="Ansatte" value={brregEnhet.antallAnsatte.toLocaleString("nb-NO")} />
            )}
            {brregEnhet.stiftelsesdato && (
              <Faktaboks label="Stiftet" value={brregEnhet.stiftelsesdato.slice(0, 4)} />
            )}
            {brregEnhet.organisasjonsform && (
              <Faktaboks label="Selskapsform" value={brregEnhet.organisasjonsform.beskrivelse} />
            )}
            {brregEnhet.forretningsadresse && (
              <Faktaboks label="Adresse" value={brregEnhet.forretningsadresse.poststed} />
            )}
            {brregEnhet.naeringskode1 && (
              <Faktaboks label="Næring" value={brregEnhet.naeringskode1.beskrivelse} className="col-span-2" />
            )}
          </div>

          {brregRegnskap.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-3">Økonomi</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-platinum">
                      <th className="text-left text-xs text-midnight/40 font-medium pb-2">År</th>
                      <th className="text-right text-xs text-midnight/40 font-medium pb-2">Omsetning</th>
                      <th className="text-right text-xs text-midnight/40 font-medium pb-2">Driftsresultat</th>
                      <th className="text-right text-xs text-midnight/40 font-medium pb-2">Årsresultat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-platinum">
                    {brregRegnskap.map((r) => (
                      <tr key={r.aar}>
                        <td className="py-2.5 text-midnight/70 font-medium">{r.aar}</td>
                        <td className="py-2.5 text-right text-midnight/70">{r.omsetning != null ? formatKr(r.omsetning) : "—"}</td>
                        <td className={`py-2.5 text-right font-medium ${(r.driftsresultat ?? 0) >= 0 ? "text-emerald-brand" : "text-red-brand"}`}>
                          {r.driftsresultat != null ? formatKr(r.driftsresultat) : "—"}
                        </td>
                        <td className={`py-2.5 text-right font-medium ${(r.aarsresultat ?? 0) >= 0 ? "text-emerald-brand" : "text-red-brand"}`}>
                          {r.aarsresultat != null ? formatKr(r.aarsresultat) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="border-t border-platinum mb-10" />

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

function Faktaboks({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`bg-white border border-platinum rounded-xl px-4 py-3 ${className}`}>
      <p className="text-xs text-midnight/40 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-midnight">{value}</p>
    </div>
  );
}

function formatKr(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} mrd`;
  if (abs >= 1_000_000) return `${sign}${Math.round(abs / 1_000_000)} mill`;
  return `${sign}${abs.toLocaleString("nb-NO")} kr`;
}
