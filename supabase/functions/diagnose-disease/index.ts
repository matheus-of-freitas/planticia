import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

serve(async (req: Request) => {
  try {
    const { image_base64, mime_type, plant_name, scientific_name } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "Missing image_base64" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mimeType = mime_type || "image/jpeg";
    const plantInfo = plant_name || scientific_name || "planta desconhecida";
    const scientificInfo = scientific_name ? ` (${scientific_name})` : "";

    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const promptText = `You are an expert in phytopathology (plant diseases) and ornamental plant management. Your task is to analyze the provided image of the plant "${plantInfo}${scientificInfo}" and perform a detailed diagnosis.

    **CONTEXT:**
    - Plant: ${plantInfo}${scientificInfo}
    - Location: Brazil (tropical/subtropical climate)
    - Typical environment: Apartment or house

    **REQUIRED ANALYSIS:**
    1. **VISUAL INSPECTION:** Carefully examine leaves, stems, roots (if visible), flowers (if present) looking for:
      - Discoloration (yellowing, brown spots, black spots, white spots)
      - Deformations or wilting
      - Presence of pests (insects, mites, mealybugs, scale insects)
      - Signs of fungal diseases (mold, rot, rust)
      - Signs of water stress (overwatering or underwatering)
      - Nutritional deficiencies
      - Burns (sun, fertilizer)

    2. **DIAGNOSIS:** Based on visual analysis, determine:
      - If the plant is healthy or has problems
      - Which specific problem(s) are affecting the plant
      - The severity of the problem (mild, moderate, severe)

    3. **TREATMENT:** If there are problems, provide:
      - Immediate actions to be taken
      - Specific treatments (preferably organic)
      - Preventive measures to avoid recurrence
      - Prognosis (chances of recovery)

    4. **GENERAL CARE:** Even if the plant is healthy, provide preventive maintenance tips.

    **IMPORTANT:**
    - Be specific and practical in recommendations
    - Use clear and accessible language in Brazilian Portuguese
    - Prioritize homemade and organic solutions when possible
    - If you cannot identify the problem with certainty, indicate the most likely possibilities
    - Consider Brazilian climate and availability of local products

    **ALL TEXT FIELDS MUST BE IN BRAZILIAN PORTUGUESE.**

    Return your response **STRICTLY** as a JSON object with this **EXACT** structure, and **DO NOT** include any other text, markdown, or commentary:
    {
      "isHealthy": true/false,
      "confidence": 0.95,
      "diagnosis": "Main diagnosis in Portuguese",
      "severity": "leve"/"moderada"/"grave"/"nenhuma",
      "symptoms": ["Symptom 1 in Portuguese", "Symptom 2 in Portuguese"],
      "causes": ["Probable cause 1 in Portuguese", "Probable cause 2 in Portuguese"],
      "treatment": {
        "immediate": ["Immediate action 1 in Portuguese", "Immediate action 2 in Portuguese"],
        "ongoing": ["Ongoing treatment 1 in Portuguese", "Ongoing treatment 2 in Portuguese"],
        "prevention": ["Preventive measure 1 in Portuguese", "Preventive measure 2 in Portuguese"]
      },
      "prognosis": "Prognosis description in Portuguese",
      "additionalNotes": "Additional important observations in Portuguese"
    }`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType,
                data: image_base64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || result.text;
    console.log("Gemini diagnosis response:", textResponse?.substring(0, 200));

    if (!textResponse) {
      console.error("Full result:", JSON.stringify(result).substring(0, 500));
      throw new Error("No diagnosis results from Gemini");
    }

    let jsonText = textResponse.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const diagnosisData = JSON.parse(jsonText);

    if (typeof diagnosisData.isHealthy === "undefined") {
      throw new Error("Invalid response format: Missing isHealthy field");
    }

    const formattedResult = {
      isHealthy: diagnosisData.isHealthy || false,
      confidence: diagnosisData.confidence || 0.7,
      diagnosis: diagnosisData.diagnosis || "Análise inconclusiva",
      severity: diagnosisData.severity || "desconhecida",
      symptoms: diagnosisData.symptoms || [],
      causes: diagnosisData.causes || [],
      treatment: {
        immediate: diagnosisData.treatment?.immediate || [],
        ongoing: diagnosisData.treatment?.ongoing || [],
        prevention: diagnosisData.treatment?.prevention || [],
      },
      prognosis: diagnosisData.prognosis || "Prognóstico não disponível",
      additionalNotes: diagnosisData.additionalNotes || "",
    };

    return new Response(JSON.stringify(formattedResult), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error full details:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
