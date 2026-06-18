"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getJobSeekerSession } from "@/lib/session";

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

  const jobSeeker = await getJobSeekerSession();

  const existing = await prisma.jobAlert.findFirst({
    where: { email, bransje, kategori, sted },
  });
  if (existing) return { error: "Du er allerede abonnert på dette varselet." };

  const parts = [bransje, kategori, sted].filter(Boolean);
  const name = parts.length ? parts.join(" · ") : "Alle nye stillinger";

  await prisma.jobAlert.create({
    data: {
      email,
      bransje,
      kategori,
      sted,
      name,
      jobSeekerId: jobSeeker?.id ?? null,
    },
  });

  if (jobSeeker) revalidatePath("/jobbsoker");
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

  const jobSeeker = await getJobSeekerSession();

  try {
    await prisma.companyFollow.create({
      data: {
        email,
        followerName: followerName ?? jobSeeker?.name ?? null,
        accountId,
        jobSeekerId: jobSeeker?.id ?? null,
      },
    });
  } catch {
    return { error: "Du følger allerede denne bedriften." };
  }

  if (jobSeeker) revalidatePath("/jobbsoker");
  return { ok: true };
}

export async function followCompanyAsSeeker(accountId: string): Promise<Result> {
  const jobSeeker = await getJobSeekerSession();
  if (!jobSeeker) return { error: "Logg inn for å følge bedrifter." };

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Bedriften finnes ikke." };

  try {
    await prisma.companyFollow.create({
      data: {
        email: jobSeeker.email,
        followerName: jobSeeker.name,
        accountId,
        jobSeekerId: jobSeeker.id,
      },
    });
  } catch {
    return { error: "Du følger allerede denne bedriften." };
  }

  revalidatePath("/jobbsoker");
  revalidatePath(`/bedrifter/${accountId}`);
  return { ok: true };
}

export async function unfollowCompanyAsSeeker(accountId: string): Promise<Result> {
  const jobSeeker = await getJobSeekerSession();
  if (!jobSeeker) return { error: "Ikke innlogget." };

  await prisma.companyFollow.deleteMany({
    where: { accountId, jobSeekerId: jobSeeker.id },
  });

  revalidatePath("/jobbsoker");
  revalidatePath(`/bedrifter/${accountId}`);
  return { ok: true };
}

export async function deleteJobAlert(alertId: string): Promise<Result> {
  const jobSeeker = await getJobSeekerSession();
  if (!jobSeeker) return { error: "Ikke innlogget." };

  const alert = await prisma.jobAlert.findUnique({ where: { id: alertId } });
  if (!alert || alert.jobSeekerId !== jobSeeker.id)
    return { error: "Varselet finnes ikke." };

  await prisma.jobAlert.delete({ where: { id: alertId } });
  revalidatePath("/jobbsoker");
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
