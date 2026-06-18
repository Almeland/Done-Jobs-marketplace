"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type ActionState = { error: string } | null;

export const APPLICATION_STATUSES = [
  { value: "INNSENDT", label: "Innsendt", color: "bg-platinum text-midnight/60" },
  { value: "UNDER_VURDERING", label: "Under vurdering", color: "bg-violet/10 text-violet" },
  { value: "INNKALT", label: "Innkalt til intervju", color: "bg-amber-brand/10 text-amber-brand" },
  { value: "TILBUDT", label: "Fått tilbud", color: "bg-emerald-brand/10 text-emerald-brand" },
  { value: "AVSLATT", label: "Avslått", color: "bg-red-brand/10 text-red-brand" },
] as const;

export async function oppdaterSoknadsStatus(
  applicationId: string,
  status: string,
  statusNote: string | null
): Promise<ActionState> {
  const user = await requireAuth();

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { jobListing: true },
  });

  if (!application || application.jobListing.accountId !== user.accountId)
    return { error: "Søknaden finnes ikke." };

  const valid = APPLICATION_STATUSES.map((s) => s.value);
  if (!valid.includes(status as (typeof valid)[number]))
    return { error: "Ugyldig status." };

  await prisma.application.update({
    where: { id: applicationId },
    data: { status, statusNote: statusNote?.trim() || null },
  });

  revalidatePath(`/arbeidsgiver/annonser/${application.jobListingId}/soknader`);
  return null;
}
