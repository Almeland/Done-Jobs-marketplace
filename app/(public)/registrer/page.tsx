import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import RegistrerSkjema from "./RegistrerSkjema";

export default async function RegistrerPage() {
  const user = await getSession();
  if (user) redirect("/arbeidsgiver");

  return (
    <>
      <div className="bg-violet-drift px-6 py-12 text-center">
        <h1 className="text-[28px] sm:text-[36px] font-semibold text-white tracking-tight leading-tight mb-2">
          Registrer bedrift
        </h1>
        <p className="text-white/75 text-[16px]">Opprett en konto for å publisere stillingsannonser.</p>
      </div>
      <div className="mx-auto max-w-sm px-6 py-10">
        <RegistrerSkjema />
      </div>
    </>
  );
}
