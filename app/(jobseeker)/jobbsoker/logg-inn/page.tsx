import { redirect } from "next/navigation";
import { getJobSeekerSession } from "@/lib/session";
import LoggInnSkjema from "./LoggInnSkjema";
import Link from "next/link";

export default async function LoggInnJobbsokerPage() {
  const js = await getJobSeekerSession();
  if (js) redirect("/jobbsoker");

  return (
    <>
      <div className="bg-violet-drift px-6 py-12 text-center">
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-white tracking-tight leading-tight mb-2">
          Logg inn
        </h1>
        <p className="text-white/75 text-[16px]">Velkommen tilbake.</p>
      </div>
      <div className="mx-auto max-w-sm px-6 py-10">
        <LoggInnSkjema />
        <p className="text-sm text-midnight/40 mt-6 text-center">
          Ny bruker?{" "}
          <Link href="/jobbsoker/registrer" className="text-violet hover:text-violet/80 font-medium">Opprett profil</Link>
        </p>
      </div>
    </>
  );
}
