"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { lagreAnnonse } from "@/app/actions/listings";
import type { JobListingModel as JobListing } from "@/app/generated/prisma/models/JobListing";
import Link from "next/link";
import { INDUSTRIES, JOB_CATEGORIES } from "@/lib/categories";

type Props = { listing: JobListing };

export default function RedigerSkjema({ listing }: Props) {
  const lagre = lagreAnnonse.bind(null, listing.id);
  const [state, action, pending] = useActionState(lagre, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleAutosave() {
    if (listing.status !== "DRAFT") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 1500);
  }

  useEffect(() => {
    if (!pending && state === null) {
      setSavedAt(new Date());
    }
  }, [pending, state]);

  const deadline = listing.applicationDeadline
    ? new Date(listing.applicationDeadline).toISOString().split("T")[0]
    : "";

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-8"
      noValidate
      onChange={scheduleAutosave}
    >
      {state?.error && (
        <p className="text-sm text-red-brand bg-red-brand/5 border border-red-brand/20 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      {/* Tittel */}
      <div>
        <label className="block text-sm font-medium text-midnight/60 mb-1.5">
          Stillingstittel
        </label>
        <input
          name="title"
          type="text"
          defaultValue={listing.title ?? ""}
          className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
          placeholder="f.eks. Frontendutvikler"
        />
      </div>

      {/* Sted, bransje og kategori */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-medium text-midnight/60 mb-1.5">
            Sted
          </label>
          <input
            name="location"
            type="text"
            defaultValue={listing.location ?? ""}
            className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
            placeholder="f.eks. Oslo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-midnight/60 mb-1.5">
            Bransje
          </label>
          <select
            name="industry"
            defaultValue={listing.industry ?? ""}
            className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40"
          >
            <option value="">Velg bransje</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-midnight/60 mb-1.5">
            Stillingskategori
          </label>
          <select
            name="jobCategory"
            defaultValue={listing.jobCategory ?? ""}
            className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40"
          >
            <option value="">Velg kategori</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Annonsetekst */}
      <div>
        <label className="block text-sm font-medium text-midnight/60 mb-1.5">
          Annonsetekst
        </label>
        <textarea
          name="body"
          rows={12}
          defaultValue={listing.body ?? ""}
          className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40 font-mono"
          placeholder="Beskriv stillingen, arbeidsoppgaver, kvalifikasjoner…"
        />
        <p className="text-xs text-midnight/30 mt-1">Støtter HTML-formatering.</p>
      </div>

      {/* Kontaktperson */}
      <fieldset className="border border-platinum rounded-2xl p-5">
        <legend className="text-sm font-medium text-midnight/60 px-1">
          Kontaktperson
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div>
            <label className="block text-xs text-midnight/50 mb-1">Navn</label>
            <input
              name="contactName"
              type="text"
              defaultValue={listing.contactName ?? ""}
              className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
            />
          </div>
          <div>
            <label className="block text-xs text-midnight/50 mb-1">Tittel</label>
            <input
              name="contactTitle"
              type="text"
              defaultValue={listing.contactTitle ?? ""}
              className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
            />
          </div>
          <div>
            <label className="block text-xs text-midnight/50 mb-1">E-post</label>
            <input
              name="contactEmail"
              type="email"
              defaultValue={listing.contactEmail ?? ""}
              className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
            />
          </div>
        </div>
      </fieldset>

      {/* Søknadsfrist */}
      <div>
        <label className="block text-sm font-medium text-midnight/60 mb-1.5">
          Søknadsfrist
        </label>
        <input
          name="applicationDeadline"
          type="date"
          defaultValue={deadline}
          className="border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40"
        />
      </div>

      {/* Søknadsmottak */}
      <SoknadsMottak listing={listing} />

      {/* Handlinger */}
      <div className="flex items-center justify-between pt-4 border-t border-platinum">
        <Link
          href="/arbeidsgiver"
          className="text-sm text-midnight/50 hover:text-midnight"
        >
          ← Tilbake
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && !pending && !state?.error && (
            <span className="text-xs text-midnight/30">
              Lagret {savedAt.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {pending && (
            <span className="text-xs text-midnight/30">Lagrer…</span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-midnight text-pearl rounded-full px-5 py-2.5 text-sm font-medium hover:bg-midnight/90 disabled:opacity-50 transition-colors"
          >
            {pending ? "Lagrer…" : "Lagre"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SoknadsMottak({ listing }: Props) {
  return (
    <fieldset className="border border-platinum rounded-2xl p-5">
      <legend className="text-sm font-medium text-midnight/60 px-1">
        Søknadsmottak
      </legend>
      <div className="mt-3 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="receiptMethod"
            value="EMAIL"
            defaultChecked={listing.receiptMethod === "EMAIL" || !listing.receiptMethod}
            className="mt-0.5 accent-violet"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-midnight">
              Motta søknader på e-post
            </span>
            <input
              name="receiptEmail"
              type="email"
              defaultValue={listing.receiptEmail ?? ""}
              className="mt-2 w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
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
            className="mt-0.5 accent-violet"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-midnight">
              Ekstern søknadslenke
            </span>
            <input
              name="receiptUrl"
              type="url"
              defaultValue={listing.receiptUrl ?? ""}
              className="mt-2 w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
              placeholder="https://soknad.bedrift.no/stilling"
            />
          </div>
        </label>
      </div>
    </fieldset>
  );
}
