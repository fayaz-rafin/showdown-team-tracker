export interface Team {
  id?: string;
  url?: string;
  teamName: string;
  teamPaste: string;
  format?: string;
  generation?: string;
  strategy?: string;
  keyPokemon?: string[];
  lastUpdated?: string;
  createdTime?: string;
}

export interface TeamFilters {
  format?: string;
  generation?: string;
  strategy?: string;
}

export const FORMAT_OPTIONS = [
  "OU (Overused)",
  "Ubers",
  "UU (Underused)",
  "RU (Rarelyused)",
  "NU (Neverused)",
  "PU",
  "LC (Little Cup)",
  "Doubles OU",
  "VGC",
  "Monotype",
  "Random Battle",
  "Other",
] as const;

export const GENERATION_OPTIONS = [
  "Gen 1",
  "Gen 2",
  "Gen 3",
  "Gen 4",
  "Gen 5",
  "Gen 6",
  "Gen 7",
  "Gen 8",
  "Gen 9",
] as const;

