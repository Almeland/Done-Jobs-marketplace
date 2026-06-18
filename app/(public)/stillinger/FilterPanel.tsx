"use client";

import { useRouter } from "next/navigation";
import { INDUSTRIES, JOB_CATEGORIES } from "@/lib/categories";

type Props = {
  bransje: string;
  kategori: string;
  sted: string;
  locations: string[];
};

const select =
  "border border-platinum bg-white rounded-full px-4 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40 cursor-pointer";

export default function FilterPanel({ bransje, kategori, sted, locations }: Props) {
  const router = useRouter();

  function update(key: "bransje" | "kategori" | "sted", value: string) {
    const current = { bransje, kategori, sted, [key]: value };
    const p = new URLSearchParams();
    Object.entries(current).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    router.push(`/stillinger${p.size ? `?${p}` : ""}`);
  }

  const hasFilters = !!(bransje || kategori || sted);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
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

      {hasFilters && (
        <button
          onClick={() => router.push("/stillinger")}
          className="text-sm text-violet hover:text-violet/70 font-medium"
        >
          Nullstill filter
        </button>
      )}
    </div>
  );
}
