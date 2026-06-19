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
    take: 20,
  });

  if (listings.length === 0) {
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }

  const stillingerTekst = listings
    .map((l, i) =>
      `[${i + 1}] id:${l.id} | ${l.title ?? "?"} | ${l.account.companyName} | ${l.location ?? "?"} | ${l.industry ?? "?"} | ${l.jobCategory ?? "?"}`
    )
    .join("\n");

  const prompt = `Match kandidat mot stillinger. Svar KUN med JSON-array, ingen markdown.

KANDIDAT: ${seeker.cvParsed}

STILLINGER (id|tittel|bedrift|sted|bransje|kategori):
${stillingerTekst}

Returner maks 8 stillinger med score≥40, sortert synkende. Format:
[{"listingId":"id","score":85,"tittel":"...","bedrift":"...","forklaring":"1-2 setninger","styrker":["..."],"mangler":["..."]}]`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const results: MatchResult[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}
