import Link from "next/link";
import { getJobSeekerSession } from "@/lib/session";
import { loggUtJobbsoker } from "@/app/actions/jobseeker";
import Logo from "@/components/Logo";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seeker = await getJobSeekerSession();

  return (
    <>
      <header className="bg-violet-drift">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/stillinger" className="hover:opacity-80 hover:scale-[1.03] transition-all duration-150 inline-flex">
              <Logo variant="light" size="md" />
            </Link>
            <Link href="/bedrifter" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors">
              Bedrifter
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {seeker ? (
              <>
                <Link href="/jobbsoker" className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors">
                  Mine søknader ({seeker.name.split(" ")[0]})
                </Link>
                <Link href="/jobbsoker" className="sm:hidden text-sm font-medium text-white/80 hover:text-white transition-colors">
                  Min side
                </Link>
                <form action={loggUtJobbsoker}>
                  <button type="submit" className="hidden sm:block text-sm text-white/50 hover:text-white transition-colors">
                    Logg ut
                  </button>
                </form>
              </>
            ) : (
              <Link href="/jobbsoker/logg-inn" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                Min profil
              </Link>
            )}
            <Link href="/logg-inn" className="text-sm font-medium bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
              <span className="hidden sm:inline">For arbeidsgivere</span>
              <span className="sm:hidden">Bedrift</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
