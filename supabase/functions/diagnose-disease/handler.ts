import OpenAI from "npm:openai@^4";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { jsonResponse } from "../_shared/response.ts";

export async function handler(req: Request): Promise<Response> {
  try {
    const auth = await getAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    const { image_base64, mime_type, plant_name, scientific_name } = await req.json();

    if (!image_base64) {
      return jsonResponse({ error: "Missing image_base64" }, 400);
    }

    const mimeType = mime_type || "image/jpeg";
    const plantInfo = plant_name || scientific_name || "planta desconhecida";
    const scientificInfo = scientific_name ? ` (${scientific_name})` : "";

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const promptText = `Você é um especialista em fitopatologia (doenças de plantas) e manejo de plantas ornamentais. Analise a imagem fornecida da planta "${plantInfo}${scientificInfo}" e faça um diagnóstico detalhado.

**CONTEXTO:**
- Planta: ${plantInfo}${scientificInfo}
- Localização: Rio de Janeiro, Brasil

**CLIMA LOCAL (Rio de Janeiro - Köppen Aw):**
- Clima tropical de savana com estação seca no inverno
- Temperatura: 22-30°C no verão (Dez-Mar), 18-24°C no inverno (Jun-Set)
- Umidade relativa: 70-80% em média (favorece doenças fúngicas)
- Chuvas intensas de Outubro a Março (estação úmida)
- Ar salino costeiro pode causar queimaduras foliares
- Pragas comuns na região: cochonilhas, pulgões, ácaros, mosca-branca, lesmas
- Doenças fúngicas frequentes: oídio, ferrugem, manchas foliares, podridão por excesso de umidade
- Considerar que muitas plantas ficam em varandas com exposição ao vento marítimo

**TODO TEXTO DEVE SER EM PORTUGUÊS BRASILEIRO.**

Responda APENAS com um JSON no formato:
{
  "isHealthy": true/false,
  "confidence": 0.95,
  "diagnosis": "Diagnóstico principal",
  "severity": "leve"/"moderada"/"grave"/"nenhuma",
  "symptoms": ["Sintoma 1", "Sintoma 2"],
  "causes": ["Causa provável 1", "Causa provável 2"],
  "treatment": {
    "immediate": ["Ação imediata 1", "Ação imediata 2"],
    "ongoing": ["Tratamento contínuo 1", "Tratamento contínuo 2"],
    "prevention": ["Medida preventiva 1", "Medida preventiva 2"]
  },
  "prognosis": "Descrição do prognóstico",
  "additionalNotes": "Observações adicionais importantes"
}`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${image_base64}`,
              },
            },
          ],
        },
      ],
    });

    const textResponse = result.choices[0]?.message?.content;
    console.log("OpenAI diagnosis response:", textResponse?.substring(0, 200));

    if (!textResponse) {
      throw new Error("No diagnosis results from OpenAI");
    }

    const diagnosisData = JSON.parse(textResponse);

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

    return jsonResponse(formattedResult);
  } catch (err) {
    console.error("Error full details:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: errorMessage }, 500);
  }
}
