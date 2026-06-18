"use client";

import { useActionState } from "react";
import { registrer } from "@/app/actions/auth";
import Link from "next/link";

export default function RegistrerSkjema() {
  const [state, action, pending] = useActionState(registrer, null);

  return (
    <form action={action} className="space-y-5" encType="multipart/form-data">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bedriftsnavn
        </label>
        <input
          name="companyName"
          type="text"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Acme AS"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bedriftslogo (valgfritt)
        </label>
        <input
          name="logo"
          type="file"
          accept="image/*"
          className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ditt navn
        </label>
        <input
          name="name"
          type="text"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Kari Nordmann"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-post
        </label>
        <input
          name="email"
          type="email"
          required
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
          minLength={8}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Minst 8 tegn"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Oppretter konto…" : "Opprett konto"}
      </button>

      <p className="text-sm text-gray-500 text-center">
        Har du allerede konto?{" "}
        <Link href="/logg-inn" className="text-blue-600 hover:underline">
          Logg inn
        </Link>
      </p>
    </form>
  );
}
