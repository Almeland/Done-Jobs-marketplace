export const APPLICATION_STATUSES = [
  { value: "INNSENDT", label: "Innsendt", color: "bg-platinum text-midnight/60" },
  { value: "UNDER_VURDERING", label: "Under vurdering", color: "bg-violet/10 text-violet" },
  { value: "INNKALT", label: "Innkalt til intervju", color: "bg-amber-brand/10 text-amber-brand" },
  { value: "TILBUDT", label: "Fått tilbud", color: "bg-emerald-brand/10 text-emerald-brand" },
  { value: "AVSLATT", label: "Avslått", color: "bg-red-brand/10 text-red-brand" },
] as const;
