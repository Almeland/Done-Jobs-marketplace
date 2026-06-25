"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getJobSeekerSession } from "@/lib/session";
import { put } from "@vercel/blob";
import { sendSoknadTilArbeidsgiver, sendBekreftelseTilSoker } from "@/lib/email";

type ActionState = { error: string } | null;

export async function sendSoknad(
  listingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const listing = await prisma.jobListing.findUnique({
    where: { id: listingId },
    include: { account: true },
  });
  if (!listing || listing.status !== "ACTIVE")
    return { error: "Stillingen er ikke lenger tilgjengelig." };

  const applicantName = (formData.get("applicantName") as string)?.trim();
  const applicantEmail = (formData.get("applicantEmail") as string)?.trim().toLowerCase();
  const applicantPhone = (formData.get("applicantPhone") as string)?.trim() || null;
  const coverText = (formData.get("coverText") as string)?.trim() || null;
  const cvFile = formData.get("cv") as File | null;

  if (!applicantName || !applicantEmail)
    return { error: "Navn og e-post er påkrevd." };

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(applicantEmail))
    return { error: "Ugyldig e-postadresse." };

  let cvFileUrl: string | null = null;
  if (cvFile && cvFile.size > 0) {
    const ext = cvFile.name.split(".").pop() ?? "pdf";
    const blob = await put(`cv/${Date.now()}.${ext}`, cvFile, { access: "public" });
    cvFileUrl = blob.url;
  }

  const jobSeeker = await getJobSeekerSession();

  await prisma.application.create({
    data: {
      jobListingId: listingId,
      applicantName,
      applicantEmail,
      applicantPhone,
      coverText,
      cvFileUrl,
      jobSeekerId: jobSeeker?.id ?? null,
    },
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://done-jobs-marketplace.vercel.app";
  const listingUrl = `${base}/stillinger/${listingId}`;

  const emailPromises: Promise<unknown>[] = [];

  if (listing.receiptMethod === "EMAIL" && listing.receiptEmail) {
    emailPromises.push(
      sendSoknadTilArbeidsgiver({
        listingTitle: listing.title ?? "Stilling",
        companyName: listing.account.companyName,
        applicantName,
        applicantEmail,
        applicantPhone,
        coverText,
        cvFileUrl,
        listingUrl: `${base}/arbeidsgiver/annonser/${listingId}`,
        receiptEmail: listing.receiptEmail,
      }).catch((err) => console.error("[e-post feil] arbeidsgiver:", err))
    );
  }

  emailPromises.push(
    sendBekreftelseTilSoker({
      listingTitle: listing.title ?? "Stilling",
      companyName: listing.account.companyName,
      applicantName,
      applicantEmail,
      listingUrl,
    }).catch((err) => console.error("[e-post feil] søker:", err))
  );

  await Promise.all(emailPromises);

  redirect(`/stillinger/${listingId}/soknad/bekreftet`);
}
