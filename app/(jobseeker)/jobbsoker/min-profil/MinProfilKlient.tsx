"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { MatchResult } from "@/app/api/match-stillinger/route";
import { lagreCVParsed } from "@/app/actions/jobseeker";
import { INDUSTRIES } from "@/lib/categories";

type ParsedCV = {
  navn: string | null;
  roller: string[];
  kompetanser: string[];
  bransjer: string[];
  utdanning: string[];
  språk: string[];
  erfaring_aar: number | null;
  sammendrag: string | null;
};

const ROLLER_SUGGESTIONS = [
  "Fullstack-utvikler", "Backend-utvikler", "Frontend-utvikler", "DevOps-ingeniør",
  "Produktsjef", "Prosjektleder", "UX-designer", "UI-designer", "Dataingeniør",
  "Datascientist", "Teknisk leder", "Scrum Master", "Agile Coach", "Daglig leder",
  "Avdelingsleder", "Teamleder", "Sales Manager", "Account Manager", "Konsulent",
  "Rådgiver", "Analytiker", "Forretningsutvikler", "Selger", "Koordinator",
  "HR-partner", "Rekrutterer", "Økonomisjef", "Revisor", "Markedssjef",
  "Kundeservicemedarbeider", "Ingeniør", "Lærer",
];

const KOMPETANSE_SUGGESTIONS = [
  "React", "Vue", "Angular", "Next.js", "Node.js", "TypeScript", "JavaScript",
  "Python", "Java", "C#", ".NET", "PHP", "Go", "Rust", "Swift", "Kotlin",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST API",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git", "Linux",
  "Terraform", "Ansible", "Figma", "Adobe XD", "Excel", "PowerBI", "Tableau",
  "SAP", "Salesforce", "HubSpot", "Jira", "Confluence",
  "Prosjektledelse", "Budsjettering", "Strategiutvikling", "Forretningsutvikling",
  "Salg", "B2B-salg", "Forhandling", "Kundehåndtering", "CRM",
  "Markedsføring", "Digital markedsføring", "SEO", "SEM", "Content marketing",
  "Regnskapsføring", "Revisjon", "Finansanalyse", "Risikostyring",
  "Agile", "Scrum", "Kanban", "Lean", "PRINCE2",
  "Kommunikasjon", "Lederskap", "Presentasjonsteknikk", "Teamarbeid",
];

const UTDANNING_SUGGESTIONS = [
  "Bachelor i informatikk", "Master i informatikk", "Sivilingeniør",
  "Bachelor i økonomi", "Master i økonomi", "Siviløkonom", "MBA",
  "Bachelor i markedsføring", "Bachelor i psykologi", "Juss",
  "Master i ledelse", "Medisin", "Sykepleie", "Pedagogikk",
  "Fagbrev", "Videregående", "PhD", "Bachelor i kommunikasjon",
];

const SPRAK_SUGGESTIONS = [
  "Norsk", "Engelsk", "Svensk", "Dansk", "Tysk", "Fransk",
  "Spansk", "Finsk", "Polsk", "Arabisk", "Mandarin", "Japansk",
];

type Props = {
  initialCvText: string | null;
  initialCvParsed: ParsedCV | null;
};

export default function MinProfilKlient({ initialCvText, initialCvParsed }: Props) {
  const [cvText, setCvText] = useState(initialCvText ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [editedParsed, setEditedParsed] = useState<ParsedCV | null>(initialCvParsed);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Record<string, "god" | "ikke">>({});

  useEffect(() => {
    const stored = localStorage.getItem("match-feedback");
    if (stored) {
      try { setFeedback(JSON.parse(stored)); } catch {}
    }
  }, []);

  function updateField<K extends keyof ParsedCV>(key: K, value: ParsedCV[K]) {
    setEditedParsed((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function setMatchFeedback(listingId: string, value: "god" | "ikke" | null) {
    setFeedback((prev) => {
      const next = { ...prev };
      if (value === null) delete next[listingId];
      else next[listingId] = value;
      localStorage.setItem("match-feedback", JSON.stringify(next));
      return next;
    });
  }

  async function parseCV() {
    if (!file && !cvText.trim()) {
      setError("Last opp en PDF eller skriv inn tekst om deg selv.");
      return;
    }
    setParsing(true);
    setError("");
    setEditedParsed(null);
    setMatches(null);

    const fd = new FormData();
    if (file) fd.append("cv", file);
    fd.append("text", cvText);

    const res = await fetch("/api/parser-cv", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Feil ved parsing."); }
    else { setEditedParsed(data); }
    setParsing(false);
  }

  async function finnStillinger() {
    if (!editedParsed) return;
    setMatching(true);
    setError("");
    setMatches(null);

    // Save any edits before matching (matching reads from DB)
    const saveResult = await lagreCVParsed(JSON.stringify(editedParsed));
    if (!saveResult.success) {
      setError(saveResult.error ?? "Kunne ikke lagre profil.");
      setMatching(false);
      return;
    }

    const res = await fetch("/api/match-stillinger", { method: "POST" });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Feil ved matching."); }
    else { setMatches(data); }
    setMatching(false);
  }

  // Aggregate styrker across all matches by frequency
  const topStyrker = (() => {
    if (!matches || matches.length === 0) return [];
    const counts = new Map<string, number>();
    for (const m of matches) {
      for (const s of m.styrker) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([s]) => s);
  })();

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
            onChange={(e) => { setCvText(e.target.value); setEditedParsed(null); }}
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

      {/* Editable kompetanseprofil */}
      {editedParsed && (
        <div className="bg-white border border-platinum rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-midnight/60 uppercase tracking-widest">Kompetanseprofil</h2>
            <span className="text-xs text-emerald-brand font-medium">✓ Analysert</span>
          </div>

          {editedParsed.sammendrag && (
            <p className="text-[15px] text-midnight/70 leading-relaxed border-b border-platinum pb-5">
              {editedParsed.sammendrag}
            </p>
          )}

          <p className="text-xs text-midnight/40">
            Fjern kompetanser som ikke stemmer, eller legg til det som mangler. Endringer lagres automatisk når du kjører matching.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <EditableGruppe
              label="Roller"
              tags={editedParsed.roller}
              color="bg-lavender text-violet"
              suggestions={ROLLER_SUGGESTIONS}
              onChange={(tags) => updateField("roller", tags)}
            />
            <EditableGruppe
              label="Kompetanser"
              tags={editedParsed.kompetanser}
              color="bg-platinum text-midnight/70"
              suggestions={KOMPETANSE_SUGGESTIONS}
              onChange={(tags) => updateField("kompetanser", tags)}
            />
            <EditableGruppe
              label="Bransjeerfaring"
              tags={editedParsed.bransjer}
              color="bg-amber-brand/10 text-amber-brand"
              suggestions={[...INDUSTRIES]}
              onChange={(tags) => updateField("bransjer", tags)}
            />
            <EditableGruppe
              label="Utdanning"
              tags={editedParsed.utdanning}
              color="bg-emerald-brand/10 text-emerald-brand"
              suggestions={UTDANNING_SUGGESTIONS}
              onChange={(tags) => updateField("utdanning", tags)}
            />
            {(editedParsed.språk ?? []).length > 0 && (
              <EditableGruppe
                label="Språk"
                tags={editedParsed.språk ?? []}
                color="bg-violet/10 text-violet/80"
                suggestions={SPRAK_SUGGESTIONS}
                onChange={(tags) => updateField("språk", tags)}
              />
            )}
          </div>

          {editedParsed.erfaring_aar != null && (
            <p className="text-sm text-midnight/50">
              Estimert arbeidserfaring:{" "}
              <span className="font-semibold text-midnight">{editedParsed.erfaring_aar} år</span>
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

      {/* Styrker å fokusere på */}
      {topStyrker.length > 0 && (
        <div className="bg-emerald-brand/5 border border-emerald-brand/20 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-emerald-brand uppercase tracking-widest mb-1">
            Styrker du bør fokusere på
          </h2>
          <p className="text-xs text-midnight/40 mb-4">
            Disse egenskapene går igjen på tvers av dine beste matcher.
          </p>
          <div className="flex flex-wrap gap-2">
            {topStyrker.map((s, i) => (
              <span key={i} className="text-sm bg-emerald-brand/10 text-emerald-brand px-3 py-1.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matchresultater */}
      {matches !== null && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-midnight/60 uppercase tracking-widest">
            {matches.length === 0
              ? "Ingen stillinger over 40% match akkurat nå"
              : `${matches.length} matchende stilling${matches.length !== 1 ? "er" : ""}`}
          </h2>
          {matches.map((m) => {
            const fb = feedback[m.listingId] ?? null;
            return (
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

                <div className="flex items-center justify-between gap-3 pt-1">
                  <Link
                    href={`/stillinger/${m.listingId}`}
                    className="inline-block bg-violet text-pearl rounded-full px-5 py-2 text-sm font-medium hover:bg-violet/90 transition-colors"
                  >
                    Se stillingen →
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-midnight/30">Passer dette?</span>
                    <button
                      type="button"
                      onClick={() => setMatchFeedback(m.listingId, fb === "god" ? null : "god")}
                      title="Bra match"
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors ${
                        fb === "god"
                          ? "bg-emerald-brand text-white"
                          : "bg-emerald-brand/10 text-emerald-brand hover:bg-emerald-brand/20"
                      }`}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatchFeedback(m.listingId, fb === "ikke" ? null : "ikke")}
                      title="Ikke match"
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors ${
                        fb === "ikke"
                          ? "bg-red-brand text-white"
                          : "bg-red-brand/10 text-red-brand hover:bg-red-brand/20"
                      }`}
                    >
                      👎
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditableGruppe({
  label,
  tags,
  color,
  suggestions = [],
  onChange,
}: {
  label: string;
  tags: string[];
  color: string;
  suggestions?: string[];
  onChange: (tags: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  function handleAdd(tag: string) {
    const t = tag.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
    setAdding(false);
  }

  return (
    <div>
      <p className="text-xs font-semibold text-midnight/40 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${color}`}>
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="ml-0.5 opacity-50 hover:opacity-100 leading-none text-[11px] font-bold"
            >
              ×
            </button>
          </span>
        ))}

        {adding ? (
          <div className="relative">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) { e.preventDefault(); handleAdd(input); }
                if (e.key === "Escape") { setAdding(false); setInput(""); }
              }}
              onBlur={() => setTimeout(() => { setAdding(false); setInput(""); }, 150)}
              placeholder="Søk eller skriv..."
              className="text-xs border border-platinum rounded-full px-3 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-violet/40"
            />
            {input.length > 0 && filtered.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-platinum rounded-xl shadow-lg z-20 min-w-[180px] max-h-44 overflow-y-auto">
                {filtered.slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => handleAdd(s)}
                    className="block w-full text-left text-xs px-3 py-2 hover:bg-lavender transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs px-2.5 py-1 rounded-full border border-dashed border-midnight/20 text-midnight/40 hover:border-violet/40 hover:text-violet transition-colors"
          >
            + Legg til
          </button>
        )}
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
