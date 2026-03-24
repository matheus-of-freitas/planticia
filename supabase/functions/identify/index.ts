import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import OpenAI from "openai";
import { getRioWeather } from "../_shared/weather.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { fetchStockPhoto } from "../_shared/stockPhoto.ts";
const PLANTNET_API_KEY = Deno.env.get("PLANTNET_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
serve(async (req)=>{
  try {
    const auth = await getAuthenticatedUser(req);
    if ("error" in auth) return auth.error;
    const { image_base64, mime_type } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({
        error: "Missing image_base64"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const mimeType = mime_type || "image/jpeg";
    // Start weather fetch in parallel with PlantNet
    const weatherPromise = getRioWeather();
    // Step 1: Identify plant via PlantNet
    const binary = Uint8Array.from(atob(image_base64), (c)=>c.charCodeAt(0));
    const blob = new Blob([
      binary
    ], {
      type: mimeType
    });
    const form = new FormData();
    form.append("images", blob, "plant.jpg");
    form.append("organs", "auto");
    const plantnetUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&lang=pt`;
    const plantnetRes = await fetch(plantnetUrl, {
      method: "POST",
      body: form
    });
    if (!plantnetRes.ok) {
      const remaining = plantnetRes.headers.get("x-remaining-identification-requests");
      if (remaining === "0") {
        return new Response(JSON.stringify({
          error: "Limite diário de identificações atingido. Tente novamente amanhã."
        }), {
          status: 429,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }
      console.error("PlantNet error:", plantnetRes.status, await plantnetRes.text());
      return new Response(JSON.stringify({
        confidence: 0,
        species: "",
        commonName: "",
        wateringIntervalDays: 3,
        lightPreference: "",
        description: "Não foi possível identificar a planta."
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const plantnetData = await plantnetRes.json();
    const topResult = plantnetData.results?.[0];
    if (!topResult) {
      return new Response(JSON.stringify({
        confidence: 0,
        species: "",
        commonName: "",
        wateringIntervalDays: 3,
        lightPreference: "",
        description: "Nenhuma planta identificada na imagem."
      }), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const species = topResult.species?.scientificNameWithoutAuthor || topResult.species?.scientificName || "";
    const commonName = topResult.species?.commonNames?.[0] || "";
    const confidence = topResult.score || 0;
    // Step 2: Get weather data
    const weather = await weatherPromise;
    // Step 3: Get care details from OpenAI + stock photo (in parallel)
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    const supabase = SUPABASE_URL && SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      : null;
    const stockPhotoPromise = supabase
      ? fetchStockPhoto(species, commonName, supabase)
      : Promise.resolve(null);
    const careCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: `Você é um botânico especialista em plantas no Rio de Janeiro. Dado o nome científico de uma planta, forneça informações de cuidado calibradas para as condições ATUAIS.

**Condições climáticas ATUAIS no Rio de Janeiro:**
- Temperatura atual: ${weather.currentTemp}°C
- Umidade relativa: ${weather.currentHumidity}%
- Temperatura máxima prevista (próximos 7 dias): ${weather.maxTempNext7Days}°C
- Estação: ${weather.seasonLabel}

**Regras de calibração para wateringIntervalDays:**
- Ervas aromáticas (hortelã, manjericão, salsa, cebolinha, etc.) em temperatura acima de 28°C: 1 dia
- Ervas aromáticas em temperatura entre 20-28°C: 1-2 dias
- Hortaliças e vegetais folhosos: 1-2 dias
- Plantas tropicais de folhagem (jiboias, costela-de-adão, etc.): 2-4 dias
- Plantas com flores (rosa, hibisco, etc.): 2-3 dias
- Suculentas e cactos: 7-14 dias
- Outras plantas: considere temperatura, umidade e necessidade hídrica da espécie

**Princípio:** Priorize a saúde da planta no calor carioca. É melhor regar um pouco a mais do que deixar secar. Em dias de calor acima de 30°C, reduza os intervalos.

Responda APENAS com um JSON no formato:
{
  "wateringIntervalDays": <número inteiro>,
  "lightPreference": "descrição da preferência de luz",
  "description": "Descrição dos cuidados em português brasileiro"
}`
        },
        {
          role: "user",
          content: `Planta: ${species} (${commonName || "sem nome popular conhecido"})`
        }
      ]
    });
    const careText = careCompletion.choices[0]?.message?.content || "{}";
    const careData = JSON.parse(careText);
    const stockPhoto = await stockPhotoPromise;
    const formattedResult = {
      species,
      commonName: commonName || "Desconhecida",
      confidence,
      wateringIntervalDays: careData.wateringIntervalDays || 3,
      lightPreference: careData.lightPreference || "medium",
      description: careData.description || "Sem descrição disponível.",
      stockImageUrl: stockPhoto?.imageUrl ?? null,
      stockImageAttribution: stockPhoto?.attribution ?? null,
    };
    return new Response(JSON.stringify(formattedResult), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Error full details:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
