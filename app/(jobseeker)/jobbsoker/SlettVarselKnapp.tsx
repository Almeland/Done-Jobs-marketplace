"use client";

import { useTransition } from "react";
import { deleteJobAlert } from "@/app/actions/alerts";

export default function SlettVarselKnapp({ alertId }: { alertId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await deleteJobAlert(alertId); })}
      className="text-xs text-midnight/40 hover:text-red-brand disabled:opacity-40 transition-colors whitespace-nowrap"
    >
      {pending ? "…" : "Slett"}
    </button>
  );
}
