"use client";

import { useActionState } from "react";
import {
  publiserAnnonse,
  stoppAnnonse,
  reaktiverAnnonse,
} from "@/app/actions/listings";
import type { JobListingModel as JobListing } from "@/app/generated/prisma/models/JobListing";
import { LISTING_DURATION_DAYS } from "@/lib/constants";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Utkast",
  ACTIVE: "Aktiv",
  STOPPED: "Stoppet",
  EXPIRED: "Utløpt",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-platinum text-midnight/60",
  ACTIVE: "bg-emerald-brand/10 text-emerald-brand",
  STOPPED: "bg-amber-brand/10 text-amber-brand",
  EXPIRED: "bg-red-brand/10 text-red-brand",
};

function daysLeft(expiresAt: Date | string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

export default function StatusPanel({ listing }: { listing: JobListing }) {
  const publiser = publiserAnnonse.bind(null, listing.id);
  const stopp = stoppAnnonse.bind(null, listing.id);
  const reaktiver = reaktiverAnnonse.bind(null, listing.id);

  const [publiserState, publiserAction, publiserPending] = useActionState(
    publiser,
    null
  );
  const [stoppState, stoppAction, stoppPending] = useActionState(stopp, null);
  const [reaktiverState, reaktiverAction, reaktiverPending] = useActionState(
    reaktiver,
    null
  );

  const days = daysLeft(listing.expiresAt);
  const error =
    publiserState?.error ?? stoppState?.error ?? reaktiverState?.error;

  return (
    <div className="border border-platinum rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-midnight/60">Status</span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            STATUS_COLORS[listing.status] ?? "bg-platinum text-midnight/60"
          }`}
        >
          {STATUS_LABELS[listing.status] ?? listing.status}
        </span>
      </div>

      {listing.status === "ACTIVE" && days !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-midnight/50">
            <span>Dager igjen</span>
            <span>
              {Math.max(0, days)}/{LISTING_DURATION_DAYS}
            </span>
          </div>
          <div className="bg-platinum rounded-full h-1.5">
            <div
              className="bg-emerald-brand h-1.5 rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, (days / LISTING_DURATION_DAYS) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {listing.publishedAt && (
        <p className="text-xs text-midnight/40">
          Publisert{" "}
          {new Date(listing.publishedAt).toLocaleDateString("nb-NO", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-brand bg-red-brand/5 border border-red-brand/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {listing.status === "DRAFT" && (
        <form action={publiserAction}>
          <button
            type="submit"
            disabled={publiserPending}
            className="w-full bg-violet text-pearl rounded-full py-2.5 text-sm font-medium hover:bg-violet/90 disabled:opacity-50 transition-colors"
          >
            {publiserPending ? "Publiserer…" : "Publiser annonse"}
          </button>
        </form>
      )}

      {listing.status === "ACTIVE" && (
        <form action={stoppAction}>
          <button
            type="submit"
            disabled={stoppPending}
            className="w-full border border-platinum text-midnight/70 rounded-full py-2.5 text-sm font-medium hover:bg-platinum disabled:opacity-50 transition-colors"
          >
            {stoppPending ? "Stopper…" : "Stopp annonsen"}
          </button>
        </form>
      )}

      {listing.status === "STOPPED" && (
        <div className="space-y-2">
          {days !== null && days > 0 ? (
            <form action={reaktiverAction}>
              <button
                type="submit"
                disabled={reaktiverPending}
                className="w-full bg-midnight text-pearl rounded-full py-2.5 text-sm font-medium hover:bg-midnight/90 disabled:opacity-50 transition-colors"
              >
                {reaktiverPending ? "Reaktiverer…" : "Reaktiver annonse"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-red-brand text-center">
              Utløpt — kan ikke reaktiveres
            </p>
          )}
        </div>
      )}

      {listing.status === "EXPIRED" && (
        <p className="text-xs text-midnight/40 text-center">
          Annonsen er utløpt og kan ikke reaktiveres.
        </p>
      )}
    </div>
  );
}
