import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

serve(async (req: Request) => {
  try {
    const { image_base64, mime_type } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "Missing image_base64" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mimeType = mime_type || "image/jpeg";

    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const promptText = `You are a highly specialized botanical Computer Vision model. Your primary function is to perform a detailed morphological analysis of the plant in the image and provide the correct taxonomic identification.

    **ABSOLUTE RULE:** Treat this image as a **NEW, UNCATALOGED** specimen. Do not bias your identification towards previously analyzed plants or common household plants unless the visual evidence is 100% matching.

    **STRICT PROCESS:**
    1.  **MORPHOLOGY ANALYSIS:** Analyze the leaf shape (succulent, thick, vertical, pointed), the coloration (patterns, stripes), and the growth pattern.
    2.  **IDENTIFICATION PRIORITY:** Based on the morphological data, determine the most likely scientific name.
    3.  **EXCLUSION RULE:** Be careful distinguishing between similar genera (e.g., Dracaena vs. Sansevieria vs. Chlorophytum). Use visual evidence.
    4.  **CARE & CONFIDENCE:** Provide the required care details and confidence score based ONLY on the visual identification confirmed.
    5.  **WATERING:** Estimate the watering interval in days conservatively (to avoid root rot).

    Return your response **STRICTLY** as a JSON object with this **EXACT** structure, and **DO NOT** include any other text, markdown, or commentary:
    {
      "species": "Genus species", # In Brazilian Portuguese
      "commonName": "Nome comum", # In Brazilian Portuguese
      "confidence": 0.99,
      "wateringIntervalDays": 14, # Integer number of days. Use Rio de Janeiro climate as reference.
      "lightPreference": "luz indireta", # e.g., "luz direta", "luz indireta", "sombra", etc.
      "description": "Descrição dos cuidados..." # In Brazilian Portuguese
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
    console.log("Gemini response:", textResponse?.substring(0, 200));

    if (!textResponse) {
      console.error("Full result:", JSON.stringify(result).substring(0, 500));
      throw new Error("No identification results from Gemini");
    }

    let jsonText = textResponse.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const plantData = JSON.parse(jsonText);

    if (!plantData.species) {
      throw new Error("Invalid response format: Missing species");
    }

    const formattedResult = {
      species: plantData.species,
      commonName: plantData.commonName || "Desconhecida",
      confidence: plantData.confidence || 0,
      wateringIntervalDays: plantData.wateringIntervalDays || 7,
      lightPreference: plantData.lightPreference || "medium",
      description: plantData.description || "Sem descrição disponível.",
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
