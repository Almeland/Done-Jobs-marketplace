import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SokKnapp from "./SokKnapp";
import ViewTracker from "./ViewTracker";
import FolgBedrift from "./FolgBedrift";
import Link from "next/link";
import { formaterLonn } from "@/lib/listing-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.jobListing.findUnique({
    where: { id },
    select: { title: true, location: true, industry: true, account: { select: { companyName: true } } },
  });
  if (!listing) return {};
  const title = listing.title ?? "Stilling";
  const parts = [listing.account.companyName, listing.location].filter(Boolean).join(" · ");
  return {
    title,
    description: `${title} hos ${listing.account.companyName}${listing.location ? ` i ${listing.location}` : ""}. Søk på Done Jobs.`,
    openGraph: {
      title: `${title} — ${listing.account.companyName}`,
      description: parts,
    },
  };
}

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

      {/* Bedriftskort øverst */}
      <Link
        href={`/bedrifter/${listing.accountId}?fra=${listing.id}`}
        className="group flex items-center gap-4 bg-white border border-platinum rounded-2xl px-5 py-4 mb-8 hover:border-violet/30 hover:shadow-sm transition-all"
      >
        {logo ? (
          <img src={logo} alt={listing.account.companyName} className="w-10 h-10 rounded-xl object-contain flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-lavender flex items-center justify-center flex-shrink-0">
            <span className="text-violet font-bold">{listing.account.companyName[0]}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-midnight group-hover:text-violet transition-colors truncate">
            {listing.account.companyName}
          </p>
          {listing.account.description && (
            <p className="text-xs text-midnight/60 mt-0.5 truncate">{listing.account.description}</p>
          )}
        </div>
        <span className="text-xs text-violet font-medium flex-shrink-0">Se profil →</span>
      </Link>

      {/* Stillingstittel + metadata */}
      <div className="mb-8">
        <h1 className="text-[36px] font-semibold text-midnight leading-tight tracking-tight mb-3">
          {listing.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {listing.location && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-midnight/60">
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
          <p className="text-sm text-midnight/40 mt-3">
            Søknadsfrist:{" "}
            <span className="text-midnight/60">
              {deadline.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </p>
        )}
      </div>

      {/* Søk-knapp topp */}
      <div className="mb-10">
        <SokKnapp listing={listing} />
      </div>

      {/* Annonsetekst */}
      {listing.body ? (
        <div
          className="prose prose-midnight max-w-none text-[16px] leading-relaxed text-midnight/80"
          dangerouslySetInnerHTML={{ __html: listing.body }}
        />
      ) : null}


      {/* Følg bedriften */}
      <div className="mt-10 border-t border-platinum pt-6">
        <FolgBedrift accountId={listing.accountId} companyName={listing.account.companyName} />
      </div>

      {/* Kontaktperson */}
      {(listing.contactName || listing.contactEmail) && (
        <div className="mt-8 border-t border-platinum pt-8">
          <p className="text-xs font-semibold text-midnight/40 uppercase tracking-widest mb-3">Kontakt</p>
          <p className="text-[16px] font-medium text-midnight">
            {listing.contactName}
            {listing.contactTitle && (
              <span className="text-midnight/40 font-normal"> · {listing.contactTitle}</span>
            )}
          </p>
          {listing.contactEmail && (
            <a href={`mailto:${listing.contactEmail}`} className="text-sm text-violet hover:text-violet/80">
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
