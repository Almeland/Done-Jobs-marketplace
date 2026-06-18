import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/session";

const client = new Anthropic();

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return new Response("Uautorisert", { status: 401 });

  const { title, companyName, location, industry, jobCategory, notes } =
    await req.json();

  const prompt = `Du er en profesjonell stillingsannonseskriver for det norske arbeidsmarkedet.

Skriv en komplett stillingsannonse basert på:

Stillingstittel: ${title || "ikke oppgitt"}
Bedrift: ${companyName}
Sted: ${location || "ikke oppgitt"}
Bransje: ${industry || "ikke oppgitt"}
Stillingskategori: ${jobCategory || "ikke oppgitt"}
${notes ? `\nNotater fra arbeidsgiver:\n${notes}` : ""}

Regler:
- Skriv på norsk bokmål
- Bruk HTML (p, ul, li, strong — ikke h1/h2/h3)
- Struktur: kort innledende avsnitt → <strong>Arbeidsoppgaver</strong> (ul) → <strong>Vi ser etter deg som</strong> (ul) → <strong>Vi tilbyr</strong> (ul)
- Inkluderende språk, ikke «han/hun»
- Engasjerende og direkte tone — unngå klisjeer som «vi er en spennende bedrift»
- 250–380 ord
- Start direkte med innledningsavsnittet, ikke med tittelen`;

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
