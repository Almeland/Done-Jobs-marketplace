import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { loggUtAdmin } from "@/app/actions/admin";

export default async function AdminPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/logg-inn");

  const [seekers, accounts, applications] = await Promise.all([
    prisma.jobSeeker.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        cvParsed: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      where: { vilectDepartmentId: null },
      select: {
        id: true,
        companyName: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
    }),
    prisma.application.findMany({
      orderBy: { submittedAt: "desc" },
      take: 20,
      select: {
        id: true,
        applicantName: true,
        applicantEmail: true,
        submittedAt: true,
        status: true,
        jobListing: { select: { title: true, account: { select: { companyName: true } } } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-pearl">
      <header className="bg-white border-b border-platinum px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-midnight">Admin</h1>
        <form action={loggUtAdmin}>
          <button className="text-sm text-midnight/40 hover:text-midnight transition-colors">
            Logg ut
          </button>
        </form>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* Statistikk */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Jobbsøkere", value: seekers.length },
            { label: "Bedrifter", value: accounts.length },
            { label: "Søknader", value: applications.length },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-platinum rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold text-midnight">{s.value}</p>
              <p className="text-sm text-midnight/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Jobbsøkere */}
        <section>
          <h2 className="text-sm font-semibold text-midnight/60 uppercase tracking-widest mb-4">
            Jobbsøkere ({seekers.length})
          </h2>
          <div className="bg-white border border-platinum rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-platinum">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Navn</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">E-post</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Registrert</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">CV</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Søknader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum">
                {seekers.map((s) => (
                  <tr key={s.id} className="hover:bg-lavender/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-midnight">{s.name}</td>
                    <td className="px-5 py-3 text-midnight/60">{s.email}</td>
                    <td className="px-5 py-3 text-midnight/40">
                      {new Date(s.createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      {s.cvParsed
                        ? <span className="text-xs bg-emerald-brand/10 text-emerald-brand px-2 py-0.5 rounded-full">Lastet opp</span>
                        : <span className="text-xs text-midnight/30">Ingen</span>}
                    </td>
                    <td className="px-5 py-3 text-midnight/60">{s._count.applications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bedrifter */}
        <section>
          <h2 className="text-sm font-semibold text-midnight/60 uppercase tracking-widest mb-4">
            Registrerte bedrifter ({accounts.length})
          </h2>
          <div className="bg-white border border-platinum rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-platinum">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Bedrift</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Registrert</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Stillinger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-lavender/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-midnight">{a.companyName}</td>
                    <td className="px-5 py-3 text-midnight/40">
                      {new Date(a.createdAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-midnight/60">{a._count.listings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Siste søknader */}
        <section>
          <h2 className="text-sm font-semibold text-midnight/60 uppercase tracking-widest mb-4">
            Siste søknader
          </h2>
          <div className="bg-white border border-platinum rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-platinum">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Søker</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Stilling</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Bedrift</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Sendt</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-midnight/40">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum">
                {applications.map((a) => (
                  <tr key={a.id} className="hover:bg-lavender/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-midnight">{a.applicantName}</p>
                      <p className="text-xs text-midnight/40">{a.applicantEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-midnight/70">{a.jobListing.title}</td>
                    <td className="px-5 py-3 text-midnight/40">{a.jobListing.account.companyName}</td>
                    <td className="px-5 py-3 text-midnight/40">
                      {new Date(a.submittedAt).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-platinum text-midnight/60">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
