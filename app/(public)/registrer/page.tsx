import Link from "next/link";

export default function RegistrerPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        Registrer bedrift
      </h1>
      <p className="text-sm text-gray-500 mt-6">
        Har du allerede konto?{" "}
        <Link href="/logg-inn" className="text-blue-600 hover:underline">
          Logg inn
        </Link>
      </p>
    </div>
  );
}
