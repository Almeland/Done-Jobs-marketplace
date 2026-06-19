import { requireJobSeeker } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import MinProfilKlient from "./MinProfilKlient";

export default async function MinProfilPage() {
  const jobSeeker = await requireJobSeeker();

  const seeker = await prisma.jobSeeker.findUnique({
    where: { id: jobSeeker.id },
    select: { cvText: true, cvParsed: true },
  });

  const cvParsed = (() => {
    try { return seeker?.cvParsed ? JSON.parse(seeker.cvParsed) : null; }
    catch { return null; }
  })();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/jobbsoker" className="text-sm text-midnight/50 hover:text-midnight mb-2 inline-block">
            ← Tilbake
          </Link>
          <h1 className="text-[28px] font-semibold text-midnight tracking-tight">Min profil</h1>
          <p className="text-sm text-midnight/40 mt-1">
            Last opp CV eller beskriv deg selv — vi finner de beste stillingene for deg
          </p>
        </div>
      </div>

      <MinProfilKlient
        initialCvText={seeker?.cvText ?? null}
        initialCvParsed={cvParsed}
      />
    </div>
  );
}
