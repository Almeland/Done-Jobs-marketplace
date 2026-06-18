"use client";

import { useActionState } from "react";
import { loggInnJobbsoker } from "@/app/actions/jobseeker";

const input = "w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40";
const label = "block text-sm font-medium text-midnight/60 mb-1.5";

export default function LoggInnSkjema() {
  const [state, action, pending] = useActionState(loggInnJobbsoker, null);

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <p className="text-sm text-red-brand bg-red-brand/5 border border-red-brand/20 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}
      <div>
        <label className={label}>E-post</label>
        <input name="email" type="email" required className={input} placeholder="kari@eksempel.no" />
      </div>
      <div>
        <label className={label}>Passord</label>
        <input name="password" type="password" required className={input} placeholder="••••••••" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-midnight text-pearl rounded-full py-3 text-sm font-medium hover:bg-midnight/90 disabled:opacity-40 transition-colors"
      >
        {pending ? "Logger inn…" : "Logg inn"}
      </button>
    </form>
  );
}
