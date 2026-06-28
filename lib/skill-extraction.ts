import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();
const ESCO_API = "https://ec.europa.eu/esco/api";

type RawSkill = { navn: string; viktig: boolean };

type EscoSearchResult = {
  _embedded?: {
    results?: Array<{
      uri: string;
      className?: string;
      preferredLabel?: Record<string, string>;
    }>;
  };
};

async function callHaikuForSkills(
  title: string,
  body: string
): Promise<{ skills: RawSkill[]; error?: string; raw?: string }> {
  const snippet = body ? body.replace(/<[^>]+>/g, " ").slice(0, 3000) : "";
  const prompt = `Analyser denne stillingsbeskrivelsen og trekk ut de 6-8 viktigste, konkrete kompetansekravene.

Fokuser på:
- Tekniske ferdigheter og verktøy (f.eks. JavaScript, Excel, SAP, AutoCAD)
- Faglig kunnskap (f.eks. regnskapsføring, dataanalyse, prosjektstyring, sykepleiefaglig)
- Metoder og rammeverk (f.eks. Scrum, PRINCE2, Lean)

IKKE inkluder generiske personlige egenskaper som "selvgående", "strukturert" eller "teamplayer".

Stilling: ${title}
${snippet ? `\nBeskrivelse:\n${snippet}` : ""}

Returner KUN gyldig JSON-array, ingen markdown:
[{"navn":"JavaScript","viktig":true},{"navn":"React","viktig":false}]`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return { skills: [], error: "no_json_match", raw: raw.slice(0, 200) };
    try {
      const skills = JSON.parse(match[0]) as RawSkill[];
      return { skills };
    } catch (e) {
      return { skills: [], error: "json_parse_failed", raw: match[0].slice(0, 200) };
    }
  } catch (e) {
    return { skills: [], error: String(e).slice(0, 200) };
  }
}

async function findEscoSkill(
  skillName: string
): Promise<{ uri: string; labelNb: string | null; labelEn: string | null; skillType: string | null } | null> {
  try {
    // ESCO bruker "no" som nøkkel for norsk (ikke "nb")
    const url = `${ESCO_API}/search?text=${encodeURIComponent(skillName)}&language=no&type=skill&full=false&offset=0&limit=3`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as EscoSearchResult;
    const results = data._embedded?.results ?? [];
    if (results.length === 0) return null;

    const hit = results[0];
    return {
      uri: hit.uri,
      labelNb: hit.preferredLabel?.["no"] ?? hit.preferredLabel?.["nb"] ?? null,
      labelEn: hit.preferredLabel?.["en"] ?? null,
      skillType: hit.className ?? null,
    };
  } catch {
    return null;
  }
}

// Diagnostikk-funksjon — brukes kun av ?debug=1 i backfill-ruten
export async function debugExtract(
  jobListingId: string,
  title: string,
  body: string | null
) {
  const haikuResult = await callHaikuForSkills(title, body ?? "");
  const escoResults: Array<{ input: string; uri: string | null; label: string | null }> = [];

  for (const raw of haikuResult.skills) {
    const esco = await findEscoSkill(raw.navn);
    escoResults.push({ input: raw.navn, uri: esco?.uri ?? null, label: esco?.labelNb ?? null });
  }

  return {
    haiku: { skills: haikuResult.skills, error: haikuResult.error, raw: haikuResult.raw },
    esco: escoResults,
    anthropicKeyPresent: !!process.env.ANTHROPIC_API_KEY,
  };
}

export async function extractAndSaveJobSkills(
  jobListingId: string,
  title: string,
  body: string | null
): Promise<number> {
  const { skills: rawSkills } = await callHaikuForSkills(title, body ?? "");
  if (rawSkills.length === 0) return 0;

  let saved = 0;
  for (const raw of rawSkills) {
    const esco = await findEscoSkill(raw.navn);
    if (!esco) continue;

    await prisma.escoSkill.upsert({
      where: { uri: esco.uri },
      update: {},
      create: {
        uri: esco.uri,
        preferredLabelNb: esco.labelNb,
        preferredLabelEn: esco.labelEn,
        skillType: esco.skillType,
      },
    });

    try {
      await prisma.jobSkillProfile.create({
        data: {
          jobListingId,
          skillUri: esco.uri,
          weight: raw.viktig ? 1.0 : 0.5,
          signal: "extracted",
        },
      });
      saved++;
    } catch {
      // @@unique — hopp over duplikat
    }
  }
  return saved;
}

export async function extractAndSaveCandidateSkills(
  jobSeekerId: string,
  cvText: string
): Promise<number> {
  const { skills: rawSkills } = await callHaikuForSkills("CV-analyse", cvText);
  if (rawSkills.length === 0) return 0;

  await prisma.candidateSkillProfile.deleteMany({ where: { jobSeekerId } });

  let saved = 0;
  for (const raw of rawSkills) {
    const esco = await findEscoSkill(raw.navn);
    if (!esco) continue;

    await prisma.escoSkill.upsert({
      where: { uri: esco.uri },
      update: {},
      create: {
        uri: esco.uri,
        preferredLabelNb: esco.labelNb,
        preferredLabelEn: esco.labelEn,
        skillType: esco.skillType,
      },
    });

    try {
      await prisma.candidateSkillProfile.create({
        data: {
          jobSeekerId,
          skillUri: esco.uri,
          confidence: raw.viktig ? 1.0 : 0.6,
        },
      });
      saved++;
    } catch {
      // Duplikat — hopp over
    }
  }
  return saved;
}
