"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createJobSeekerSession, clearJobSeekerSession } from "@/lib/session";

type State = { error: string } | null;

export async function registrerJobbsøker(
  _prev: State,
  formData: FormData
): Promise<State> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password)
    return { error: "Fyll inn alle feltene." };
  if (password.length < 8)
    return { error: "Passordet må være minst 8 tegn." };

  const existing = await prisma.jobSeeker.findUnique({ where: { email } });
  if (existing) return { error: "E-postadressen er allerede i bruk." };

  const passwordHash = await bcrypt.hash(password, 10);
  const seeker = await prisma.jobSeeker.create({
    data: { name, email, passwordHash },
  });

  await createJobSeekerSession(seeker.id);
  redirect("/jobbsøker/profil");
}

export async function loggInnJobbsøker(
  _prev: State,
  formData: FormData
): Promise<State> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  const seeker = await prisma.jobSeeker.findUnique({ where: { email } });
  if (!seeker) return { error: "Feil e-post eller passord." };

  const ok = await bcrypt.compare(password, seeker.passwordHash);
  if (!ok) return { error: "Feil e-post eller passord." };

  await createJobSeekerSession(seeker.id);
  redirect("/jobbsøker/profil");
}

export async function loggUtJobbsøker(): Promise<never> {
  await clearJobSeekerSession();
  redirect("/stillinger");
}
