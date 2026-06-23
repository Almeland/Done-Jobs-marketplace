/**
 * Enrichment script — run: node scripts/berik-bedrifter.mjs
 * 1. Looks up orgNumber via Brønnøysund (tries parent company name)
 * 2. Generates AI description for every account missing one
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve } from "path";
import Anthropic from "@anthropic-ai/sdk";

// Load .env and .env.local
function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(resolve(process.cwd(), file), "utf8")
        .split("\n")
        .filter((l) => l.includes("=") && !l.startsWith("#"))
        .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
    );
  } catch { return {}; }
}
const envVars = { ...loadEnv(".env"), ...loadEnv(".env.local") };

const TURSO_URL = envVars.TURSO_DATABASE_URL;
const TURSO_TOKEN = envVars.TURSO_AUTH_TOKEN;
const ANTHROPIC_KEY = envVars.ANTHROPIC_API_KEY;

if (!ANTHROPIC_KEY) { console.error("Missing ANTHROPIC_API_KEY in .env"); process.exit(1); }

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const ai = new Anthropic({ apiKey: ANTHROPIC_KEY });

// --- Brønnøysund lookup ---

// Strip location/department suffixes to get the legal entity name
function extractParentName(name) {
  const variants = [name];

  // Remove content after comma
  if (name.includes(",")) variants.push(name.split(",")[0].trim());

  // Remove content in parentheses
  variants.push(name.replace(/\s*\(.*?\)/, "").trim());

  // Remove known location words at the end
  const locationWords = [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø", "Bodø", "Tønsberg",
    "Drammen", "Kristiansand", "Ålesund", "Gardermoen", "Finnsnes", "Notodden",
    "Stord", "Orkanger", "Lagunen", "Innlandet", "Romerike", "Vestland",
    "Jærhagen", "Nesttun", "Rykkinn", "Voss", "Xhibition", "Ørsta",
    "Skadesenter", "Forvaltning", "Salgssenter",
  ];
  for (const word of locationWords) {
    const re = new RegExp(`\\s+${word}$`, "i");
    const cleaned = name.replace(re, "").trim();
    if (cleaned !== name && cleaned.length > 3) variants.push(cleaned);
  }

  // Remove "avdeling ...", "avd. ...", "/ ..." suffixes
  variants.push(name.replace(/\s+(avdeling|avd\.|\/)\s+.*/i, "").trim());

  // Try adding AS if missing
  const last = variants[variants.length - 1];
  if (!/\bas\b/i.test(last)) variants.push(last + " AS");

  return [...new Set(variants.filter((v) => v.length > 3))];
}

async function lookupOrgNumber(name) {
  if (!name || /^\d+$/.test(name.trim()) || name.trim().length < 4) return null;

  const variants = extractParentName(name);
  for (const variant of variants) {
    try {
      const encoded = encodeURIComponent(variant);
      const res = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encoded}&size=5`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const enheter = data?._embedded?.enheter ?? [];
      const match = enheter.find(
        (e) => e.navn?.toLowerCase() === variant.toLowerCase()
      );
      if (match) {
        console.log(`  ✓ Brreg: "${name}" → ${match.organisasjonsnummer} (via "${variant}")`);
        return match.organisasjonsnummer;
      }
    } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

// --- AI description ---

async function generateDescription(companyName, jobTitles, naering) {
  const context = [
    `Bedrift: ${companyName}`,
    naering ? `Bransje/næring: ${naering}` : null,
    jobTitles.length > 0 ? `Aktive stillinger: ${jobTitles.slice(0, 5).join(", ")}` : null,
  ].filter(Boolean).join("\n");

  const msg = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Skriv en kort og profesjonell bedriftsbeskrivelse på 2-3 setninger på norsk. Vær konkret om hva bedriften gjør. Ikke bruk klisjeer. Returner KUN beskrivelsen, ingen overskrift eller ekstra tekst.

${context}`,
    }],
  });

  return msg.content[0].type === "text" ? msg.content[0].text.trim() : null;
}

// --- Main ---

async function main() {
  console.log("Berikner Vilect-bedrifter...\n");

  const result = await db.execute(
    `SELECT id, companyName, orgNumber, description FROM Account WHERE vilectDepartmentId IS NOT NULL ORDER BY companyName`
  );

  const accounts = result.rows.map((r) => ({
    id: String(r[0]),
    companyName: String(r[1] ?? ""),
    orgNumber: r[2] ? String(r[2]) : null,
    description: r[3] ? String(r[3]) : null,
  }));

  console.log(`${accounts.length} Vilect-bedrifter\n`);

  let orgFound = 0, orgFailed = 0, descGenerated = 0;

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    console.log(`[${i + 1}/${accounts.length}] ${account.companyName}`);

    let orgNumber = account.orgNumber;
    let description = account.description;
    let naering = null;

    // 1. OrgNumber lookup
    if (!orgNumber) {
      orgNumber = await lookupOrgNumber(account.companyName);
      if (orgNumber) {
        orgFound++;
        try {
          const r = await fetch(
            `https://data.brreg.no/enhetsregisteret/api/enheter/${orgNumber}`,
            { headers: { Accept: "application/json" } }
          );
          if (r.ok) {
            const d = await r.json();
            naering = d.naeringskode1?.beskrivelse ?? null;
          }
        } catch {}
      } else {
        orgFailed++;
      }
    }

    // 2. AI description
    if (!description) {
      const titlesRes = await db.execute(
        `SELECT title FROM JobListing WHERE accountId = ? AND status = 'ACTIVE' AND title IS NOT NULL LIMIT 5`,
        [account.id]
      );
      const jobTitles = titlesRes.rows.map((r) => String(r[0])).filter(Boolean);

      try {
        description = await generateDescription(account.companyName, jobTitles, naering);
        if (description) {
          descGenerated++;
          console.log(`  ✓ Beskrivelse: ${description.slice(0, 90)}…`);
        }
      } catch (e) {
        console.log(`  ✗ AI-feil: ${e.message}`);
      }
    }

    // 3. Update DB
    const updates = [];
    const values = [];
    if (orgNumber && orgNumber !== account.orgNumber) {
      updates.push("orgNumber = ?");
      values.push(orgNumber);
    }
    if (description && description !== account.description) {
      updates.push("description = ?");
      values.push(description);
    }
    if (updates.length > 0) {
      values.push(account.id);
      await db.execute(`UPDATE Account SET ${updates.join(", ")} WHERE id = ?`, values);
    }
  }

  console.log(`\n✅ Ferdig!`);
  console.log(`   orgNumber funnet: ${orgFound}`);
  console.log(`   orgNumber ikke funnet: ${orgFailed}`);
  console.log(`   beskrivelser generert: ${descGenerated}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
