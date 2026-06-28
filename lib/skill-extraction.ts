import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();
const ESCO_API = "https://ec.europa.eu/esco/api";

type RawSkill = { navn: string; viktig: boolean };

type EscoSearchResult = {
  _embedded?: {
    results?: Array<{
      uri: string;
      title?: string;
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
  const prompt = `Extract the 5-8 most important, concrete skill requirements from this job listing.

Rules:
- Use SHORT, standard skill names (1-3 words). Good: "JavaScript", "project management", "SQL". Bad: "experience with frontend architecture and REST APIs".
- Prefer internationally recognized terms that appear in European skill databases (ESCO).
- Do NOT include generic personal traits like "team player", "structured", "self-driven".
- Use English skill names unless the skill is uniquely Norwegian (e.g. "reindrift").

Job title: ${title}
${snippet ? `\nDescription:\n${snippet}` : ""}

Return ONLY a valid JSON array, no markdown:
[{"navn":"JavaScript","viktig":true},{"navn":"project management","viktig":false}]`;

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

// Relevansfilter:
// - Enkeltords-input (f.eks. "React"): ESCO-tittelen må være ≤2 ord
//   → avviser "react to crisis situations" men godtar "React" / "JavaScript"
// - Flerfords-input (f.eks. "project management"): tittel må være ≤5 ord
// - Krev ≥50 % ordoverlepp mellom input og tittel
function isRelevantMatch(input: string, escoTitle: string | null): boolean {
  if (!escoTitle) return false;
  const titleWords = escoTitle.toLowerCase().split(/\W+/).filter(Boolean);
  const inputWords = input.toLowerCase().split(/\W+/).filter((w) => w.length > 1);
  if (inputWords.length === 0) return false;

  const maxTitleLen = inputWords.length === 1 ? 2 : 5;
  if (titleWords.length > maxTitleLen) return false;

  const overlap = inputWords.filter((w) => titleWords.includes(w)).length;
  return overlap / inputWords.length >= 0.5;
}

async function findEscoSkill(
  skillName: string
): Promise<{ uri: string; labelNb: string | null; labelEn: string | null; skillType: string | null } | null> {
  try {
    // Søk i engelsk — ESCO har bedre dekning på engelsk
    const url = `${ESCO_API}/search?text=${encodeURIComponent(skillName)}&language=en&type=skill&full=false&offset=0&limit=5`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as EscoSearchResult;
    const results = data._embedded?.results ?? [];
    if (results.length === 0) return null;

    // Finn første treff med relevant tittel (avvis semantiske feilmatcher)
    for (const hit of results) {
      const escoTitle = hit.title ?? hit.preferredLabel?.["en"] ?? null;
      if (!isRelevantMatch(skillName, escoTitle)) continue;
      return {
        uri: hit.uri,
        labelNb: hit.preferredLabel?.["no"] ?? hit.preferredLabel?.["nb"] ?? null,
        labelEn: escoTitle,
        skillType: hit.className ?? null,
      };
    }
    return null;
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
