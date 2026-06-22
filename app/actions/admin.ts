"use server";

import { redirect } from "next/navigation";
import { createAdminSession, clearAdminSession } from "@/lib/session";

type ActionState = { error: string } | null;

export async function loggInnAdmin(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) return { error: "Admin-passord er ikke konfigurert." };
  if (password !== adminPassword) return { error: "Feil passord." };

  await createAdminSession();
  redirect("/admin");
}

export async function loggUtAdmin() {
  await clearAdminSession();
  redirect("/admin/logg-inn");
}
