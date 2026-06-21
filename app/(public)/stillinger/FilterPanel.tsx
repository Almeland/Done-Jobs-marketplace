"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { INDUSTRIES, JOB_CATEGORIES } from "@/lib/categories";

const SALARY_OPTIONS = [
  { label: "Under 500 000 kr/år", value: "u500" },
  { label: "500 000 – 700 000 kr/år", value: "500-700" },
  { label: "700 000 – 900 000 kr/år", value: "700-900" },
  { label: "Over 900 000 kr/år", value: "o900" },
];

type Props = {
  bransje: string;
  kategori: string;
  sted: string;
  lonn: string;
  q: string;
  locations: string[];
};

const select =
  "border border-platinum bg-white rounded-full px-4 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40 cursor-pointer";

export default function FilterPanel({ bransje, kategori, sted, lonn, q, locations }: Props) {
  const router = useRouter();
  const [søk, setSøk] = useState(q);

  function update(key: "bransje" | "kategori" | "sted" | "lonn" | "q", value: string) {
    const current = { bransje, kategori, sted, lonn, q, [key]: value };
    const p = new URLSearchParams();
    Object.entries(current).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    router.push(`/stillinger${p.size ? `?${p}` : ""}`);
  }

  const hasFilters = !!(bransje || kategori || sted || lonn || q);

  return (
    <div className="space-y-3 mb-8">
      <form
        onSubmit={(e) => { e.preventDefault(); update("q", søk); }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={søk}
          onChange={(e) => setSøk(e.target.value)}
          placeholder="Søk på stilling, bedrift eller sted..."
          className="flex-1 border border-platinum bg-white rounded-full px-4 py-2 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
        />
        <button
          type="submit"
          className="bg-violet text-pearl rounded-full px-5 py-2 text-sm font-medium hover:bg-violet/90 transition-colors"
        >
          Søk
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-3">
      <select
        value={bransje}
        onChange={(e) => update("bransje", e.target.value)}
        className={select}
      >
        <option value="">Alle bransjer</option>
        {INDUSTRIES.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>

      <select
        value={kategori}
        onChange={(e) => update("kategori", e.target.value)}
        className={select}
      >
        <option value="">Alle kategorier</option>
        {JOB_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {locations.length > 0 && (
        <select
          value={sted}
          onChange={(e) => update("sted", e.target.value)}
          className={select}
        >
          <option value="">Alle steder</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      )}

      <select
        value={lonn}
        onChange={(e) => update("lonn", e.target.value)}
        className={select}
      >
        <option value="">Alle lønnsnivåer</option>
        {SALARY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

        {hasFilters && (
          <button
            onClick={() => { setSøk(""); router.push("/stillinger"); }}
            className="text-sm text-violet hover:text-violet/70 font-medium"
          >
            Nullstill filter
          </button>
        )}
      </div>
    </div>
  );
}
