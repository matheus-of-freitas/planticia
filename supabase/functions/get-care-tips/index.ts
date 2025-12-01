import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { GoogleGenAI } from "npm:@google/genai";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const plantName = url.searchParams.get("plant_name");
    const scientificName = url.searchParams.get("scientific_name");

    if (!plantName && !scientificName) {
      return new Response(JSON.stringify({ error: "Missing plant_name or scientific_name" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const plantInfo = scientificName || plantName || "planta desconhecida";
    const scientificInfo = scientificName ? ` (${scientificName})` : "";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    if (scientificName) {
      const { data: cachedTips, error: fetchError } = await supabase
        .from("care_tips")
        .select("*")
        .eq("scientific_name", scientificName)
        .single();

      if (!fetchError && cachedTips) {
        console.log("Returning cached care tips for:", scientificName);
        return new Response(
          JSON.stringify({
            plantName: cachedTips.plant_name,
            scientificName: cachedTips.scientific_name,
            watering: cachedTips.watering,
            light: cachedTips.light,
            soil: cachedTips.soil,
            fertilizer: cachedTips.fertilizer,
            temperature: cachedTips.temperature,
            maintenance: cachedTips.maintenance,
            problems: cachedTips.problems,
            specialTips: cachedTips.special_tips,
            petSafe: cachedTips.pet_safe,
            toxicityWarning: cachedTips.toxicity_warning,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    console.log("No cached tips found, generating new tips for:", plantInfo);

    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const promptText = `You are an expert botanist and plant care specialist. Provide comprehensive, detailed care tips for "${plantInfo}${scientificInfo}".

    **CONTEXT:**
    - Plant: ${plantInfo}${scientificInfo}
    - Target audience: Brazilian home gardeners
    - Environment: Indoor/outdoor apartment/house plants
    - Climate: Tropical/subtropical (Brazilian climate)

    **PROVIDE DETAILED INFORMATION ON:**

    1. **WATERING** - Detailed watering requirements:
      - Frequency and amount
      - Signs of overwatering and underwatering
      - Water quality preferences
      - Seasonal variations
      - Best time of day to water

    2. **LIGHT** - Complete light requirements:
      - Ideal light conditions (full sun, partial shade, indirect light, etc.)
      - Signs of too much/too little light
      - Best placement in home/garden
      - Seasonal adjustments

    3. **SOIL** - Soil and substrate recommendations:
      - Ideal soil type and composition
      - pH requirements
      - Drainage needs
      - When and how to repot
      - Pot size recommendations

    4. **FERTILIZER** - Nutrition and feeding:
      - Type of fertilizer (NPK ratio)
      - Frequency of application
      - Organic vs chemical options
      - Signs of nutrient deficiency
      - Seasonal feeding schedule

    5. **TEMPERATURE & HUMIDITY** - Climate preferences:
      - Ideal temperature range
      - Humidity requirements
      - Tolerance to temperature fluctuations
      - Winter care tips
      - How to increase humidity if needed

    6. **PRUNING & MAINTENANCE** - Regular care tasks:
      - When and how to prune
      - Cleaning leaves
      - Removing dead foliage
      - Supporting/staking if needed
      - Propagation methods

    7. **COMMON PROBLEMS** - Issues to watch for:
      - Common pests (identification and treatment)
      - Common diseases
      - Environmental stress symptoms
      - Prevention tips

    8. **SPECIAL TIPS** - Bonus recommendations:
      - Companion planting
      - Seasonal care variations
      - Indoor vs outdoor considerations
      - Pet safety (if toxic)
      - Brazilian-specific advice

    **IMPORTANT:**
    - Be specific and practical
    - Use clear, accessible language in Brazilian Portuguese
    - Provide actionable advice
    - Consider Brazilian climate and product availability
    - Include measurement units commonly used in Brazil
    - Mention local/organic solutions when possible

    **ALL TEXT MUST BE IN BRAZILIAN PORTUGUESE.**

    Return your response **STRICTLY** as a JSON object with this **EXACT** structure, and **DO NOT** include any other text, markdown, or commentary:
    {
      "plantName": "Plant name in Portuguese",
      "scientificName": "Scientific name",
      "watering": {
        "frequency": "Detailed watering frequency in Portuguese",
        "amount": "How much water in Portuguese",
        "tips": ["Tip 1 in Portuguese", "Tip 2 in Portuguese", "Tip 3 in Portuguese"]
      },
      "light": {
        "requirements": "Light requirements in Portuguese",
        "placement": "Where to place in Portuguese",
        "tips": ["Tip 1 in Portuguese", "Tip 2 in Portuguese"]
      },
      "soil": {
        "type": "Soil type in Portuguese",
        "ph": "pH range",
        "drainage": "Drainage needs in Portuguese",
        "repotting": "When to repot in Portuguese",
        "tips": ["Tip 1 in Portuguese", "Tip 2 in Portuguese"]
      },
      "fertilizer": {
        "type": "Fertilizer type in Portuguese",
        "frequency": "How often in Portuguese",
        "tips": ["Tip 1 in Portuguese", "Tip 2 in Portuguese", "Tip 3 in Portuguese"]
      },
      "temperature": {
        "ideal": "Ideal range in Portuguese",
        "humidity": "Humidity requirements in Portuguese",
        "tips": ["Tip 1 in Portuguese", "Tip 2 in Portuguese"]
      },
      "maintenance": {
        "pruning": "Pruning guidelines in Portuguese",
        "cleaning": "How to clean in Portuguese",
        "tips": ["Tip 1 in Portuguese", "Tip 2 in Portuguese"]
      },
      "problems": {
        "pests": ["Common pest 1 in Portuguese", "Common pest 2 in Portuguese"],
        "diseases": ["Common disease 1 in Portuguese", "Common disease 2 in Portuguese"],
        "prevention": ["Prevention tip 1 in Portuguese", "Prevention tip 2 in Portuguese"]
      },
      "specialTips": ["Special tip 1 in Portuguese", "Special tip 2 in Portuguese", "Special tip 3 in Portuguese"],
      "petSafe": true/false,
      "toxicityWarning": "Warning message in Portuguese if toxic, or null if safe"
    }`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || result.text;
    console.log("Gemini care tips response:", textResponse?.substring(0, 200));

    if (!textResponse) {
      console.error("Full result:", JSON.stringify(result).substring(0, 500));
      throw new Error("No care tips results from Gemini");
    }

    let jsonText = textResponse.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const tipsData = JSON.parse(jsonText);

    if (!tipsData.plantName) {
      throw new Error("Invalid response format: Missing plantName field");
    }

    if (scientificName) {
      try {
        await supabase.from("care_tips").insert({
          scientific_name: scientificName,
          plant_name: tipsData.plantName,
          watering: tipsData.watering,
          light: tipsData.light,
          soil: tipsData.soil,
          fertilizer: tipsData.fertilizer,
          temperature: tipsData.temperature,
          maintenance: tipsData.maintenance,
          problems: tipsData.problems,
          special_tips: tipsData.specialTips,
          pet_safe: tipsData.petSafe,
          toxicity_warning: tipsData.toxicityWarning,
        });
        console.log("Cached care tips for:", scientificName);
      } catch (cacheError) {
        console.error("Error caching care tips:", cacheError);
      }
    }

    return new Response(JSON.stringify(tipsData), {
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
