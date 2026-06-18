import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import RegistrerSkjema from "./RegistrerSkjema";

export default async function RegistrerPage() {
  const user = await getSession();
  if (user) redirect("/arbeidsgiver");

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-[32px] font-semibold text-midnight mb-2 tracking-tight">Registrer bedrift</h1>
      <p className="text-[16px] text-midnight/50 mb-8">Opprett en konto for å publisere stillingsannonser.</p>
      <RegistrerSkjema />
    </div>
  );
}
