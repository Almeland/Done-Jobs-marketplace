"use client";

import { useActionState, useState } from "react";
import { adminSlettAnnonse } from "@/app/actions/listings";

export default function AdminSlettKnapp({ listingId }: { listingId: string }) {
  const slett = adminSlettAnnonse.bind(null, listingId);
  const [state, action, pending] = useActionState(slett, null);
  const [bekreftet, setBekreftet] = useState(false);

  if (!bekreftet) {
    return (
      <button
        type="button"
        onClick={() => setBekreftet(true)}
        className="text-sm text-red-500 hover:text-red-700 font-medium"
      >
        Slett annonse
      </button>
    );
  }

  return (
    <form action={action} className="space-y-2">
      {state?.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <p className="text-xs text-gray-500">
        Dette sletter annonsen og alle søknader permanent.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded-md"
        >
          {pending ? "Sletter…" : "Ja, slett permanent"}
        </button>
        <button
          type="button"
          onClick={() => setBekreftet(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
