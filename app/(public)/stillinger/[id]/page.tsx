import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SokKnapp from "./SokKnapp";

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{listing.account.companyName}</p>
          <h1 className="text-3xl font-semibold text-gray-900">{listing.title}</h1>
          {deadline && (
            <p className="text-sm text-gray-400 mt-2">
              Søknadsfrist:{" "}
              <span className="text-gray-600">
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
            className="w-20 h-20 object-contain rounded-lg border border-gray-100"
          />
        )}
      </div>

      {/* Søk-knapp */}
      <div className="mb-8">
        <SokKnapp listing={listing} />
      </div>

      {/* Annonsetekst */}
      {listing.body ? (
        <div
          className="prose prose-gray max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: listing.body }}
        />
      ) : (
        <p className="text-gray-400 italic">Ingen annonsetekst.</p>
      )}

      {/* Kontaktperson */}
      {(listing.contactName || listing.contactEmail) && (
        <div className="mt-10 border-t border-gray-100 pt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Kontakt</h2>
          <p className="text-sm text-gray-700">
            {listing.contactName}
            {listing.contactTitle && (
              <span className="text-gray-400"> · {listing.contactTitle}</span>
            )}
          </p>
          {listing.contactEmail && (
            <a
              href={`mailto:${listing.contactEmail}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {listing.contactEmail}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
