"use client";

import { useActionState, useCallback } from "react";
import { lagreAnnonse } from "@/app/actions/listings";
import type { JobListingModel as JobListing } from "@/app/generated/prisma/models/JobListing";
import Link from "next/link";

type Props = { listing: JobListing };

export default function RedigerSkjema({ listing }: Props) {
  const lagre = lagreAnnonse.bind(null, listing.id);
  const [state, action, pending] = useActionState(lagre, null);

  const deadline = listing.applicationDeadline
    ? new Date(listing.applicationDeadline).toISOString().split("T")[0]
    : "";

  return (
    <form action={action} className="space-y-8" noValidate>
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Tittel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stillingstittel
        </label>
        <input
          name="title"
          type="text"
          defaultValue={listing.title ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="f.eks. Frontendutvikler"
        />
      </div>

      {/* Annonsetekst */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Annonsetekst
        </label>
        <textarea
          name="body"
          rows={12}
          defaultValue={listing.body ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="Beskriv stillingen, arbeidsoppgaver, kvalifikasjoner…"
        />
        <p className="text-xs text-gray-400 mt-1">Støtter HTML-formatering.</p>
      </div>

      {/* Kontaktperson */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="text-sm font-medium text-gray-700 px-1">
          Kontaktperson
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Navn</label>
            <input
              name="contactName"
              type="text"
              defaultValue={listing.contactName ?? ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tittel</label>
            <input
              name="contactTitle"
              type="text"
              defaultValue={listing.contactTitle ?? ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">E-post</label>
            <input
              name="contactEmail"
              type="email"
              defaultValue={listing.contactEmail ?? ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Søknadsfrist */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Søknadsfrist
        </label>
        <input
          name="applicationDeadline"
          type="date"
          defaultValue={deadline}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Søknadsmottak (US-03) */}
      <SoknadsMottak listing={listing} />

      {/* Handlinger */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Link
          href="/arbeidsgiver"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tilbake
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Lagrer…" : "Lagre utkast"}
        </button>
      </div>
    </form>
  );
}

function SoknadsMottak({ listing }: Props) {
  return (
    <fieldset className="border border-gray-200 rounded-lg p-4">
      <legend className="text-sm font-medium text-gray-700 px-1">
        Søknadsmottak
      </legend>
      <div className="mt-3 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="receiptMethod"
            value="EMAIL"
            defaultChecked={listing.receiptMethod === "EMAIL" || !listing.receiptMethod}
            className="mt-0.5"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">
              Motta søknader på e-post
            </span>
            <input
              name="receiptEmail"
              type="email"
              defaultValue={listing.receiptEmail ?? ""}
              className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="soknad@bedrift.no"
            />
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="receiptMethod"
            value="EXTERNAL_URL"
            defaultChecked={listing.receiptMethod === "EXTERNAL_URL"}
            className="mt-0.5"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">
              Ekstern søknadslenke
            </span>
            <input
              name="receiptUrl"
              type="url"
              defaultValue={listing.receiptUrl ?? ""}
              className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://soknad.bedrift.no/stilling"
            />
          </div>
        </label>
      </div>
    </fieldset>
  );
}
