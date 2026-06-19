"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { APPLICATION_STATUSES } from "@/lib/application-statuses";

type ActionState = { error: string } | null;

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
