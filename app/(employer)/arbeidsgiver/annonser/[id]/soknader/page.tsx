import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusVelger from "./StatusVelger";
import { APPLICATION_STATUSES } from "@/lib/application-statuses";

export default async function SoknaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const listing = await prisma.jobListing.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!listing || listing.accountId !== user.accountId) notFound();

  const statusCounts = APPLICATION_STATUSES.map((s) => ({
    ...s,
    count: listing.applications.filter((a) => a.status === s.value).length,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/arbeidsgiver"
        className="text-sm text-midnight/40 hover:text-midnight mb-6 inline-block"
      >
        ← Tilbake til annonser
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-midnight tracking-tight">
            Søknader
          </h1>
          <p className="text-midnight/50 text-sm mt-1">{listing.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {statusCounts.filter((s) => s.count > 0).map((s) => (
            <span key={s.value} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
              {s.count} {s.label.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {listing.applications.length === 0 ? (
        <div className="border border-platinum rounded-2xl bg-white px-6 py-12 text-center">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-sm text-midnight/50">Ingen søknader ennå.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {listing.applications.map((a) => {
            const statusInfo = APPLICATION_STATUSES.find((s) => s.value === a.status);
            return (
              <li key={a.id} className="border border-platinum rounded-2xl bg-white overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 flex items-start justify-between gap-4 border-b border-platinum">
                  <div>
                    <p className="text-[15px] font-semibold text-midnight">{a.applicantName}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <a
                        href={`mailto:${a.applicantEmail}`}
                        className="text-sm text-violet hover:text-violet/80"
                      >
                        {a.applicantEmail}
                      </a>
                      {a.applicantPhone && (
                        <span className="text-sm text-midnight/50">{a.applicantPhone}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-midnight/30">
                      {new Date(a.submittedAt).toLocaleDateString("nb-NO", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {statusInfo && (
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Søknadstekst */}
                {a.coverText && (
                  <div className="px-6 py-4 border-b border-platinum">
                    <p className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-2">
                      Søknadstekst
                    </p>
                    <p className="text-sm text-midnight/70 whitespace-pre-wrap leading-relaxed">
                      {a.coverText}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="px-6 py-4 bg-pearl">
                  <p className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-3">
                    Oppdater status
                  </p>
                  <StatusVelger
                    applicationId={a.id}
                    currentStatus={a.status}
                    currentNote={a.statusNote}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
