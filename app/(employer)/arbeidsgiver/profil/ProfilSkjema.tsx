"use client";

import { useActionState } from "react";
import { lagreProfil } from "@/app/actions/account";
import { CULTURE_TAGS, BENEFIT_OPTIONS, EMPLOYEE_COUNT_OPTIONS } from "@/lib/culture-options";
import { useState } from "react";

type Account = {
  tagline: string | null;
  description: string | null;
  website: string | null;
  employeeCount: string | null;
  foundedYear: number | null;
  cultureValues: string | null;
  benefits: string | null;
};

export default function ProfilSkjema({ account }: { account: Account }) {
  const [state, action, pending] = useActionState(lagreProfil, null);

  const initialCulture: string[] = (() => {
    try { return JSON.parse(account.cultureValues ?? "[]"); } catch { return []; }
  })();
  const initialBenefits: string[] = (() => {
    try { return JSON.parse(account.benefits ?? "[]"); } catch { return []; }
  })();

  const [culture, setCulture] = useState<string[]>(initialCulture);
  const [perks, setPerks] = useState<string[]>(initialBenefits);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <form action={action} className="space-y-8">
      {state?.error && (
        <p className="text-sm text-red-brand bg-red-brand/5 border border-red-brand/20 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      {/* Tagline */}
      <div>
        <label className="block text-sm font-medium text-midnight/60 mb-1.5">
          Tagline
          <span className="text-midnight/30 font-normal"> — kort og fengende beskrivelse</span>
        </label>
        <input
          name="tagline"
          type="text"
          maxLength={120}
          defaultValue={account.tagline ?? ""}
          className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
          placeholder='f.eks. "Vi bygger programvare som gjør hverdagen enklere"'
        />
      </div>

      {/* Beskrivelse */}
      <div>
        <label className="block text-sm font-medium text-midnight/60 mb-1.5">
          Om bedriften
        </label>
        <textarea
          name="description"
          rows={5}
          defaultValue={account.description ?? ""}
          className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
          placeholder="Fortell potensielle søkere hvem dere er, hva dere gjør og hva som gjør dere unike…"
        />
      </div>

      {/* Nettside + Etablert + Ansatte */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-midnight/60 mb-1.5">Nettside</label>
          <input
            name="website"
            type="url"
            defaultValue={account.website ?? ""}
            className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
            placeholder="https://dinbedrift.no"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-midnight/60 mb-1.5">Etablert år</label>
          <input
            name="foundedYear"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            defaultValue={account.foundedYear ?? ""}
            className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40"
            placeholder="f.eks. 2018"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-midnight/60 mb-1.5">Antall ansatte</label>
          <select
            name="employeeCount"
            defaultValue={account.employeeCount ?? ""}
            className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40"
          >
            <option value="">Velg størrelse</option>
            {EMPLOYEE_COUNT_OPTIONS.map((o) => (
              <option key={o} value={o}>{o} ansatte</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kultur-tagger */}
      <div>
        <label className="block text-sm font-medium text-midnight/60 mb-3">
          Kulturverdier
          <span className="text-midnight/30 font-normal"> — velg alt som passer</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CULTURE_TAGS.map((tag) => {
            const active = culture.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(culture, setCulture, tag)}
                className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-violet text-pearl border-violet"
                    : "bg-white text-midnight/60 border-platinum hover:border-violet/40"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {/* Hidden inputs */}
        {culture.map((v) => (
          <input key={v} type="hidden" name="cultureValues" value={v} />
        ))}
      </div>

      {/* Goder */}
      <div>
        <label className="block text-sm font-medium text-midnight/60 mb-3">
          Goder og fordeler
          <span className="text-midnight/30 font-normal"> — velg alt som passer</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {BENEFIT_OPTIONS.map((perk) => {
            const active = perks.includes(perk);
            return (
              <button
                key={perk}
                type="button"
                onClick={() => toggle(perks, setPerks, perk)}
                className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-midnight text-pearl border-midnight"
                    : "bg-white text-midnight/60 border-platinum hover:border-midnight/30"
                }`}
              >
                {perk}
              </button>
            );
          })}
        </div>
        {perks.map((v) => (
          <input key={v} type="hidden" name="benefits" value={v} />
        ))}
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-platinum">
        <button
          type="submit"
          disabled={pending}
          className="bg-midnight text-pearl rounded-full px-6 py-2.5 text-sm font-medium hover:bg-midnight/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Lagrer…" : "Lagre profil"}
        </button>
      </div>
    </form>
  );
}
