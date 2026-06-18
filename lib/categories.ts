export const INDUSTRIES = [
  "Bank, finans og forsikring",
  "Bygg og anlegg",
  "Eiendom",
  "Handel og butikk",
  "Helse og omsorg",
  "Industri og produksjon",
  "IT og teknologi",
  "Jus og compliance",
  "Media og kommunikasjon",
  "Offentlig sektor",
  "Reiseliv og servering",
  "Salg og markedsføring",
  "Transport og logistikk",
  "Utdanning og forskning",
] as const;

export const JOB_CATEGORIES = [
  "Administrasjon",
  "Design og UX",
  "Drift og vedlikehold",
  "Forskning og analyse",
  "HR og personal",
  "Ingeniør og teknikk",
  "Kundeservice og support",
  "Ledelse og strategi",
  "Markedsføring",
  "Økonomi og regnskap",
  "Prosjektledelse",
  "Salg og kunderelasjoner",
  "Utvikling og programmering",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type JobCategory = (typeof JOB_CATEGORIES)[number];
