import { unfollowCompany } from "@/app/actions/alerts";
import Link from "next/link";

export default async function AvsluttBedriftsfølgingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <Message error="Ugyldig avmeldingslenke." />;
  }

  const result = await unfollowCompany(token);

  if ("error" in result) {
    return <Message error={result.error} />;
  }

  return (
    <Message success="Du følger ikke lenger denne bedriften. Du vil ikke motta flere varsler." />
  );
}

function Message({ success, error }: { success?: string; error?: string }) {
  return (
    <div className="mx-auto max-w-sm px-6 py-24 text-center">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 ${success ? "bg-emerald-brand/10" : "bg-red-brand/10"}`}>
        <span className={`text-2xl ${success ? "text-emerald-brand" : "text-red-brand"}`}>
          {success ? "✓" : "✕"}
        </span>
      </div>
      <p className="text-[16px] text-midnight mb-8">{success ?? error}</p>
      <Link
        href="/stillinger"
        className="inline-block bg-midnight text-pearl rounded-full px-6 py-3 text-sm font-medium hover:bg-midnight/90 transition-colors"
      >
        Se ledige stillinger
      </Link>
    </div>
  );
}
