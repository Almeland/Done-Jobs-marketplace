"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createJobSeekerSession, clearJobSeekerSession } from "@/lib/session";
import bcrypt from "bcryptjs";

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
