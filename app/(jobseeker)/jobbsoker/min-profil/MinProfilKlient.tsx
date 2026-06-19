"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchResult } from "@/app/api/match-stillinger/route";

type ParsedCV = {
  navn: string | null;
  roller: string[];
  kompetanser: string[];
  bransjer: string[];
  utdanning: string[];
  erfaring_aar: number | null;
  sammendrag: string | null;
};

type Props = {
  initialCvText: string | null;
  initialCvParsed: ParsedCV | null;
};

export default function MinProfilKlient({ initialCvText, initialCvParsed }: Props) {
  const [cvText, setCvText] = useState(initialCvText ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [parsed, setParsed] = useState<ParsedCV | null>(initialCvParsed);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState("");

  async function parseCV() {
    if (!file && !cvText.trim()) {
      setError("Last opp en PDF eller skriv inn tekst om deg selv.");
      return;
    }
    setParsing(true);
    setError("");
    setParsed(null);
    setMatches(null);

    const fd = new FormData();
    if (file) fd.append("cv", file);
    fd.append("text", cvText);

    const res = await fetch("/api/parser-cv", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Feil ved parsing."); }
    else { setParsed(data); }
    setParsing(false);
  }

  async function finnStillinger() {
    setMatching(true);
    setError("");
    setMatches(null);

    const res = await fetch("/api/match-stillinger", { method: "POST" });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Feil ved matching."); }
    else { setMatches(data); }
    setMatching(false);
  }

  return (
    <div className="space-y-8">
      {/* CV-input */}
      <div className="bg-white border border-platinum rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-midnight/60 uppercase tracking-widest">Din CV</h2>

        <div>
          <label className="block text-sm font-medium text-midnight/60 mb-2">Last opp CV (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-midnight/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-lavender file:text-violet hover:file:bg-lavender/80 cursor-pointer"
          />
          {file && <p className="text-xs text-emerald-brand mt-1.5">✓ {file.name}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-platinum" />
          <span className="text-xs text-midnight/30">eller</span>
          <div className="flex-1 h-px bg-platinum" />
        </div>

        <div>
          <label className="block text-sm font-medium text-midnight/60 mb-2">
            Skriv om deg selv
            <span className="text-midnight/30 font-normal"> — erfaring, utdanning, kompetanser</span>
          </label>
          <textarea
            value={cvText}
            onChange={(e) => { setCvText(e.target.value); setParsed(null); }}
            rows={8}
            className="w-full border border-platinum bg-white rounded-xl px-4 py-3 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40 resize-none"
            placeholder={`f.eks.\n5 år som fullstack-utvikler med React og Node.js. Bachelor i informatikk fra NTNU. Jobbet i fintech og SaaS. Erfaring med AWS, Docker og PostgreSQL. Snakker norsk og engelsk flytende.`}
          />
        </div>

        {error && (
          <p className="text-sm text-red-brand bg-red-brand/5 border border-red-brand/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="button"
          onClick={parseCV}
          disabled={parsing}
          className="bg-violet text-pearl rounded-full px-6 py-2.5 text-sm font-medium hover:bg-violet/90 disabled:opacity-50 transition-colors"
        >
          {parsing ? "Analyserer CV…" : "Analyser CV"}
        </button>
      </div>

      {/* Ekstraherte kompetanser */}
      {parsed && (
        <div className="bg-white border border-platinum rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-midnight/60 uppercase tracking-widest">Kompetanseprofil</h2>
            <span className="text-xs text-emerald-brand font-medium">✓ Analysert</span>
          </div>

          {parsed.sammendrag && (
            <p className="text-[15px] text-midnight/70 leading-relaxed border-b border-platinum pb-5">{parsed.sammendrag}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {parsed.roller.length > 0 && (
              <Gruppe label="Roller" tags={parsed.roller} color="bg-lavender text-violet" />
            )}
            {parsed.kompetanser.length > 0 && (
              <Gruppe label="Kompetanser" tags={parsed.kompetanser} color="bg-platinum text-midnight/70" />
            )}
            {parsed.bransjer.length > 0 && (
              <Gruppe label="Bransjeerfaring" tags={parsed.bransjer} color="bg-amber-brand/10 text-amber-brand" />
            )}
            {parsed.utdanning.length > 0 && (
              <Gruppe label="Utdanning" tags={parsed.utdanning} color="bg-emerald-brand/10 text-emerald-brand" />
            )}
          </div>

          {parsed.erfaring_aar != null && (
            <p className="text-sm text-midnight/50">
              Estimert arbeidserfaring: <span className="font-semibold text-midnight">{parsed.erfaring_aar} år</span>
            </p>
          )}

          <button
            type="button"
            onClick={finnStillinger}
            disabled={matching}
            className="w-full bg-midnight text-pearl rounded-full px-6 py-3 text-sm font-medium hover:bg-midnight/90 disabled:opacity-50 transition-colors"
          >
            {matching ? "Finner matchende stillinger…" : "Finn matchende stillinger"}
          </button>
        </div>
      )}

      {/* Resultater */}
      {matches !== null && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-midnight/60 uppercase tracking-widest">
            {matches.length === 0
              ? "Ingen stillinger over 40% match akkurat nå"
              : `${matches.length} matchende stilling${matches.length !== 1 ? "er" : ""}`}
          </h2>
          {matches.map((m) => (
            <div key={m.listingId} className="bg-white border border-platinum rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-midnight/40 mb-1">{m.bedrift}</p>
                  <h3 className="text-[16px] font-semibold text-midnight">{m.tittel}</h3>
                </div>
                <ScoreBadge score={m.score} />
              </div>

              <p className="text-sm text-midnight/70 leading-relaxed">{m.forklaring}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {m.styrker.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-brand mb-2">Styrker</p>
                    <ul className="space-y-1">
                      {m.styrker.map((s, i) => (
                        <li key={i} className="text-xs text-midnight/60 flex items-start gap-1.5">
                          <span className="text-emerald-brand mt-0.5">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {m.mangler.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-brand mb-2">Mulige gap</p>
                    <ul className="space-y-1">
                      {m.mangler.map((g, i) => (
                        <li key={i} className="text-xs text-midnight/60 flex items-start gap-1.5">
                          <span className="text-amber-brand mt-0.5">△</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Link
                href={`/stillinger/${m.listingId}`}
                className="inline-block bg-violet text-pearl rounded-full px-5 py-2 text-sm font-medium hover:bg-violet/90 transition-colors"
              >
                Se stillingen →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Gruppe({ label, tags, color }: { label: string; tags: string[]; color: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-midnight/40 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className={`text-xs px-2.5 py-1 rounded-full ${color}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-brand text-white" :
    score >= 60 ? "bg-violet text-white" :
    "bg-amber-brand/20 text-amber-brand";
  return (
    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${color}`}>
      <span className="text-lg font-bold leading-none">{score}</span>
      <span className="text-[10px] opacity-80">match</span>
    </div>
  );
}
