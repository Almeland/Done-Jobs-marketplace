"use client";

import { loggUt } from "@/app/actions/auth";

export default function LoggUtKnapp() {
  return (
    <form action={loggUt}>
      <button
        type="submit"
        className="text-gray-600 hover:text-gray-900 text-sm"
      >
        Logg ut
      </button>
    </form>
  );
}
