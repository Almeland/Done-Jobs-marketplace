import Link from "next/link";

export default function BekreftetPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="w-14 h-14 bg-emerald-brand/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-7 h-7 text-emerald-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-[32px] font-semibold text-midnight mb-3 tracking-tight">
        Søknad sendt.
      </h1>
      <p className="text-[16px] text-midnight/50 mb-10">
        Vi har mottatt søknaden din og vil ta kontakt om den er aktuell.
      </p>
      <Link
        href="/stillinger"
        className="inline-block bg-midnight text-pearl rounded-full px-6 py-3 text-sm font-medium hover:bg-midnight/90 transition-colors"
      >
        Se flere ledige stillinger
      </Link>
    </div>
  );
}
