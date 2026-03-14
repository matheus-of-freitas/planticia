import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "openai";

const PLANTNET_API_KEY = Deno.env.get("PLANTNET_API_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

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

    // Step 1: Identify plant via PlantNet
    const binary = Uint8Array.from(atob(image_base64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: mimeType });
    const form = new FormData();
    form.append("images", blob, "plant.jpg");
    form.append("organs", "auto");

    const plantnetUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&lang=pt`;
    const plantnetRes = await fetch(plantnetUrl, {
      method: "POST",
      body: form,
    });

    if (!plantnetRes.ok) {
      const remaining = plantnetRes.headers.get("x-remaining-identification-requests");
      if (remaining === "0") {
        return new Response(
          JSON.stringify({ error: "Limite diário de identificações atingido. Tente novamente amanhã." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      console.error("PlantNet error:", plantnetRes.status, await plantnetRes.text());
      return new Response(
        JSON.stringify({ confidence: 0, species: "", commonName: "", wateringIntervalDays: 7, lightPreference: "", description: "Não foi possível identificar a planta." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const plantnetData = await plantnetRes.json();
    const topResult = plantnetData.results?.[0];

    if (!topResult) {
      return new Response(
        JSON.stringify({ confidence: 0, species: "", commonName: "", wateringIntervalDays: 7, lightPreference: "", description: "Nenhuma planta identificada na imagem." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const species = topResult.species?.scientificNameWithoutAuthor || topResult.species?.scientificName || "";
    const commonName =
      topResult.species?.commonNames?.[0] || "";
    const confidence = topResult.score || 0;

    // Step 2: Get care details from OpenAI for the identified species
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const careCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é um botânico especialista. Dado o nome científico de uma planta, forneça informações de cuidado específicas para o clima do Rio de Janeiro (Köppen Aw — tropical de savana com estação seca no inverno, temperatura 22-30°C no verão, 18-24°C no inverno, umidade 70-80%, chuvas intensas Out-Mar, ar salino costeiro).

Responda APENAS com um JSON no formato:
{
  "wateringIntervalDays": 7,
  "lightPreference": "luz indireta",
  "description": "Descrição dos cuidados em português brasileiro"
}`,
        },
        {
          role: "user",
          content: `Planta: ${species} (${commonName || "sem nome popular conhecido"})`,
        },
      ],
    });

    const careText = careCompletion.choices[0]?.message?.content || "{}";
    const careData = JSON.parse(careText);

    const formattedResult = {
      species,
      commonName: commonName || "Desconhecida",
      confidence,
      wateringIntervalDays: careData.wateringIntervalDays || 7,
      lightPreference: careData.lightPreference || "medium",
      description: careData.description || "Sem descrição disponível.",
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
