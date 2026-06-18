"use client";

import { useActionState } from "react";
import { subscribeJobAlert } from "@/app/actions/alerts";

type Props = { bransje: string; kategori: string; sted: string };

function describe(bransje: string, kategori: string, sted: string): string {
  const parts: string[] = [];
  if (bransje) parts.push(bransje);
  if (kategori) parts.push(kategori);
  if (sted) parts.push(sted);
  return parts.length ? parts.join(" · ") : "alle nye stillinger";
}

export default function JobAlertForm({ bransje, kategori, sted }: Props) {
  const [state, action, pending] = useActionState(subscribeJobAlert, null);

  if (state && "ok" in state) {
    return (
      <div className="bg-lavender border border-violet/20 rounded-2xl px-5 py-4 flex items-center gap-3">
        <span className="text-violet text-lg">✓</span>
        <p className="text-sm text-midnight">
          Du vil få varsel på e-post når nye stillinger matches ditt søk.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-lavender border border-violet/20 rounded-2xl px-5 py-4">
      <p className="text-sm font-medium text-midnight mb-1">
        Få varsel om{" "}
        <span className="text-violet">{describe(bransje, kategori, sted)}</span>
      </p>
      <form action={action} className="flex gap-2 mt-2">
        <input type="hidden" name="bransje" value={bransje} />
        <input type="hidden" name="kategori" value={kategori} />
        <input type="hidden" name="sted" value={sted} />
        <input
          name="email"
          type="email"
          required
          placeholder="din@epost.no"
          className="flex-1 border border-violet/30 bg-white rounded-full px-4 py-2 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-violet text-pearl rounded-full px-5 py-2 text-sm font-medium hover:bg-violet/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {pending ? "Abonnerer…" : "Få varsel"}
        </button>
      </form>
      {state?.error && (
        <p className="text-xs text-red-brand mt-2">{state.error}</p>
      )}
      <p className="text-xs text-midnight/40 mt-2">
        Du kan avslutte varselet når som helst via lenken i e-posten.
      </p>
    </div>
  );
}
