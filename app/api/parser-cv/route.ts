import Anthropic from "@anthropic-ai/sdk";
import { getJobSeekerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

export async function POST(req: Request) {
  const jobSeeker = await getJobSeekerSession();
  if (!jobSeeker) return new Response("Uautorisert", { status: 401 });

  const formData = await req.formData();
  const file = formData.get("cv") as File | null;
  const text = (formData.get("text") as string)?.trim() || null;

  let cvText = text ?? "";
  let messageContent: Anthropic.MessageParam["content"];

  if (file && file.size > 0) {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    messageContent = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      },
      {
        type: "text",
        text: PARSE_PROMPT,
      },
    ];
  } else if (cvText) {
    messageContent = `${PARSE_PROMPT}\n\nCV-tekst:\n${cvText}`;
  } else {
    return new Response(JSON.stringify({ error: "Ingen CV-data mottatt." }), { status: 400 });
  }

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: messageContent }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return new Response(JSON.stringify({ error: "Kunne ikke tolke CV." }), { status: 500 });

  const parsed = JSON.parse(jsonMatch[0]);

  if (file && file.size > 0) {
    cvText = parsed.rawText ?? cvText;
  }

  await prisma.jobSeeker.update({
    where: { id: jobSeeker.id },
    data: { cvText, cvParsed: JSON.stringify(parsed) },
  });

  return new Response(JSON.stringify(parsed), {
    headers: { "Content-Type": "application/json" },
  });
}

const PARSE_PROMPT = `Du er en CV-analysator. Trekk ut strukturert informasjon fra denne CV-en og returner KUN gyldig JSON (ingen markdown, ingen forklaring rundt).

JSON-format:
{
  "navn": "string eller null",
  "roller": ["liste over stillingstitler/roller kandidaten har hatt"],
  "kompetanser": ["tekniske og faglige ferdigheter, verktøy, rammeverk"],
  "bransjer": ["bransjer kandidaten har erfaring fra"],
  "utdanning": ["utdanningsgrad og fagfelt, f.eks. 'Bachelor informatikk'"],
  "erfaring_aar": 5,
  "språk": ["programmeringsspråk eller relevante menneskespråk"],
  "sammendrag": "2-3 setninger om kandidaten på norsk"
}`;
