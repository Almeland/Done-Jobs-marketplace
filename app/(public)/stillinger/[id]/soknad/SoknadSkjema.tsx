"use client";

import { useActionState } from "react";
import { sendSoknad } from "@/app/actions/soknad";

export default function SoknadSkjema({ listingId }: { listingId: string }) {
  const send = sendSoknad.bind(null, listingId);
  const [state, action, pending] = useActionState(send, null);

  return (
    <form action={action} className="space-y-5" encType="multipart/form-data">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fullt navn <span className="text-red-400">*</span>
        </label>
        <input
          name="applicantName"
          type="text"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Kari Nordmann"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-post <span className="text-red-400">*</span>
        </label>
        <input
          name="applicantEmail"
          type="email"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="kari@eksempel.no"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefon (valgfritt)
        </label>
        <input
          name="applicantPhone"
          type="tel"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+47 900 00 000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Søknadstekst (valgfritt)
        </label>
        <textarea
          name="coverText"
          rows={6}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Fortell om deg selv og hvorfor du passer til stillingen…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CV (valgfritt)
        </label>
        <input
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx"
          className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        <p className="text-xs text-gray-400 mt-1">PDF, Word — maks 10 MB</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Sender søknad…" : "Send søknad"}
      </button>
    </form>
  );
}
