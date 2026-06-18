import { requireJobSeeker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import UnfollowKnapp from "./UnfollowKnapp";
import SlettVarselKnapp from "./SlettVarselKnapp";
import RedigerVarselKnapp from "./RedigerVarselKnapp";
import { APPLICATION_STATUSES } from "@/app/actions/applications";

export default async function JobbsokerDashboard() {
  const jobSeeker = await requireJobSeeker();

  const [applications, follows, alerts] = await Promise.all([
    prisma.application.findMany({
      where: { jobSeekerId: jobSeeker.id },
      include: { jobListing: { include: { account: true } } },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.companyFollow.findMany({
      where: { jobSeekerId: jobSeeker.id },
      include: { account: { include: { _count: { select: { listings: { where: { status: "ACTIVE" } } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobAlert.findMany({
      where: { jobSeekerId: jobSeeker.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-12">
      <div>
        <h1 className="text-[28px] font-semibold text-midnight tracking-tight">Hei, {jobSeeker.name.split(" ")[0]} 👋</h1>
        <p className="text-midnight/50 text-sm mt-1">{jobSeeker.email}</p>
      </div>

      {/* Søknader */}
      <section>
        <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-4">
          Mine søknader ({applications.length})
        </h2>
        {applications.length === 0 ? (
          <EmptyState
            icon="📄"
            text="Du har ikke søkt på noen stillinger ennå."
            link={{ href: "/stillinger", label: "Se ledige stillinger" }}
          />
        ) : (
          <ul className="divide-y divide-platinum border border-platinum rounded-2xl bg-white">
            {applications.map((a) => {
              const statusInfo = APPLICATION_STATUSES.find((s) => s.value === a.status);
              return (
                <li key={a.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-midnight truncate">{a.jobListing.title}</p>
                    <p className="text-xs text-midnight/50 mt-0.5">{a.jobListing.account.companyName}</p>
                    {statusInfo && (
                      <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-midnight/30 whitespace-nowrap shrink-0 mt-0.5">
                    {new Date(a.submittedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Bedrifter jeg følger */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest">
            Bedrifter jeg følger ({follows.length})
          </h2>
          <Link href="/bedrifter" className="text-sm text-violet hover:text-violet/70 font-medium">
            Finn flere →
          </Link>
        </div>
        {follows.length === 0 ? (
          <EmptyState
            icon="🏢"
            text="Du følger ingen bedrifter ennå."
            link={{ href: "/bedrifter", label: "Utforsk bedrifter" }}
          />
        ) : (
          <ul className="divide-y divide-platinum border border-platinum rounded-2xl bg-white">
            {follows.map((f) => (
              <li key={f.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {f.account.logoUrl && (
                    <img src={f.account.logoUrl} alt={f.account.companyName} className="w-9 h-9 rounded-lg object-contain" />
                  )}
                  <div>
                    <Link href={`/bedrifter/${f.accountId}`} className="text-sm font-medium text-midnight hover:text-violet">
                      {f.account.companyName}
                    </Link>
                    <p className="text-xs text-midnight/40 mt-0.5">
                      {f.account._count.listings} aktiv{f.account._count.listings !== 1 ? "e" : ""} stilling{f.account._count.listings !== 1 ? "er" : ""}
                    </p>
                  </div>
                </div>
                <UnfollowKnapp accountId={f.accountId} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Varsler */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-midnight/40 uppercase tracking-widest">
            Mine varsler ({alerts.length})
          </h2>
          <Link href="/stillinger" className="text-sm text-violet hover:text-violet/70 font-medium">
            Opprett nytt →
          </Link>
        </div>
        {alerts.length === 0 ? (
          <EmptyState
            icon="🔔"
            text='Ingen aktive varsler. Gå til stillingslistene og trykk "Få varsel" for å opprette et.'
            link={{ href: "/stillinger", label: "Se stillinger" }}
          />
        ) : (
          <ul className="divide-y divide-platinum border border-platinum rounded-2xl bg-white">
            {alerts.map((a) => (
              <li key={a.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-midnight">{a.name ?? "Alle nye stillinger"}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {a.bransje && <Tag>{a.bransje}</Tag>}
                    {a.kategori && <Tag>{a.kategori}</Tag>}
                    {a.sted && <Tag>📍 {a.sted}</Tag>}
                    {!a.bransje && !a.kategori && !a.sted && <Tag>Alle bransjer og steder</Tag>}
                  </div>
                  {a.lastSentAt && (
                    <p className="text-xs text-midnight/30 mt-1.5">
                      Sist sendt {new Date(a.lastSentAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RedigerVarselKnapp alert={a} />
                  <SlettVarselKnapp alertId={a.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-lavender text-violet px-2 py-0.5 rounded-full">{children}</span>
  );
}

function EmptyState({
  icon,
  text,
  link,
}: {
  icon: string;
  text: string;
  link: { href: string; label: string };
}) {
  return (
    <div className="border border-platinum rounded-2xl bg-white px-6 py-10 text-center">
      <p className="text-3xl mb-3">{icon}</p>
      <p className="text-sm text-midnight/50 mb-4">{text}</p>
      <Link
        href={link.href}
        className="inline-block text-sm text-violet hover:text-violet/70 font-medium"
      >
        {link.label} →
      </Link>
    </div>
  );
}
