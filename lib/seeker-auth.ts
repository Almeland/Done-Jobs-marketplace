import { redirect } from "next/navigation";
import { getJobSeekerSession } from "./session";

export async function requireSeeker() {
  const seeker = await getJobSeekerSession();
  if (!seeker) redirect("/jobbsøker/logg-inn");
  return seeker;
}
