import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
    const cors = handleCors(req);
    if (cors) return cors;

    try {
        const url = new URL(req.url);
        let action = url.searchParams.get("action");
        let payload: any = {};

        if (req.method === "POST") {
            try {
                payload = await req.json();
                if (!action && payload.action) action = payload.action;
            } catch (_e) { }
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
        if (!LOVABLE_API_KEY) {
            return new Response(JSON.stringify({ error: "AI API key not configured" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        switch (action) {
            case "gemini_generate": {
                const { prompt, model } = payload;
                if (!prompt) throw new Error("Missing prompt");

                const response = await fetch(LOVABLE_AI_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${LOVABLE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: model || "google/gemini-3-flash-preview",
                        messages: [{ role: "user", content: prompt }],
                    }),
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
                            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
                        });
                    }
                    if (response.status === 402) {
                        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
                            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
                        });
                    }
                    throw new Error(`AI gateway error: ${response.status}`);
                }

                const data = await response.json();
                const text = data?.choices?.[0]?.message?.content || "";
                return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "gemini_translate": {
                const { text } = payload;
                if (!text || text.trim().length === 0) {
                    return new Response(JSON.stringify({ text: text || "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const response = await fetch(LOVABLE_AI_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${LOVABLE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "google/gemini-3-flash-preview",
                        messages: [{
                            role: "user",
                            content: `Translate the following text to Brazilian Portuguese (pt-BR). Maintain the original tone, line breaks, and formatting. If the text is already in Portuguese, return it exactly as is: \n\n${text}`
                        }],
                    }),
                });

                if (!response.ok) {
                    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const data = await response.json();
                const translated = data?.choices?.[0]?.message?.content || text;
                return new Response(JSON.stringify({ text: translated }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "gemini_entertainment_info": {
                const { title, type } = payload;
                if (!title || !type) throw new Error("Missing title or type");

                const response = await fetch(LOVABLE_AI_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${LOVABLE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "google/gemini-3-flash-preview",
                        messages: [{
                            role: "user",
                            content: `Find detailed information about the ${type} titled "${title}". 
Return a JSON object with the following fields exactly and only:
{"title": "string", "posterUrl": "string or null", "releaseDate": "YYYY-MM-DD or null", "totalSeasons": number or null, "totalEpisodes": number or null, "author": "string or null"}`
                        }],
                    }),
                });

                if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);

                const data = await response.json();
                let extracted = data?.choices?.[0]?.message?.content || "null";
                extracted = extracted.replace(/```json/g, "").replace(/```/g, "").trim();

                let result = null;
                try {
                    result = JSON.parse(extracted);
                } catch (_e) { }

                return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            default:
                return new Response(JSON.stringify({ error: "Unknown action" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
        }
    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
