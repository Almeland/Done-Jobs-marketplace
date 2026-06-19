import Anthropic from "@anthropic-ai/sdk";
import { getJobSeekerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

export async function POST() {
  const jobSeeker = await getJobSeekerSession();
  if (!jobSeeker) return new Response("Uautorisert", { status: 401 });

  const seeker = await prisma.jobSeeker.findUnique({ where: { id: jobSeeker.id } });
  if (!seeker?.cvParsed) {
    return new Response(JSON.stringify({ error: "Last opp CV først." }), { status: 400 });
  }

  const listings = await prisma.jobListing.findMany({
    where: { status: "ACTIVE" },
    include: { account: { select: { companyName: true } } },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  if (listings.length === 0) {
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }

  const stillingerTekst = listings
    .map((l, i) =>
      `[${i + 1}] ID: ${l.id}
Tittel: ${l.title ?? "Ikke oppgitt"}
Bedrift: ${l.account.companyName}
Sted: ${l.location ?? "Ikke oppgitt"}
Bransje: ${l.industry ?? "Ikke oppgitt"}
Kategori: ${l.jobCategory ?? "Ikke oppgitt"}
Annonsetekst: ${(l.body ?? "").replace(/<[^>]+>/g, "").slice(0, 600)}`
    )
    .join("\n\n---\n\n");

  const prompt = `Du er en jobbmatcher. Vurder hvor godt denne kandidaten passer til de listede stillingene.

KANDIDATPROFIL:
${seeker.cvParsed}

AKTIVE STILLINGER:
${stillingerTekst}

Returner KUN gyldig JSON-array (ingen markdown). Inkluder kun stillinger med score ≥ 40. Sorter etter score synkende. Maks 10 resultater.

Format:
[
  {
    "listingId": "exact id from listing",
    "score": 85,
    "tittel": "stillingstittel",
    "bedrift": "bedriftsnavn",
    "forklaring": "2-3 setninger om hvorfor dette er en god match på norsk",
    "styrker": ["konkret styrke 1", "konkret styrke 2"],
    "mangler": ["eventuelt gap 1"]
  }
]`;

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
