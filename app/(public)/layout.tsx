import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <Link href="/stillinger" className="font-semibold text-lg text-gray-900">
            Done Jobs
          </Link>
          <Link
            href="/logg-inn"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            For arbeidsgivere
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
