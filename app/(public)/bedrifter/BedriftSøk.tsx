"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BedriftSøk({ q }: { q: string }) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (value.trim()) p.set("q", value.trim());
        router.push(`/bedrifter${p.size ? `?${p}` : ""}`);
      }}
      className="flex gap-2 mb-8"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Søk på bedriftsnavn..."
        className="flex-1 border border-platinum bg-white rounded-full px-4 py-2 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
      />
      <button
        type="submit"
        className="bg-violet-drift-btn text-white rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 transition-colors"
      >
        Søk
      </button>
      {q && (
        <button
          type="button"
          onClick={() => { setValue(""); router.push("/bedrifter"); }}
          className="text-sm text-violet hover:text-violet/70 font-medium px-2"
        >
          Nullstill
        </button>
      )}
    </form>
  );
}
