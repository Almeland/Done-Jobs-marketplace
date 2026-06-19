import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfilSkjema from "./ProfilSkjema";

export default async function ProfilPage() {
  const user = await requireAuth();

  const account = await prisma.account.findUnique({
    where: { id: user.accountId },
    select: {
      tagline: true,
      description: true,
      website: true,
      employeeCount: true,
      foundedYear: true,
      cultureValues: true,
      benefits: true,
      orgNumber: true,
      companyName: true,
      id: true,
    },
  });

  if (!account) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/arbeidsgiver" className="text-sm text-midnight/50 hover:text-midnight mb-2 inline-block">
            ← Tilbake
          </Link>
          <h1 className="text-[28px] font-semibold text-midnight tracking-tight">
            Bedriftsprofil
          </h1>
          <p className="text-sm text-midnight/40 mt-1">{account.companyName}</p>
        </div>
        <Link
          href={`/bedrifter/${account.id}`}
          target="_blank"
          className="text-sm text-violet hover:text-violet/70 font-medium"
        >
          Se offentlig profil →
        </Link>
      </div>

      <div className="bg-white border border-platinum rounded-2xl p-6">
        <ProfilSkjema account={account} />
      </div>
    </div>
  );
}
