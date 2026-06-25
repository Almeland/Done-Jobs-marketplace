import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoggInnSkjema from "./LoggInnSkjema";

export default async function LoggInnPage() {
  const user = await getSession();
  if (user) redirect("/arbeidsgiver");

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
      </div>
    </>
  );
}
