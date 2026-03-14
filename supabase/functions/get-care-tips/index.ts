import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import OpenAI from "openai";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

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

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const promptText = `Você é um botânico especialista e especialista em cuidados com plantas. Forneça dicas abrangentes e detalhadas de cuidados para "${plantInfo}${scientificInfo}".

**CONTEXTO CLIMÁTICO (Rio de Janeiro - Köppen Aw):**
- Temperatura: 22-30°C no verão (Dez-Mar), 18-24°C no inverno (Jun-Set)
- Umidade relativa: 70-80% (favorece doenças fúngicas — incluir dicas de ventilação)
- Pluviosidade: intensa Out-Mar, mais seca Abr-Set (ajustar frequência de rega por estação)
- Rio raramente tem temperaturas abaixo de 15°C
- Ar salino costeiro — considerar para plantas em varandas
- Pragas e doenças comuns no clima quente e úmido carioca
- Público-alvo: jardineiros domésticos no Rio de Janeiro

**FORNEÇA INFORMAÇÕES DETALHADAS SOBRE:**

1. **REGA** - Requisitos detalhados de rega:
  - Frequência e quantidade (ajustada por estação: verão úmido vs inverno seco)
  - Sinais de excesso e falta de água
  - Preferências de qualidade da água
  - Melhor horário do dia para regar

2. **LUZ** - Requisitos completos de iluminação:
  - Condições ideais de luz (sol pleno, meia-sombra, luz indireta, etc.)
  - Sinais de excesso/falta de luz
  - Melhor posicionamento em casa/jardim (considerar varandas com sol forte do RJ)

3. **SOLO** - Recomendações de solo e substrato:
  - Tipo ideal de solo e composição
  - Faixa de pH
  - Necessidades de drenagem (importante no clima úmido)
  - Quando e como replantar

4. **ADUBO** - Nutrição e alimentação:
  - Tipo de adubo (proporção NPK)
  - Frequência de aplicação por estação
  - Opções orgânicas vs químicas
  - Sinais de deficiência nutricional

5. **TEMPERATURA E UMIDADE** - Preferências climáticas:
  - Faixa ideal de temperatura
  - Requisitos de umidade
  - Cuidados no inverno carioca (ameno, mas mais seco)
  - Como garantir ventilação adequada para prevenir fungos

6. **PODA E MANUTENÇÃO** - Tarefas regulares:
  - Quando e como podar
  - Limpeza de folhas (remover sal marítimo se em varanda)
  - Métodos de propagação

7. **PROBLEMAS COMUNS** - Problemas a observar:
  - Pragas comuns no Rio (cochonilhas, pulgões, ácaros, mosca-branca)
  - Doenças comuns (oídio, ferrugem, manchas foliares)
  - Dicas de prevenção para o clima quente e úmido

8. **DICAS ESPECIAIS** - Recomendações bônus:
  - Cuidados sazonais específicos para o Rio de Janeiro
  - Considerações indoor vs outdoor (varandas com vento marítimo)
  - Segurança para pets (se tóxica)

**IMPORTANTE:**
- Seja específico e prático
- Use linguagem clara e acessível em Português Brasileiro
- Forneça conselhos acionáveis
- Considere o clima do Rio de Janeiro e disponibilidade de produtos locais
- Inclua unidades de medida comuns no Brasil
- Mencione soluções locais/orgânicas quando possível

**TODO TEXTO DEVE SER EM PORTUGUÊS BRASILEIRO.**

Responda APENAS com um JSON no formato:
{
  "plantName": "Nome da planta em Português",
  "scientificName": "Nome científico",
  "watering": {
    "frequency": "Frequência detalhada de rega",
    "amount": "Quantidade de água",
    "tips": ["Dica 1", "Dica 2", "Dica 3"]
  },
  "light": {
    "requirements": "Requisitos de luz",
    "placement": "Onde posicionar",
    "tips": ["Dica 1", "Dica 2"]
  },
  "soil": {
    "type": "Tipo de solo",
    "ph": "Faixa de pH",
    "drainage": "Necessidades de drenagem",
    "repotting": "Quando replantar",
    "tips": ["Dica 1", "Dica 2"]
  },
  "fertilizer": {
    "type": "Tipo de adubo",
    "frequency": "Frequência",
    "tips": ["Dica 1", "Dica 2", "Dica 3"]
  },
  "temperature": {
    "ideal": "Faixa ideal",
    "humidity": "Requisitos de umidade",
    "tips": ["Dica 1", "Dica 2"]
  },
  "maintenance": {
    "pruning": "Orientações de poda",
    "cleaning": "Como limpar",
    "tips": ["Dica 1", "Dica 2"]
  },
  "problems": {
    "pests": ["Praga comum 1", "Praga comum 2"],
    "diseases": ["Doença comum 1", "Doença comum 2"],
    "prevention": ["Dica de prevenção 1", "Dica de prevenção 2"]
  },
  "specialTips": ["Dica especial 1", "Dica especial 2", "Dica especial 3"],
  "petSafe": true/false,
  "toxicityWarning": "Aviso de toxicidade se tóxica, ou null se segura"
}`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: promptText,
        },
      ],
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
