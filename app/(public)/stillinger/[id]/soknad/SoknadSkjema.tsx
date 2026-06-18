"use client";

import { useActionState } from "react";
import { sendSoknad } from "@/app/actions/soknad";

const input = "w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40";
const label = "block text-sm font-medium text-midnight/60 mb-1.5";

export default function SoknadSkjema({ listingId }: { listingId: string }) {
  const send = sendSoknad.bind(null, listingId);
  const [state, action, pending] = useActionState(send, null);

  return (
    <form action={action} className="space-y-5" encType="multipart/form-data">
      {state?.error && (
        <p className="text-sm text-red-brand bg-red-brand/5 border border-red-brand/20 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      <div>
        <label className={label}>Fullt navn <span className="text-red-brand">*</span></label>
        <input name="applicantName" type="text" required className={input} placeholder="Kari Nordmann" />
      </div>

      <div>
        <label className={label}>E-post <span className="text-red-brand">*</span></label>
        <input name="applicantEmail" type="email" required className={input} placeholder="kari@eksempel.no" />
      </div>

      <div>
        <label className={label}>Telefon (valgfritt)</label>
        <input name="applicantPhone" type="tel" className={input} placeholder="+47 900 00 000" />
      </div>

      <div>
        <label className={label}>Søknadstekst (valgfritt)</label>
        <textarea
          name="coverText"
          rows={6}
          className={input + " resize-none"}
          placeholder="Fortell om deg selv og hvorfor du passer til stillingen…"
        />
      </div>

      <div>
        <label className={label}>CV (valgfritt)</label>
        <input
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx"
          className="w-full text-sm text-midnight/50 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-platinum file:text-midnight hover:file:bg-lavender"
        />
        <p className="text-xs text-midnight/30 mt-1">PDF, Word — maks 10 MB</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-midnight text-pearl rounded-full py-3 text-sm font-medium hover:bg-midnight/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "Sender søknad…" : "Send søknad"}
      </button>
    </form>
  );
}
