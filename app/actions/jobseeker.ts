"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createJobSeekerSession, clearJobSeekerSession, getJobSeekerSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { INDUSTRIES, JOB_CATEGORIES } from "@/lib/categories";

type ActionState = { error: string } | null;

export async function registrerJobbsoker(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password)
    return { error: "Alle felt er påkrevd." };
  if (password.length < 8)
    return { error: "Passordet må være minst 8 tegn." };

  const existing = await prisma.jobSeeker.findUnique({ where: { email } });
  if (existing) return { error: "E-postadressen er allerede registrert." };

  const passwordHash = await bcrypt.hash(password, 10);
  const jobSeeker = await prisma.jobSeeker.create({
    data: { name, email, passwordHash },
  });

  await createJobSeekerSession(jobSeeker.id);
  redirect("/jobbsoker");
}

export async function loggInnJobbsoker(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  const jobSeeker = await prisma.jobSeeker.findUnique({ where: { email } });
  if (!jobSeeker) return { error: "Feil e-post eller passord." };

  const ok = await bcrypt.compare(password, jobSeeker.passwordHash);
  if (!ok) return { error: "Feil e-post eller passord." };

  await createJobSeekerSession(jobSeeker.id);
  redirect("/jobbsoker");
}

export async function loggUtJobbsoker() {
  await clearJobSeekerSession();
  redirect("/stillinger");
}

export async function lagreCVParsed(
  cvParsedJson: string
): Promise<{ success: boolean; error?: string }> {
  const seeker = await getJobSeekerSession();
  if (!seeker) return { success: false, error: "Ikke innlogget." };

  try {
    JSON.parse(cvParsedJson);
  } catch {
    return { success: false, error: "Ugyldig format." };
  }

  await prisma.jobSeeker.update({
    where: { id: seeker.id },
    data: { cvParsed: cvParsedJson },
  });

  return { success: true };
}

export async function updateJobAlert(
  alertId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const seeker = await getJobSeekerSession();
  if (!seeker) return { error: "Ikke innlogget." };

  const alert = await prisma.jobAlert.findUnique({ where: { id: alertId } });
  if (!alert || alert.jobSeekerId !== seeker.id) return { error: "Varselet finnes ikke." };

  const bransje = (formData.get("bransje") as string) || null;
  const kategori = (formData.get("kategori") as string) || null;
  const sted = (formData.get("sted") as string)?.trim() || null;

  if (bransje && !INDUSTRIES.includes(bransje as never)) return { error: "Ugyldig bransje." };
  if (kategori && !JOB_CATEGORIES.includes(kategori as never)) return { error: "Ugyldig kategori." };

  const parts = [bransje, kategori, sted].filter(Boolean);
  const name = parts.length ? parts.join(" · ") : "Alle nye stillinger";

  await prisma.jobAlert.update({ where: { id: alertId }, data: { bransje, kategori, sted, name } });
  revalidatePath("/jobbsoker");
  return null;
}
