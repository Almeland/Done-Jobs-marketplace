"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getJobSeekerSession } from "@/lib/session";
import { writeFile } from "fs/promises";
import path from "path";

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
    const filename = `cv-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await cvFile.arrayBuffer());
    await writeFile(
      path.join(process.cwd(), "public/uploads", filename),
      buffer
    );
    cvFileUrl = `/uploads/${filename}`;
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

  // Stub: deliver to receipt method
  if (listing.receiptMethod === "EMAIL" && listing.receiptEmail) {
    console.log(
      `[e-post stub] Ny søknad på «${listing.title}» fra ${applicantName} <${applicantEmail}> → videresendt til ${listing.receiptEmail}`
    );
  }

  // Stub: confirmation to applicant
  console.log(
    `[e-post stub] Søknadsbekreftelse sendt til ${applicantEmail}`
  );

  redirect(`/stillinger/${listingId}/soknad/bekreftet`);
}
