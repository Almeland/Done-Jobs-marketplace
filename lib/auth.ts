import { redirect } from "next/navigation";
import { getSession, getJobSeekerSession } from "@/lib/session";

export async function requireAuth() {
  const user = await getSession();
  if (!user) redirect("/logg-inn");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") redirect("/arbeidsgiver");
  return user;
}

export async function requireJobSeeker() {
  const jobSeeker = await getJobSeekerSession();
  if (!jobSeeker) redirect("/jobbsoker/logg-inn");
  return jobSeeker;
}
