import { redirect } from "next/navigation";
import { getJobSeekerSession } from "@/lib/session";
import LoggInnSkjema from "./LoggInnSkjema";
import Link from "next/link";

export default async function LoggInnJobbsokerPage() {
  const js = await getJobSeekerSession();
  if (js) redirect("/jobbsoker");

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-[32px] font-semibold text-midnight mb-2 tracking-tight">Logg inn</h1>
      <p className="text-[16px] text-midnight/50 mb-8">Velkommen tilbake.</p>
      <LoggInnSkjema />
      <p className="text-sm text-midnight/40 mt-6 text-center">
        Ny bruker?{" "}
        <Link href="/jobbsoker/registrer" className="text-violet hover:text-violet/80 font-medium">Opprett profil</Link>
      </p>
    </div>
  );
}
