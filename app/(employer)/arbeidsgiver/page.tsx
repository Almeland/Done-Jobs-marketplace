import { requireAuth } from "@/lib/auth";

export default async function ArbeidgiverPage() {
  const user = await requireAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Velkommen, {user.name}
      </h1>
      <p className="text-gray-500">
        Her administrerer du stillingsannonsene dine.
      </p>
    </div>
  );
}
