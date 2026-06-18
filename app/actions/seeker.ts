"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSeeker } from "@/lib/seeker-auth";
import { INDUSTRIES, JOB_CATEGORIES } from "@/lib/categories";

type Result = { error: string } | null;

export async function updateJobAlert(
  alertId: string,
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const seeker = await requireSeeker();
  const alert = await prisma.jobAlert.findUnique({ where: { id: alertId } });
  if (!alert || alert.jobSeekerId !== seeker.id) return { error: "Ikke funnet." };

  const bransje = (formData.get("bransje") as string) || null;
  const kategori = (formData.get("kategori") as string) || null;
  const sted = (formData.get("sted") as string)?.trim() || null;

  if (bransje && !INDUSTRIES.includes(bransje as never))
    return { error: "Ugyldig bransje." };
  if (kategori && !JOB_CATEGORIES.includes(kategori as never))
    return { error: "Ugyldig kategori." };

  const parts = [bransje, kategori, sted].filter(Boolean);
  const name = parts.length ? parts.join(" · ") : "Alle nye stillinger";

  await prisma.jobAlert.update({
    where: { id: alertId },
    data: { bransje, kategori, sted, name },
  });

  revalidatePath("/jobbsøker/profil");
  return null;
}
