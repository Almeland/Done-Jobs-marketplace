import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SokKnapp from "./SokKnapp";
import ViewTracker from "./ViewTracker";
import FolgBedrift from "./FolgBedrift";
import Link from "next/link";
import { formaterLonn } from "@/lib/listing-utils";

export default async function StillingDetaljPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await prisma.jobListing.findUnique({
    where: { id },
    include: { account: true },
  });

  if (!listing || listing.status !== "ACTIVE") notFound();

  const deadline = listing.applicationDeadline
    ? new Date(listing.applicationDeadline)
    : null;
  const logo = listing.logoUrl ?? listing.account.logoUrl;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <ViewTracker listingId={listing.id} />

      <Link
        href="/stillinger"
        className="text-sm text-midnight/40 hover:text-midnight transition-colors mb-8 inline-block"
      >
        ← Alle stillinger
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex-1">
          <p className="text-sm text-midnight/40 mb-2">{listing.account.companyName}</p>
          <h1 className="text-[40px] font-semibold text-midnight leading-tight tracking-tight">
            {listing.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {listing.location && (
              <span className="inline-flex items-center gap-1 text-sm text-midnight/50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
              </span>
            )}
            {listing.industry && (
              <span className="text-xs bg-lavender text-violet px-2.5 py-1 rounded-full font-medium">
                {listing.industry}
              </span>
            )}
            {listing.jobCategory && (
              <span className="text-xs bg-platinum text-midnight/60 px-2.5 py-1 rounded-full">
                {listing.jobCategory}
              </span>
            )}
            {formaterLonn(listing.salaryMin, listing.salaryMax, listing.salaryType) && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-brand bg-emerald-brand/8 px-3 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formaterLonn(listing.salaryMin, listing.salaryMax, listing.salaryType)}
              </span>
            )}
          </div>
          {deadline && (
            <p className="text-[16px] text-midnight/40 mt-3">
              Søknadsfrist:{" "}
              <span className="text-midnight/60">
                {deadline.toLocaleDateString("nb-NO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          )}
        </div>
        {logo && (
          <img
            src={logo}
            alt={listing.account.companyName}
            className="w-20 h-20 object-contain rounded-2xl"
          />
        )}
      </div>

      {/* Søk-knapp */}
      <div className="mb-10">
        <SokKnapp listing={listing} />
      </div>

      {/* Annonsetekst */}
      {listing.body ? (
        <div
          className="prose prose-midnight max-w-none text-[16px] leading-relaxed text-midnight/80"
          dangerouslySetInnerHTML={{ __html: listing.body }}
        />
      ) : (
        <p className="text-midnight/30 italic">Ingen annonsetekst.</p>
      )}

      {/* Følg bedriften */}
      <div className="mt-10 border-t border-platinum pt-8">
        <FolgBedrift accountId={listing.accountId} companyName={listing.account.companyName} />
      </div>

      {/* Kontaktperson */}
      {(listing.contactName || listing.contactEmail) && (
        <div className="mt-12 border-t border-platinum pt-8">
          <p className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-3">
            Kontakt
          </p>
          <p className="text-[16px] font-medium text-midnight">
            {listing.contactName}
            {listing.contactTitle && (
              <span className="text-midnight/40 font-normal"> · {listing.contactTitle}</span>
            )}
          </p>
          {listing.contactEmail && (
            <a
              href={`mailto:${listing.contactEmail}`}
              className="text-sm text-violet hover:text-violet/80"
            >
              {listing.contactEmail}
            </a>
          )}
        </div>
      )}

      {/* Søk-knapp bunn */}
      <div className="mt-12">
        <SokKnapp listing={listing} />
      </div>
    </div>
  );
}
