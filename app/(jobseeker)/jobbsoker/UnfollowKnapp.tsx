"use client";

import { useTransition } from "react";
import { unfollowCompanyAsSeeker } from "@/app/actions/alerts";

export default function UnfollowKnapp({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await unfollowCompanyAsSeeker(accountId); })}
      className="text-xs text-midnight/40 hover:text-red-brand disabled:opacity-40 transition-colors whitespace-nowrap"
    >
      {pending ? "…" : "Slutt å følge"}
    </button>
  );
}
