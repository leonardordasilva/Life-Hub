import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function validateString(value: unknown, maxLen: number): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > maxLen) return null;
    return trimmed;
}

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
            return new Response(JSON.stringify({ error: "Service unavailable" }), {
                status: 503,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        switch (action) {
            case "gemini_generate": {
                const prompt = validateString(payload.prompt, 5000);
                if (!prompt) {
                    return new Response(JSON.stringify({ error: "Invalid prompt (1-5000 chars)" }), {
                        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }

                const model = validateString(payload.model, 100) || "google/gemini-3-flash-preview";

                const response = await fetch(LOVABLE_AI_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${LOVABLE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model,
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
                    throw new Error("AI service error");
                }

                const data = await response.json();
                const text = data?.choices?.[0]?.message?.content || "";
                return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "gemini_translate": {
                const text = validateString(payload.text, 5000);
                if (!text) {
                    return new Response(JSON.stringify({ text: payload.text || "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
                const title = validateString(payload.title, 500);
                const type = validateString(payload.type, 50);
                if (!title || !type) {
                    return new Response(JSON.stringify({ error: "Missing or invalid title/type" }), {
                        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
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
                            content: `Find detailed information about the ${type} titled "${title}". 
Return a JSON object with the following fields exactly and only:
{"title": "string", "posterUrl": "string or null", "releaseDate": "YYYY-MM-DD or null", "totalSeasons": number or null, "totalEpisodes": number or null, "author": "string or null"}`
                        }],
                    }),
                });

                if (!response.ok) throw new Error("AI service error");

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
        console.error("gemini-proxy error:", err);
        return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
