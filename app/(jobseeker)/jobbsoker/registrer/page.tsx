import { redirect } from "next/navigation";
import { getJobSeekerSession } from "@/lib/session";
import RegistrerSkjema from "./RegistrerSkjema";
import Link from "next/link";

export default async function RegistrerJobbsokerPage() {
  const js = await getJobSeekerSession();
  if (js) redirect("/jobbsoker");

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-[32px] font-semibold text-midnight mb-2 tracking-tight">Opprett profil</h1>
      <p className="text-[16px] text-midnight/50 mb-8">Følg bedrifter, sett opp varsler og hold oversikt over søknadene dine.</p>
      <RegistrerSkjema />
      <p className="text-sm text-midnight/40 mt-6 text-center">
        Har du allerede en konto?{" "}
        <Link href="/jobbsoker/logg-inn" className="text-violet hover:text-violet/80 font-medium">Logg inn</Link>
      </p>
    </div>
  );
}
