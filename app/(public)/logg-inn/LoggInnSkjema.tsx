"use client";

import { useActionState } from "react";
import { loggInn } from "@/app/actions/auth";
import Link from "next/link";

export default function LoggInnSkjema() {
  const [state, action, pending] = useActionState(loggInn, null);

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-post
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="kari@bedrift.no"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Passord
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Logger inn…" : "Logg inn"}
      </button>

      <p className="text-sm text-gray-500 text-center">
        Ny bruker?{" "}
        <Link href="/registrer" className="text-blue-600 hover:underline">
          Registrer bedrift
        </Link>
      </p>
    </form>
  );
}
