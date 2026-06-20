"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, clearSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";

type ActionState = { error: string } | null;

export async function registrer(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const companyName = (formData.get("companyName") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const logoFile = formData.get("logo") as File | null;

  if (!companyName || !name || !email || !password)
    return { error: "Alle felt er påkrevd." };

  if (password.length < 8)
    return { error: "Passordet må være minst 8 tegn." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "En bruker med denne e-posten finnes allerede." };

  let logoUrl: string | null = null;
  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop() ?? "png";
    const blob = await put(`logoer/logo-${Date.now()}.${ext}`, logoFile, { access: "public" });
    logoUrl = blob.url;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const account = await prisma.account.create({
    data: {
      companyName,
      logoUrl,
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: "ADMIN",
          isOwner: true,
        },
      },
    },
    include: { users: true },
  });

  // Stub: confirmation email
  console.log(`[e-post stub] Bekreftelsesmail sendt til ${email}`);

  await createSession(account.users[0].id);
  redirect("/arbeidsgiver");
}

export async function loggInn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Fyll inn e-post og passord." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Feil e-post eller passord." };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { error: "Feil e-post eller passord." };

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  await createSession(user.id);
  redirect("/arbeidsgiver");
}

export async function loggUt() {
  await clearSession();
  redirect("/logg-inn");
}
