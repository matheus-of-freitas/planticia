import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLANTNET_API_KEY = Deno.env.get("PLANTNET_API_KEY")!;
const PROJECT_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return new Response(JSON.stringify({ error: "Missing image_url" }), {
        status: 400,
      });
    }

    const imageResp = await fetch(image_url);
    const imageBuffer = await imageResp.arrayBuffer();
    const hash = await sha256(imageBuffer);

    const { data: cached } = await supabase
      .from("plant_id_cache")
      .select("result_json")
      .eq("hash", hash)
      .single();

    if (cached) {
      console.log("Returning cached result");
      return new Response(JSON.stringify(cached.result_json), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = new FormData();
    formData.append("images", new Blob([imageBuffer]), "image.jpg");

    const apiUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&include-related-images=false`;

    const plantResponse = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    const plantData = await plantResponse.json();
    console.log("PlantNet response:", JSON.stringify(plantData));

    if (!plantData?.results?.length) {
      return new Response(
        JSON.stringify({ error: "No identification results found" }),
        { status: 404 }
      );
    }

    const bestMatch = plantData.results[0];

    const formattedResult = {
      species: bestMatch.species.scientificName,
      commonName: bestMatch.species.commonNames?.[0] ?? null,
      confidence: bestMatch.score,
      raw: plantData,
    };

    await supabase.from("plant_id_cache").insert({
      hash,
      result_json: formattedResult,
    });

    return new Response(JSON.stringify(formattedResult), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
