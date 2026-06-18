import Link from "next/link";

export default function BekreftetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="text-4xl mb-4">✓</div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">
        Søknad sendt!
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Vi har mottatt søknaden din og vil ta kontakt om den er aktuell.
      </p>
      <Link
        href="/stillinger"
        className="text-sm text-blue-600 hover:underline"
      >
        Se flere ledige stillinger
      </Link>
    </div>
  );
}
