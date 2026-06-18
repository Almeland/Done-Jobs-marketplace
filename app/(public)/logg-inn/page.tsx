import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoggInnSkjema from "./LoggInnSkjema";

export default async function LoggInnPage() {
  const user = await getSession();
  if (user) redirect("/arbeidsgiver");

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-[32px] font-semibold text-midnight mb-2 tracking-tight">Logg inn</h1>
      <p className="text-[16px] text-midnight/50 mb-8">Velkommen tilbake.</p>
      <LoggInnSkjema />
    </div>
  );
}
