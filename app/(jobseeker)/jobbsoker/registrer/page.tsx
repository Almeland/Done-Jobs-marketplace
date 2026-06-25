import { redirect } from "next/navigation";
import { getJobSeekerSession } from "@/lib/session";
import RegistrerSkjema from "./RegistrerSkjema";
import Link from "next/link";

export default async function RegistrerJobbsokerPage() {
  const js = await getJobSeekerSession();
  if (js) redirect("/jobbsoker");

  return (
    <>
      <div className="bg-violet-drift px-6 py-12 text-center">
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-white tracking-tight leading-tight mb-2">
          Opprett profil
        </h1>
        <p className="text-white/75 text-[16px]">
          Last opp CV og bli matchet med relevante stillinger.
        </p>
      </div>

      <div className="mx-auto max-w-sm px-6 py-10">
        <RegistrerSkjema />
        <p className="text-sm text-midnight/40 mt-6 text-center">
          Har du allerede en konto?{" "}
          <Link href="/jobbsoker/logg-inn" className="text-violet hover:text-violet/80 font-medium">Logg inn</Link>
        </p>
      </div>
    </>
  );
}
