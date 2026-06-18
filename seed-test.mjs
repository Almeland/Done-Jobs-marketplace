import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.resolve(__dirname, "dev.db"));

function cuid() {
  return "c" + crypto.randomBytes(11).toString("hex");
}

const now = new Date().toISOString();
const expires = new Date(Date.now() + 60 * 86_400_000).toISOString();

// Find existing account + user
let account = db.prepare("SELECT * FROM Account LIMIT 1").get();
let user;

if (!account) {
  const accountId = cuid();
  db.prepare("INSERT INTO Account (id, companyName, createdAt) VALUES (?, ?, ?)").run(accountId, "Testbedrift AS", now);
  account = { id: accountId };

  const userId = cuid();
  // bcrypt hash of "passord123" (cost 10) — pre-computed
  const hash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  db.prepare("INSERT INTO User (id, accountId, name, email, passwordHash, role, isOwner, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(userId, accountId, "Test Bruker", "test@test.no", hash, "USER", 1, now);
  user = { id: userId };
  console.log("Opprettet konto: test@test.no / passord123");
} else {
  user = db.prepare("SELECT * FROM User WHERE accountId = ? LIMIT 1").get(account.id);
}

const listings = [
  {
    title: "Fullstack-utvikler",
    body: "<p>Vi ser etter en erfaren fullstack-utvikler til å jobbe med moderne webapplikasjoner i React og Node.js.</p><p>Du vil jobbe tett med produktteamet og bidra til å bygge skalerbare løsninger.</p>",
    location: "Oslo",
    industry: "IT og teknologi",
    jobCategory: "Utvikling og programmering",
    contactName: "Lene Andersen",
    contactTitle: "Engineering Manager",
    contactEmail: "lene@testbedrift.no",
    receiptMethod: "EMAIL",
    receiptEmail: "jobb@testbedrift.no",
    applicationDeadline: "2026-08-01T00:00:00.000Z",
  },
  {
    title: "UX Designer",
    body: "<p>Er du opptatt av brukeropplevelse og vil jobbe i et tverrfaglig team? Vi søker en UX Designer som kan hjelpe oss å lage intuitiv og vakker design.</p>",
    location: "Bergen",
    industry: "IT og teknologi",
    jobCategory: "Design og UX",
    contactName: "Marius Holm",
    contactTitle: "Head of Design",
    contactEmail: "marius@testbedrift.no",
    receiptMethod: "EMAIL",
    receiptEmail: "design@testbedrift.no",
    applicationDeadline: "2026-07-15T00:00:00.000Z",
  },
  {
    title: "Regnskapsfører",
    body: "<p>Søker dyktig regnskapsfører til å håndtere månedlig regnskapsføring, MVA-rapportering og årsavslutning for våre kunder.</p>",
    location: "Trondheim",
    industry: "Bank, finans og forsikring",
    jobCategory: "Økonomi og regnskap",
    contactName: "Silje Berg",
    contactTitle: "Daglig leder",
    contactEmail: "silje@testbedrift.no",
    receiptMethod: "EMAIL",
    receiptEmail: "regnskap@testbedrift.no",
    applicationDeadline: "2026-07-31T00:00:00.000Z",
  },
  {
    title: "Sykepleier – nattevakt",
    body: "<p>Vi søker autorisert sykepleier til nattevakt ved vår avdeling. Gode betingelser og fleksibel turnus.</p>",
    location: "Oslo",
    industry: "Helse og omsorg",
    jobCategory: "Drift og vedlikehold",
    contactName: "Kari Nilsen",
    contactTitle: "Avdelingsleder",
    contactEmail: "kari@testbedrift.no",
    receiptMethod: "EMAIL",
    receiptEmail: "helse@testbedrift.no",
    applicationDeadline: "2026-07-20T00:00:00.000Z",
  },
  {
    title: "Prosjektleder bygg",
    body: "<p>Erfaren prosjektleder søkes til å lede spennende byggeprosjekter i Stavanger-regionen. Ansvar for fremdrift, økonomi og kvalitet.</p>",
    location: "Stavanger",
    industry: "Bygg og anlegg",
    jobCategory: "Prosjektledelse",
    contactName: "Tor Eriksen",
    contactTitle: "Prosjektdirektør",
    contactEmail: "tor@testbedrift.no",
    receiptMethod: "EMAIL",
    receiptEmail: "bygg@testbedrift.no",
    applicationDeadline: "2026-08-15T00:00:00.000Z",
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO JobListing
    (id, accountId, createdById, title, body, location, industry, jobCategory,
     contactName, contactTitle, contactEmail, receiptMethod, receiptEmail,
     applicationDeadline, status, firstPublishedAt, publishedAt, expiresAt,
     viewCount, applyClickCount, createdAt, updatedAt)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, 0, 0, ?, ?)
`);

let created = 0;
for (const l of listings) {
  const id = cuid();
  const result = insert.run(
    id, account.id, user.id, l.title, l.body, l.location, l.industry, l.jobCategory,
    l.contactName, l.contactTitle, l.contactEmail, l.receiptMethod, l.receiptEmail,
    l.applicationDeadline, now, now, expires, now, now
  );
  if (result.changes) created++;
}

console.log(`Opprettet ${created} testannonser.`);
db.close();
