import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RedigerSkjema from "./RedigerSkjema";
import SlettKnapp from "./SlettKnapp";

export default async function RedigerAnnonsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const listing = await prisma.jobListing.findUnique({ where: { id } });
  if (!listing || listing.accountId !== user.accountId) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        {listing.title ?? "Uten tittel"}
      </h1>
      <RedigerSkjema listing={listing} />
      {listing.status === "DRAFT" && (
        <div className="mt-4">
          <SlettKnapp listingId={listing.id} />
        </div>
      )}
    </div>
  );
}
