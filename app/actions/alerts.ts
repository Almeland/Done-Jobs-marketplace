"use server";

import { prisma } from "@/lib/prisma";

type Result = { ok: true } | { error: string };

export async function subscribeJobAlert(
  _prev: Result | null,
  formData: FormData
): Promise<Result> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const bransje = (formData.get("bransje") as string) || null;
  const kategori = (formData.get("kategori") as string) || null;
  const sted = (formData.get("sted") as string) || null;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRe.test(email))
    return { error: "Oppgi en gyldig e-postadresse." };

  const existing = await prisma.jobAlert.findFirst({
    where: { email, bransje, kategori, sted },
  });
  if (existing) return { error: "Du er allerede abonnert på dette varselet." };

  await prisma.jobAlert.create({ data: { email, bransje, kategori, sted } });
  return { ok: true };
}

export async function followCompany(
  _prev: Result | null,
  formData: FormData
): Promise<Result> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const followerName = (formData.get("followerName") as string)?.trim() || null;
  const accountId = formData.get("accountId") as string;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRe.test(email))
    return { error: "Oppgi en gyldig e-postadresse." };
  if (!accountId) return { error: "Ugyldig bedrift." };

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Bedriften finnes ikke." };

  try {
    await prisma.companyFollow.create({
      data: { email, followerName, accountId },
    });
  } catch {
    return { error: "Du følger allerede denne bedriften." };
  }

  return { ok: true };
}

export async function unsubscribeJobAlert(token: string): Promise<Result> {
  const alert = await prisma.jobAlert.findUnique({ where: { token } });
  if (!alert) return { error: "Ugyldig eller utløpt avmeldingslenke." };
  await prisma.jobAlert.delete({ where: { token } });
  return { ok: true };
}

export async function unfollowCompany(token: string): Promise<Result> {
  const follow = await prisma.companyFollow.findUnique({ where: { token } });
  if (!follow) return { error: "Ugyldig eller utløpt avmeldingslenke." };
  await prisma.companyFollow.delete({ where: { token } });
  return { ok: true };
}
