import Link from "next/link";
import { getJobSeekerSession } from "@/lib/session";
import { loggUtJobbsoker } from "@/app/actions/jobseeker";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seeker = await getJobSeekerSession();

  return (
    <>
      <header className="border-b border-platinum bg-pearl">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/stillinger" className="font-semibold text-lg text-midnight tracking-tight">
              Done Jobs
            </Link>
            <Link href="/bedrifter" className="text-sm text-midnight/50 hover:text-midnight transition-colors">
              Bedrifter
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {seeker ? (
              <>
                <Link href="/jobbsoker" className="text-sm font-medium text-midnight/70 hover:text-midnight transition-colors">
                  Mine søknader ({seeker.name.split(" ")[0]})
                </Link>
                <form action={loggUtJobbsoker}>
                  <button type="submit" className="text-sm text-midnight/40 hover:text-midnight transition-colors">
                    Logg ut
                  </button>
                </form>
              </>
            ) : (
              <Link href="/jobbsoker/logg-inn" className="text-sm font-medium text-violet hover:text-violet/80 transition-colors">
                Min profil
              </Link>
            )}
            <Link href="/logg-inn" className="text-sm font-medium text-midnight/60 hover:text-midnight transition-colors">
              For arbeidsgivere
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
