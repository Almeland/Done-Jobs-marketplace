"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { LISTING_DURATION_DAYS } from "@/lib/constants";

type ActionState = { error: string } | null;

export async function opprettAnnonse(): Promise<never> {
  const user = await requireAuth();
  const listing = await prisma.jobListing.create({
    data: {
      accountId: user.accountId,
      createdById: user.id,
      status: "DRAFT",
    },
  });
  redirect(`/arbeidsgiver/annonser/${listing.id}/rediger`);
}

export async function lagreAnnonse(
  listingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAuth();

  const listing = await prisma.jobListing.findUnique({
    where: { id: listingId },
  });
  if (!listing || listing.accountId !== user.accountId)
    return { error: "Annonsen finnes ikke." };

  const title = (formData.get("title") as string)?.trim() || null;
  const body = (formData.get("body") as string)?.trim() || null;
  const contactName = (formData.get("contactName") as string)?.trim() || null;
  const contactTitle = (formData.get("contactTitle") as string)?.trim() || null;
  const contactEmail = (formData.get("contactEmail") as string)?.trim() || null;
  const deadlineRaw = formData.get("applicationDeadline") as string;
  const applicationDeadline = deadlineRaw ? new Date(deadlineRaw) : null;
  const receiptMethod = (formData.get("receiptMethod") as string) || null;
  const receiptEmail = (formData.get("receiptEmail") as string)?.trim() || null;
  const receiptUrl = (formData.get("receiptUrl") as string)?.trim() || null;

  if (receiptMethod === "EMAIL" && receiptEmail) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(receiptEmail))
      return { error: "Ugyldig e-postadresse for søknadsmottak." };
  }
  if (receiptMethod === "EXTERNAL_URL" && receiptUrl) {
    try {
      new URL(receiptUrl);
    } catch {
      return { error: "Ugyldig URL for søknadsmottak." };
    }
  }

  await prisma.jobListing.update({
    where: { id: listingId },
    data: {
      title,
      body,
      contactName,
      contactTitle,
      contactEmail,
      applicationDeadline,
      receiptMethod,
      receiptEmail: receiptMethod === "EMAIL" ? receiptEmail : null,
      receiptUrl: receiptMethod === "EXTERNAL_URL" ? receiptUrl : null,
    },
  });

  revalidatePath("/arbeidsgiver");
  return null;
}

export async function publiserAnnonse(listingId: string): Promise<ActionState> {
  const user = await requireAuth();
  const listing = await prisma.jobListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.accountId !== user.accountId)
    return { error: "Annonsen finnes ikke." };
  if (listing.status !== "DRAFT" && listing.status !== "STOPPED")
    return { error: "Annonsen kan ikke publiseres fra denne statusen." };

  const now = new Date();
  const firstPublishedAt = listing.firstPublishedAt ?? now;
  const expiresAt =
    listing.expiresAt ??
    new Date(firstPublishedAt.getTime() + LISTING_DURATION_DAYS * 86_400_000);

  if (expiresAt <= now) return { error: "Annonsen er utløpt og kan ikke reaktiveres." };

  await prisma.jobListing.update({
    where: { id: listingId },
    data: {
      status: "ACTIVE",
      firstPublishedAt,
      publishedAt: now,
      expiresAt,
    },
  });

  console.log(`[e-post stub] Annonse «${listing.title}» er nå publisert`);
  revalidatePath("/arbeidsgiver");
  return null;
}

export async function stoppAnnonse(listingId: string): Promise<ActionState> {
  const user = await requireAuth();
  const listing = await prisma.jobListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.accountId !== user.accountId)
    return { error: "Annonsen finnes ikke." };
  if (listing.status !== "ACTIVE")
    return { error: "Kun aktive annonser kan stoppes." };

  await prisma.jobListing.update({
    where: { id: listingId },
    data: { status: "STOPPED" },
  });

  revalidatePath("/arbeidsgiver");
  return null;
}

export async function reaktiverAnnonse(listingId: string): Promise<ActionState> {
  const user = await requireAuth();
  const listing = await prisma.jobListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.accountId !== user.accountId)
    return { error: "Annonsen finnes ikke." };
  if (listing.status !== "STOPPED")
    return { error: "Kun stoppede annonser kan reaktiveres." };

  const now = new Date();
  if (listing.expiresAt && listing.expiresAt <= now)
    return { error: "Annonsen er utløpt og kan ikke reaktiveres." };

  await prisma.jobListing.update({
    where: { id: listingId },
    data: { status: "ACTIVE", publishedAt: now },
  });

  revalidatePath("/arbeidsgiver");
  return null;
}

export async function slettUtkast(listingId: string): Promise<ActionState> {
  const user = await requireAuth();

  const listing = await prisma.jobListing.findUnique({
    where: { id: listingId },
  });
  if (!listing || listing.accountId !== user.accountId)
    return { error: "Annonsen finnes ikke." };
  if (listing.status !== "DRAFT")
    return { error: "Kun utkast kan slettes herfra." };

  await prisma.jobListing.delete({ where: { id: listingId } });
  revalidatePath("/arbeidsgiver");
  redirect("/arbeidsgiver");
}
