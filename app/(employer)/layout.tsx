import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import LoggUtKnapp from "@/components/LoggUtKnapp";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <>
      <header className="border-b border-platinum bg-pearl">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/arbeidsgiver" className="font-semibold text-lg text-midnight tracking-tight">
              Done Jobs
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link
                href="/arbeidsgiver"
                className="text-midnight/60 hover:text-midnight transition-colors"
              >
                Annonser
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <span className="text-midnight/40 font-medium">{user.account.companyName}</span>
            <LoggUtKnapp />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
