"use client";

import { useActionState } from "react";
import { registrer } from "@/app/actions/auth";
import Link from "next/link";

const input = "w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40";
const label = "block text-sm font-medium text-midnight/60 mb-1.5";

export default function RegistrerSkjema() {
  const [state, action, pending] = useActionState(registrer, null);

  return (
    <form action={action} className="space-y-5" encType="multipart/form-data">
      {state?.error && (
        <p className="text-sm text-red-brand bg-red-brand/5 border border-red-brand/20 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      <div>
        <label className={label}>Bedriftsnavn</label>
        <input name="companyName" type="text" required className={input} placeholder="Acme AS" />
      </div>

      <div>
        <label className={label}>Bedriftslogo (valgfritt)</label>
        <input
          name="logo"
          type="file"
          accept="image/*"
          className="w-full text-sm text-midnight/50 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-platinum file:text-midnight hover:file:bg-lavender"
        />
      </div>

      <div>
        <label className={label}>Ditt navn</label>
        <input name="name" type="text" required className={input} placeholder="Kari Nordmann" />
      </div>

      <div>
        <label className={label}>E-post</label>
        <input name="email" type="email" required className={input} placeholder="kari@bedrift.no" />
      </div>

      <div>
        <label className={label}>Passord</label>
        <input name="password" type="password" required minLength={8} className={input} placeholder="Minst 8 tegn" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-midnight text-pearl rounded-full py-3 text-sm font-medium hover:bg-midnight/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "Oppretter konto…" : "Opprett konto"}
      </button>

      <p className="text-sm text-midnight/40 text-center">
        Har du allerede konto?{" "}
        <Link href="/logg-inn" className="text-violet hover:text-violet/80 font-medium">
          Logg inn
        </Link>
      </p>
    </form>
  );
}
