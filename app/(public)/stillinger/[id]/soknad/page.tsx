import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SoknadSkjema from "./SoknadSkjema";
import Link from "next/link";

export default async function SoknadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await prisma.jobListing.findUnique({
    where: { id },
    include: { account: true },
  });

  if (!listing || listing.status !== "ACTIVE") notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href={`/stillinger/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
      >
        ← Tilbake til annonsen
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Søk på stilling
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {listing.title} · {listing.account.companyName}
      </p>
      <SoknadSkjema listingId={id} />
    </div>
  );
}
