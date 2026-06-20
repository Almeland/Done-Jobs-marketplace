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

function preFilter(listings: typeof allListings, cvParsed: string, limit = 8) {
  const cv = cvParsed.toLowerCase();
  const scored = listings.map((l) => {
    const haystack = [l.title, l.industry, l.jobCategory, l.location, l.body]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const words = cv.match(/\b\w{4,}\b/g) ?? [];
    const hits = words.filter((w) => haystack.includes(w)).length;
    return { listing: l, hits };
  });
  scored.sort((a, b) => b.hits - a.hits);
  return scored.slice(0, limit).map((s) => s.listing);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type allListings = any;

export async function POST() {
  const jobSeeker = await getJobSeekerSession();
  if (!jobSeeker) return new Response("Uautorisert", { status: 401 });

  const seeker = await prisma.jobSeeker.findUnique({ where: { id: jobSeeker.id } });
  if (!seeker?.cvParsed) {
    return new Response(JSON.stringify({ error: "Last opp CV først." }), { status: 400 });
  }

  const allListings = await prisma.jobListing.findMany({
    where: { status: "ACTIVE" },
    include: { account: { select: { companyName: true } } },
    orderBy: { publishedAt: "desc" },
  });

  if (allListings.length === 0) {
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }

  const listings = preFilter(allListings, seeker.cvParsed, 8);

  const stillingerTekst = listings
    .map((l, i) =>
      `[${i + 1}] id:${l.id} | ${l.title ?? "?"} | ${l.account.companyName} | ${l.industry ?? "?"} | ${l.jobCategory ?? "?"}`
    )
    .join("\n");

  const kandidat = (() => {
    try {
      const p = JSON.parse(seeker.cvParsed);
      return `Roller: ${p.roller?.join(", ")}. Kompetanser: ${p.kompetanser?.join(", ")}. Erfaring: ${p.erfaring_aar} år. Bransjer: ${p.bransjer?.join(", ")}.`;
    } catch {
      return seeker.cvParsed.slice(0, 400);
    }
  })();

  const prompt = `Match kandidat mot stillinger. Svar KUN med JSON-array.

KANDIDAT: ${kandidat}

STILLINGER:
${stillingerTekst}

Format (maks 8, score≥40, sortert synkende):
[{"listingId":"id","score":85,"tittel":"...","bedrift":"...","forklaring":"1-2 setninger på norsk","styrker":["..."],"mangler":["..."]}]`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const results: MatchResult[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}
