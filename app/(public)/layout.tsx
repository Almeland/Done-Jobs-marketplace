import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-platinum bg-pearl">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/stillinger" className="font-semibold text-lg text-midnight tracking-tight">
            Done Jobs
          </Link>
          <Link
            href="/logg-inn"
            className="text-sm font-medium text-midnight/60 hover:text-midnight transition-colors"
          >
            For arbeidsgivere
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
