import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getRioWeather } from "../_shared/weather.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { jsonResponse } from "../_shared/response.ts";

export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export async function handler(req: Request): Promise<Response> {
  try {
    const auth = await getAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    const url = new URL(req.url);
    const plantName = url.searchParams.get("plant_name");
    const scientificName = url.searchParams.get("scientific_name");

    if (!plantName && !scientificName) {
      return jsonResponse({ error: "Missing plant_name or scientific_name" }, 400);
    }

    const plantInfo = scientificName || plantName || "planta desconhecida";
    const scientificInfo = scientificName ? ` (${scientificName})` : "";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Missing Supabase env vars" }, 500);
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
        const cachedDate = new Date(cachedTips.updated_at || cachedTips.created_at);
        const now = new Date();
        const cachedQuarter = getQuarter(cachedDate);
        const cachedYear = cachedDate.getFullYear();
        const currentQuarter = getQuarter(now);
        const currentYear = now.getFullYear();

        if (cachedYear !== currentYear || cachedQuarter !== currentQuarter) {
          console.log("Cache expired (different quarter), regenerating tips for:", scientificName);
          await supabase.from("care_tips").delete().eq("scientific_name", scientificName);
        } else {
          console.log("Returning cached care tips for:", scientificName);
          return jsonResponse({
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
            });
        }
      }
    }

    console.log("No cached tips found, generating new tips for:", plantInfo);

    const weather = await getRioWeather();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const promptText = `Você é um botânico especialista e especialista em cuidados com plantas. Forneça dicas abrangentes e detalhadas de cuidados para "${plantInfo}${scientificInfo}".

**Condições ATUAIS (dados em tempo real):**
- Temperatura atual: ${weather.currentTemp}°C
- Umidade relativa: ${weather.currentHumidity}%
- Previsão de máxima nos próximos 7 dias: ${weather.maxTempNext7Days}°C
- Estação: ${weather.seasonLabel}

**TODO TEXTO DEVE SER EM PORTUGUÊS BRASILEIRO.**

Responda APENAS com um JSON no formato:
{
  "plantName": "Nome da planta em Português",
  "scientificName": "Nome científico",
  "watering": { "frequency": "...", "amount": "...", "tips": ["..."] },
  "light": { "requirements": "...", "placement": "...", "tips": ["..."] },
  "soil": { "type": "...", "ph": "...", "drainage": "...", "repotting": "...", "tips": ["..."] },
  "fertilizer": { "type": "...", "frequency": "...", "tips": ["..."] },
  "temperature": { "ideal": "...", "humidity": "...", "tips": ["..."] },
  "maintenance": { "pruning": "...", "cleaning": "...", "tips": ["..."] },
  "problems": { "pests": ["..."], "diseases": ["..."], "prevention": ["..."] },
  "specialTips": ["..."],
  "petSafe": true/false,
  "toxicityWarning": "..."
}`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: promptText }],
    });

    const textResponse = result.choices[0]?.message?.content;
    console.log("OpenAI care tips response:", textResponse?.substring(0, 200));

    if (!textResponse) {
      throw new Error("No care tips results from OpenAI");
    }

    const tipsData = JSON.parse(textResponse);

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

    return jsonResponse(tipsData);
  } catch (err) {
    console.error("Error full details:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: errorMessage }, 500);
  }
}
