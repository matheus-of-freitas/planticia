import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "./config";

interface CareTipsParams {
  plantName?: string;
  scientificName?: string;
}

export interface CareTips {
  plantName: string;
  scientificName: string;
  watering: {
    frequency: string;
    amount: string;
    tips: string[];
  };
  light: {
    requirements: string;
    placement: string;
    tips: string[];
  };
  soil: {
    type: string;
    ph: string;
    drainage: string;
    repotting: string;
    tips: string[];
  };
  fertilizer: {
    type: string;
    frequency: string;
    tips: string[];
  };
  temperature: {
    ideal: string;
    humidity: string;
    tips: string[];
  };
  maintenance: {
    pruning: string;
    cleaning: string;
    tips: string[];
  };
  problems: {
    pests: string[];
    diseases: string[];
    prevention: string[];
  };
  specialTips: string[];
  petSafe: boolean;
  toxicityWarning: string | null;
}

/**
 * Fetches comprehensive care tips for a plant
 * @param params - Plant name and/or scientific name
 * @returns Detailed care tips
 */
export async function getCareTips({
  plantName,
  scientificName,
}: CareTipsParams): Promise<CareTips> {
  const params = new URLSearchParams();
  if (plantName) params.append("plant_name", plantName);
  if (scientificName) params.append("scientific_name", scientificName);

  const headers = await getAuthHeaders();
  const response = await fetch(
    `${SUPABASE_FUNCTIONS_URL}/get-care-tips?${params.toString()}`,
    { headers }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get care tips");
  }

  const data = await response.json();
  return data;
}
