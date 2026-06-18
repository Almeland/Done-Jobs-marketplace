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
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/arbeidsgiver" className="font-semibold text-lg text-gray-900">
              Done Jobs
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/arbeidsgiver"
                className="text-gray-600 hover:text-gray-900"
              >
                Oversikt
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">{user.account.companyName}</span>
            <LoggUtKnapp />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
