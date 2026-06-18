"use client";

import { useActionState, useState } from "react";
import { followCompany } from "@/app/actions/alerts";

type Props = { accountId: string; companyName: string };

export default function FolgBedrift({ accountId, companyName }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(followCompany, null);

  if (state && "ok" in state) {
    return (
      <p className="text-sm text-emerald-brand font-medium">
        ✓ Du følger {companyName} og vil få varsel ved nye stillinger.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-violet hover:text-violet/70 font-medium"
      >
        + Følg {companyName}
      </button>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="accountId" value={accountId} />
      <p className="text-xs text-midnight/50">
        Få e-post når {companyName} publiserer nye stillinger. Bedriften kan se at du følger dem.
      </p>
      <div className="flex gap-2">
        <input
          name="followerName"
          type="text"
          placeholder="Ditt navn (valgfritt)"
          className="flex-1 border border-platinum bg-white rounded-full px-4 py-2 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="din@epost.no"
          className="flex-1 border border-platinum bg-white rounded-full px-4 py-2 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-midnight text-pearl rounded-full px-4 py-2 text-sm font-medium hover:bg-midnight/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {pending ? "…" : "Følg"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-midnight/40 hover:text-midnight px-2"
        >
          Avbryt
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-red-brand">{state.error}</p>
      )}
    </form>
  );
}
