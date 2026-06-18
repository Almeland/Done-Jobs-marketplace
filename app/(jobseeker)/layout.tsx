import Link from "next/link";
import { getJobSeekerSession } from "@/lib/session";
import { loggUtJobbsoker } from "@/app/actions/jobseeker";

export default async function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jobSeeker = await getJobSeekerSession();

  return (
    <>
      <header className="border-b border-platinum bg-pearl">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/stillinger" className="font-semibold text-lg text-midnight tracking-tight">
            Done Jobs
          </Link>
          <nav className="flex items-center gap-4">
            {jobSeeker ? (
              <>
                <span className="text-sm text-midnight/50 hidden sm:block">{jobSeeker.name}</span>
                <Link href="/jobbsoker" className="text-sm font-medium text-midnight/60 hover:text-midnight transition-colors">
                  Min profil
                </Link>
                <form action={loggUtJobbsoker}>
                  <button type="submit" className="text-sm text-midnight/50 hover:text-midnight transition-colors">
                    Logg ut
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/jobbsoker/logg-inn" className="text-sm text-midnight/60 hover:text-midnight transition-colors">
                  Logg inn
                </Link>
                <Link
                  href="/jobbsoker/registrer"
                  className="bg-midnight text-pearl rounded-full px-4 py-2 text-sm font-medium hover:bg-midnight/90 transition-colors"
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
