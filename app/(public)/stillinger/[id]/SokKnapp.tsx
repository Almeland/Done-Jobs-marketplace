"use client";

import type { JobListingModel as JobListing } from "@/app/generated/prisma/models/JobListing";

type Props = { listing: JobListing };

export default function SokKnapp({ listing }: Props) {
  if (listing.receiptMethod === "EXTERNAL_URL" && listing.receiptUrl) {
    return (
      <a
        href={listing.receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700"
      >
        Søk på stilling →
      </a>
    );
  }

  return (
    <a
      href={`/stillinger/${listing.id}/soknad`}
      className="inline-block bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700"
    >
      Søk på stilling →
    </a>
  );
}
