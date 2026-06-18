import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoggInnSkjema from "./LoggInnSkjema";

export default async function LoggInnPage() {
  const user = await getSession();
  if (user) redirect("/arbeidsgiver");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Logg inn</h1>
      <p className="text-sm text-gray-500 mb-8">
        Velkommen tilbake.
      </p>
      <LoggInnSkjema />
    </div>
  );
}
