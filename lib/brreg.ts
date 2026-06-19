export type BrregEnhet = {
  navn: string;
  organisasjonsnummer: string;
  antallAnsatte: number | null;
  stiftelsesdato: string | null;
  forretningsadresse: { poststed: string; kommune: string } | null;
  naeringskode1: { beskrivelse: string } | null;
  hjemmeside: string | null;
  organisasjonsform: { beskrivelse: string } | null;
};

export type BrregRegnskap = {
  aar: string;
  omsetning: number | null;
  driftsresultat: number | null;
  aarsresultat: number | null;
};

export async function fetchEnhet(orgNumber: string): Promise<BrregEnhet | null> {
  const clean = orgNumber.replace(/\s/g, "");
  try {
    const res = await fetch(
      `https://data.brreg.no/enhetsregisteret/api/enheter/${clean}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchRegnskap(orgNumber: string): Promise<BrregRegnskap[]> {
  const clean = orgNumber.replace(/\s/g, "");
  try {
    const res = await fetch(
      `https://data.brreg.no/regnskapsregisteret/regnskap/${clean}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data: unknown[] = await res.json();
    return data.slice(0, 3).map((r: unknown) => {
      const reg = r as Record<string, unknown>;
      const periode = (reg.regnskapsperiode as Record<string, string>) ?? {};
      const res_ = (reg.resultatregnskapResultat as Record<string, unknown>) ?? {};
      const drift = (res_.driftsresultat as Record<string, unknown>) ?? {};
      const inntekter = (drift.driftsinntekter as Record<string, number>) ?? {};
      return {
        aar: (periode.fraDato ?? "").slice(0, 4),
        omsetning: inntekter.sumDriftsinntekter ?? null,
        driftsresultat: (drift.driftsresultat as number) ?? null,
        aarsresultat: (res_.aarsresultat as number) ?? null,
      };
    });
  } catch {
    return [];
  }
}
