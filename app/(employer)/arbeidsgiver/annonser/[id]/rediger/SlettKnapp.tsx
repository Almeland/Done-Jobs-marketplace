"use client";

import { useActionState, useState } from "react";
import { slettUtkast } from "@/app/actions/listings";

export default function SlettKnapp({ listingId }: { listingId: string }) {
  const slett = slettUtkast.bind(null, listingId);
  const [, action, pending] = useActionState(slett, null);
  const [bekreftet, setBekreftet] = useState(false);

  if (!bekreftet) {
    return (
      <button
        type="button"
        onClick={() => setBekreftet(true)}
        className="text-sm text-red-500 hover:text-red-700"
      >
        Slett utkast
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Er du sikker?</span>
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        Ja, slett
      </button>
      <button
        type="button"
        onClick={() => setBekreftet(false)}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Avbryt
      </button>
    </form>
  );
}
