"use client";

import { useActionState } from "react";
import { loggInnAdmin } from "@/app/actions/admin";

export default function AdminLoggInn() {
  const [state, action, pending] = useActionState(loggInnAdmin, null);

  return (
    <div className="min-h-screen bg-pearl flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-midnight mb-8 text-center">Admin</h1>
        <form action={action} className="bg-white border border-platinum rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-midnight/60 mb-1.5">Passord</label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full border border-platinum rounded-xl px-4 py-2.5 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-red-brand">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-midnight text-pearl rounded-full py-2.5 text-sm font-medium hover:bg-midnight/90 disabled:opacity-50 transition-colors"
          >
            {pending ? "Logger inn…" : "Logg inn"}
          </button>
        </form>
      </div>
    </div>
  );
}
