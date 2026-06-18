"use client";

import { useState, useRef } from "react";

type Props = {
  title: string;
  companyName: string;
  location: string;
  industry: string;
  jobCategory: string;
  onGenerated: (text: string) => void;
};

export default function AiAssistent({
  title,
  companyName,
  location,
  industry,
  jobCategory,
  onGenerated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function generer() {
    setGenerating(true);
    setPreview("");
    setError("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/generer-annonse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, companyName, location, industry, jobCategory, notes }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setError("Kunne ikke generere annonsetekst. Prøv igjen.");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setPreview(full);
      }

      onGenerated(full);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Noe gikk galt. Sjekk at ANTHROPIC_API_KEY er satt i .env.local.");
      }
    } finally {
      setGenerating(false);
    }
  }

  function avbryt() {
    abortRef.current?.abort();
    setGenerating(false);
  }

  return (
    <div className="border border-violet/20 bg-lavender/40 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-violet">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Generer annonsetekst med AI
        </span>
        <svg
          className={`w-4 h-4 text-violet/60 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-violet/10">
          <div className="pt-4">
            <label className="block text-sm font-medium text-midnight/60 mb-1.5">
              Beskriv stillingen med noen kulepunkter eller stikkord
              <span className="text-midnight/30 font-normal"> (valgfritt)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-violet/20 bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40 resize-none"
              placeholder={`f.eks.\n- 5+ års erfaring med React\n- Lede et lite team på 3 utviklere\n- Konkurransedyktig lønn + aksjeprogram`}
            />
          </div>

          <div className="flex items-center gap-3">
            {!generating ? (
              <button
                type="button"
                onClick={generer}
                className="bg-violet text-pearl rounded-full px-5 py-2.5 text-sm font-medium hover:bg-violet/90 transition-colors"
              >
                {preview ? "Regenerer" : "Generer annonsetekst"}
              </button>
            ) : (
              <button
                type="button"
                onClick={avbryt}
                className="border border-platinum text-midnight/60 rounded-full px-5 py-2.5 text-sm font-medium hover:bg-platinum transition-colors"
              >
                Avbryt
              </button>
            )}
            {generating && (
              <span className="text-sm text-violet/70 animate-pulse">Skriver annonse…</span>
            )}
            {preview && !generating && (
              <span className="text-sm text-emerald-brand">
                ✓ Teksten er lagt inn i feltet nedenfor
              </span>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-brand bg-red-brand/5 border border-red-brand/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {generating && preview && (
            <div className="text-xs text-midnight/40 bg-white rounded-xl border border-platinum px-4 py-3 max-h-40 overflow-y-auto font-mono">
              {preview}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
