"use server";

import { prisma } from "@/lib/prisma";

export async function registrerVisning(listingId: string) {
  await prisma.jobListing.update({
    where: { id: listingId, status: "ACTIVE" },
    data: { viewCount: { increment: 1 } },
  });
}

export async function registrerSoknadsKlikk(listingId: string) {
  await prisma.jobListing.update({
    where: { id: listingId, status: "ACTIVE" },
    data: { applyClickCount: { increment: 1 } },
  });
}
