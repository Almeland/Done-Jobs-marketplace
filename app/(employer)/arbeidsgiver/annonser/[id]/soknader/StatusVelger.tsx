"use client";

import { useTransition, useState } from "react";
import { oppdaterSoknadsStatus, APPLICATION_STATUSES } from "@/app/actions/applications";

type Props = {
  applicationId: string;
  currentStatus: string;
  currentNote: string | null;
};

export default function StatusVelger({ applicationId, currentStatus, currentNote }: Props) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSave() {
    setSaved(false);
    setError("");
    startTransition(async () => {
      const result = await oppdaterSoknadsStatus(applicationId, status, note || null);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  const statusInfo = APPLICATION_STATUSES.find((s) => s.value === status);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
          className="border border-platinum bg-white rounded-xl px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-violet/40"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {statusInfo && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        )}
      </div>
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        rows={2}
        placeholder="Intern notat (valgfritt, ikke synlig for søker)"
        className="w-full border border-platinum bg-white rounded-xl px-3 py-2 text-sm text-midnight placeholder:text-midnight/30 focus:outline-none focus:ring-2 focus:ring-violet/40 resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="bg-midnight text-pearl rounded-full px-4 py-2 text-xs font-medium hover:bg-midnight/90 disabled:opacity-50 transition-colors"
        >
          {pending ? "Lagrer…" : "Oppdater status"}
        </button>
        {saved && <span className="text-xs text-emerald-brand">✓ Lagret</span>}
        {error && <span className="text-xs text-red-brand">{error}</span>}
      </div>
    </div>
  );
}
