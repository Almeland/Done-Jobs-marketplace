import Anthropic from "@anthropic-ai/sdk";
import { getJobSeekerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const client = new Anthropic();

export type MatchResult = {
  listingId: string;
  score: number;
  tittel: string;
  bedrift: string;
  forklaring: string;
  styrker: string[];
  mangler: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function preFilterByKeyword(listings: any[], cvParsed: string, limit = 10): any[] {
  const cv = cvParsed.toLowerCase();
  const words = cv.match(/\b\w{4,}\b/g) ?? [];
  const scored = listings.map((l) => {
    const haystack = [l.title, l.industry, l.jobCategory, l.location, l.body, l.account.companyName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const hits = words.filter((w: string) => haystack.includes(w)).length;
    return { listing: l, hits };
  });
  scored.sort((a, b) => b.hits - a.hits);
  return scored.slice(0, limit).map((s) => s.listing);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function preFilterByEsco(listings: any[], candidateUris: Set<string>, limit = 10): any[] {
  const scored = listings.map((l) => {
    const listingUris: string[] = (l.skillProfiles ?? []).map(
      (p: { skillUri: string }) => p.skillUri
    );
    const overlap = listingUris.filter((uri) => candidateUris.has(uri)).length;
    return { listing: l, overlap };
  });
  scored.sort((a, b) => b.overlap - a.overlap);
  return scored.slice(0, limit).map((s) => s.listing);
}

export async function POST() {
  const jobSeeker = await getJobSeekerSession();
  if (!jobSeeker) return new Response("Uautorisert", { status: 401 });

  const seeker = await prisma.jobSeeker.findUnique({ where: { id: jobSeeker.id } });
  if (!seeker?.cvParsed) {
    return new Response(JSON.stringify({ error: "Last opp CV først." }), { status: 400 });
  }

  // Hent kandidatens ESCO-profil (finnes dersom CV er analysert etter kompetansebiblioteket ble aktivert)
  const candidateSkills = await prisma.candidateSkillProfile.findMany({
    where: { jobSeekerId: jobSeeker.id },
    select: { skillUri: true },
  });
  const candidateUris = new Set(candidateSkills.map((s) => s.skillUri));
  const useEscoFilter = candidateUris.size > 0;

  const allListings = await prisma.jobListing.findMany({
    where: { status: "ACTIVE" },
    include: {
      account: { select: { companyName: true } },
      // Inkluder skill-profiler kun hvis ESCO-filter brukes
      ...(useEscoFilter ? { skillProfiles: { select: { skillUri: true } } } : {}),
    },
    orderBy: { publishedAt: "desc" },
  });

  if (allListings.length === 0) {
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }

  const listings = useEscoFilter
    ? preFilterByEsco(allListings, candidateUris, 10)
    : preFilterByKeyword(allListings, seeker.cvParsed, 10);

  const stillingerTekst = listings
    .map((l, i) =>
      `[${i + 1}] ID: ${l.id} | ${l.title ?? "?"} | ${l.account.companyName} | ${l.location ?? "?"} | ${l.industry ?? "?"} | ${l.jobCategory ?? "?"}`
    )
    .join("\n");

  const prompt = `Du er en jobbmatcher. Vurder hvor godt kandidaten passer til stillingene.

KANDIDATPROFIL:
${seeker.cvParsed}

AKTIVE STILLINGER (ID | Tittel | Bedrift | Sted | Bransje | Kategori):
${stillingerTekst}

Returner KUN gyldig JSON-array (ingen markdown). Inkluder kun stillinger med score ≥ 40. Sorter etter score synkende. Maks 8 resultater.

[{"listingId":"exact id","score":85,"tittel":"...","bedrift":"...","forklaring":"2-3 setninger på norsk","styrker":["styrke 1","styrke 2"],"mangler":["gap 1"]}]`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const results: MatchResult[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}
