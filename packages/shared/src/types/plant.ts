export interface IdentifiedPlant {
  species: string;
  commonName?: string;
  confidence: number;
  care: {
    waterIntervalDays: number;
    light: string;
    difficulty: string;
  };
}
