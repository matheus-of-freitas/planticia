import { SUPABASE_FUNCTIONS_URL, SUPABASE_HEADERS } from "./config";

interface DiagnosePlantParams {
  imageBase64: string;
  mimeType: string;
  plantName?: string;
  scientificName?: string;
}

interface DiagnosisResult {
  isHealthy: boolean;
  confidence: number;
  diagnosis: string;
  severity: string;
  symptoms: string[];
  causes: string[];
  treatment: {
    immediate: string[];
    ongoing: string[];
    prevention: string[];
  };
  prognosis: string;
  additionalNotes: string;
}

/**
 * Diagnoses plant diseases using AI vision analysis
 * @param params - Image data and plant information
 * @returns Diagnosis result with treatment recommendations
 */
export async function diagnosePlant({
  imageBase64,
  mimeType,
  plantName,
  scientificName,
}: DiagnosePlantParams): Promise<DiagnosisResult> {
  const response = await fetch(
    `${SUPABASE_FUNCTIONS_URL}/diagnose-disease`,
    {
      method: "POST",
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({
        image_base64: imageBase64,
        mime_type: mimeType,
        plant_name: plantName,
        scientific_name: scientificName,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to diagnose plant");
  }

  const data = await response.json();
  return data;
}
