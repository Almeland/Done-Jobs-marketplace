import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import RegistrerSkjema from "./RegistrerSkjema";

export default async function RegistrerPage() {
  const user = await getSession();
  if (user) redirect("/arbeidsgiver");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Registrer bedrift
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Opprett en konto for å publisere stillingsannonser.
      </p>
      <RegistrerSkjema />
    </div>
  );
}
