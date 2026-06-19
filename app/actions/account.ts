"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type ActionState = { error: string } | null;

export async function lagreProfil(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAuth();

  const tagline = (formData.get("tagline") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const website = (formData.get("website") as string)?.trim() || null;
  const employeeCount = (formData.get("employeeCount") as string) || null;
  const foundedYearRaw = formData.get("foundedYear") as string;
  const foundedYear = foundedYearRaw ? parseInt(foundedYearRaw, 10) || null : null;
  const orgNumber = (formData.get("orgNumber") as string)?.replace(/\s/g, "") || null;
  const cultureValues = formData.getAll("cultureValues") as string[];
  const benefits = formData.getAll("benefits") as string[];

  let normalizedWebsite = website;
  if (normalizedWebsite && !/^https?:\/\//i.test(normalizedWebsite)) {
    normalizedWebsite = `https://${normalizedWebsite}`;
  }
  if (normalizedWebsite) {
    try { new URL(normalizedWebsite); } catch { return { error: "Ugyldig nettside-URL." }; }
  }

  await prisma.account.update({
    where: { id: user.accountId },
    data: {
      tagline,
      description,
      website: normalizedWebsite,
      employeeCount,
      foundedYear,
      orgNumber,
      cultureValues: JSON.stringify(cultureValues),
      benefits: JSON.stringify(benefits),
    },
  });

  revalidatePath("/arbeidsgiver/profil");
  revalidatePath(`/bedrifter/${user.accountId}`);
  return null;
}
