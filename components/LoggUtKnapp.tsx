"use client";

import { loggUt } from "@/app/actions/auth";

export default function LoggUtKnapp() {
  return (
    <form action={loggUt}>
      <button
        type="submit"
        className="text-sm text-midnight/50 hover:text-midnight transition-colors"
      >
        Logg ut
      </button>
    </form>
  );
}
