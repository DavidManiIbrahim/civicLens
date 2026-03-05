import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, type } = await req.json();
    const API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [],
    };

    if (type === "sentiment") {
      systemPrompt = `You are a sentiment analysis tool for civic engagement. 
      Analyze the text and classify it into: positive, neutral, or negative.
      
      Guidelines:
      - POSITIVE: Support, enthusiasm, constructive praise, or proactive suggestions that improve the discourse.
      - NEUTRAL: Factual questions, objective observations, requests for information, or balanced feedback that isn't purely critical.
      - NEGATIVE: Pure opposition, inflammatory language, frustration without resolution, or toxicity.
      
      Note: Constructive criticism that aims to improve a bill or process should be classified as NEUTRAL or POSITIVE engagement, not NEGATIVE.`;

      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this public comment: "${text}"` },
      ];
      body.tools = [{
        type: "function",
        function: {
          name: "classify_sentiment",
          description: "Classify the sentiment of a public comment",
          parameters: {
            type: "object",
            properties: {
              sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              confidence: { type: "number" },
            },
            required: ["sentiment", "confidence"],
            additionalProperties: false,
          },
        },
      }];
      body.tool_choice = { type: "function", function: { name: "classify_sentiment" } };
    } else if (type === "summarize") {
      systemPrompt = "You are a legislative hearing summarizer. Create concise, actionable summaries for policymakers.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Summarize the following hearing transcript into an executive briefing with key points, risks, and recommendations:\n\n${text}` },
      ];
    } else if (type === "questions") {
      systemPrompt = "You are an AI that extracts key questions and generates survey questions from legislative hearing content.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Based on this hearing content, extract the key questions raised and generate 5 survey questions for public feedback:\n\n${text}` },
      ];
      body.tools = [{
        type: "function",
        function: {
          name: "extract_questions",
          parameters: {
            type: "object",
            properties: {
              extracted_questions: {
                type: "array",
                items: { type: "object", properties: { question: { type: "string" }, speaker: { type: "string" }, answered: { type: "boolean" } }, required: ["question", "speaker", "answered"], additionalProperties: false },
              },
              survey_questions: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["extracted_questions", "survey_questions"],
          },
        },
      }];
      body.tool_choice = { type: "function", function: { name: "extract_questions" } };
    } else if (type === "caption_summary") {
      systemPrompt = "You are a real-time caption summarizer for live legislative hearings. Provide brief, clear closed-caption style summaries.";
      body.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a brief 2-3 sentence summary of this caption segment:\n\n${text}` },
      ];
    }

    const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let result: any;

    if (type === "sentiment" || type === "questions") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try to extract sentiment from content text if tool wasn't used
        const content = data.choices?.[0]?.message?.content?.toLowerCase() || "";
        if (type === "sentiment") {
          let detected = "neutral";
          if (content.includes("positive")) detected = "positive";
          else if (content.includes("negative")) detected = "negative";
          result = { sentiment: detected, confidence: 0.5 };
        } else {
          result = { raw: content };
        }
      }
    } else {
      result = { text: data.choices?.[0]?.message?.content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Sentiment Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal Server Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
