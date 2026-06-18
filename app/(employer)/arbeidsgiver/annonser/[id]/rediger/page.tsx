import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireStaleListings } from "@/lib/expire-listings";
import RedigerSkjema from "./RedigerSkjema";
import SlettKnapp from "./SlettKnapp";
import StatusPanel from "./StatusPanel";
import AdminSlettKnapp from "./AdminSlettKnapp";

export default async function RedigerAnnonsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  await expireStaleListings(user.accountId);

  const listing = await prisma.jobListing.findUnique({ where: { id } });
  if (!listing || listing.accountId !== user.accountId) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        {listing.title ?? "Uten tittel"}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div>
          <RedigerSkjema listing={listing} />
          <div className="mt-4 flex items-center gap-4">
            {listing.status === "DRAFT" && (
              <SlettKnapp listingId={listing.id} />
            )}
            {user.role === "ADMIN" && listing.status !== "DRAFT" && (
              <AdminSlettKnapp listingId={listing.id} />
            )}
          </div>
        </div>
        <StatusPanel listing={listing} />
      </div>
    </div>
  );
}
