"use client";

import { useTransition } from "react";
import { registrerSoknadsKlikk } from "@/app/actions/tracking";
import type { JobListingModel as JobListing } from "@/app/generated/prisma/models/JobListing";

type Props = { listing: JobListing };

export default function SokKnapp({ listing }: Props) {
  const [, startTransition] = useTransition();

  function handleKlikk() {
    startTransition(() => {
      registrerSoknadsKlikk(listing.id);
    });
  }

  if (listing.receiptMethod === "EXTERNAL_URL" && listing.receiptUrl) {
    return (
      <a
        href={listing.receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleKlikk}
        className="inline-block bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700"
      >
        Søk på stilling →
      </a>
    );
  }

  return (
    <a
      href={`/stillinger/${listing.id}/soknad`}
      onClick={handleKlikk}
      className="inline-block bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700"
    >
      Søk på stilling →
    </a>
  );
}
