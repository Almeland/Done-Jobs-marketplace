import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

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
