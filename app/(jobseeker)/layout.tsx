import Link from "next/link";
import { getJobSeekerSession } from "@/lib/session";
import { loggUtJobbsoker } from "@/app/actions/jobseeker";
import Logo from "@/components/Logo";

export default async function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jobSeeker = await getJobSeekerSession();

  return (
    <>
      <header className="bg-violet-drift">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/stillinger" className="hover:opacity-80 hover:scale-[1.03] transition-all duration-150 inline-flex">
            <Logo variant="light" size="md" />
          </Link>
          <nav className="flex items-center gap-4">
            {jobSeeker ? (
              <>
                <span className="text-sm text-white/60 hidden sm:block">{jobSeeker.name}</span>
                <Link href="/jobbsoker" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                  Min profil
                </Link>
                <form action={loggUtJobbsoker}>
                  <button type="submit" className="text-sm text-white/50 hover:text-white transition-colors">
                    Logg ut
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/jobbsoker/logg-inn" className="text-sm text-white/70 hover:text-white transition-colors">
                  Logg inn
                </Link>
                <Link
                  href="/jobbsoker/registrer"
                  className="bg-white text-violet rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  Opprett profil
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
