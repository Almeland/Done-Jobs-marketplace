import type { JobListingModel } from "@/app/generated/prisma/models/JobListing";

export function utfyllingsgrad(l: JobListingModel): number {
  const fields = [
    !!l.title,
    !!l.body,
    !!(l.contactName || l.contactTitle || l.contactEmail),
    !!l.applicationDeadline,
    !!(l.receiptMethod && (l.receiptEmail || l.receiptUrl)),
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

export function relativTid(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "akkurat nå";
  if (min < 60) return `${min} min siden`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} t siden`;
  const d = Math.floor(h / 24);
  return `${d} dag${d !== 1 ? "er" : ""} siden`;
}
