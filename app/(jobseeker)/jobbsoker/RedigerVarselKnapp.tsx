"use client";

import { useActionState, useState } from "react";
import { updateJobAlert } from "@/app/actions/jobseeker";
import { INDUSTRIES, JOB_CATEGORIES } from "@/lib/categories";
import type { JobAlertModel as JobAlert } from "@/app/generated/prisma/models/JobAlert";

const sel = "border border-platinum bg-white rounded-xl px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40";

export default function RedigerVarselKnapp({ alert }: { alert: JobAlert }) {
  const [open, setOpen] = useState(false);
  const update = updateJobAlert.bind(null, alert.id);
  const [state, action, pending] = useActionState(update, null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-violet hover:text-violet/70 font-medium">
        Rediger
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        if (!state?.error) setOpen(false);
      }}
      className="w-full mt-3 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select name="bransje" defaultValue={alert.bransje ?? ""} className={sel}>
          <option value="">Alle bransjer</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select name="kategori" defaultValue={alert.kategori ?? ""} className={sel}>
          <option value="">Alle kategorier</option>
          {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          name="sted"
          type="text"
          defaultValue={alert.sted ?? ""}
          placeholder="Alle steder"
          className="border border-platinum bg-white rounded-xl px-3 py-2 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
        />
      </div>
      {state?.error && <p className="text-xs text-red-brand">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-midnight text-pearl rounded-full px-4 py-1.5 text-xs font-medium hover:bg-midnight/90 disabled:opacity-50 transition-colors">
          {pending ? "Lagrer…" : "Lagre"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-midnight/50 hover:text-midnight px-2">
          Avbryt
        </button>
      </div>
    </form>
  );
}
