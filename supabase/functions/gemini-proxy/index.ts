import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { fetchWithTimeout } from "../_shared/fetch.ts";

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

        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("API_KEY") || "";

        switch (action) {
            case "gemini_generate": {
                const { prompt, model } = payload;
                if (!prompt) throw new Error("Missing prompt");

                const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-flash-latest"}:generateContent?key=${GEMINI_API_KEY}`;
                const response = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                });
                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "gemini_translate": {
                const { text } = payload;
                if (!text || text.trim().length === 0) {
                    return new Response(JSON.stringify({ text: text || "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
                const response = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Translate the following text to Brazilian Portuguese (pt-BR). Maintain the original tone, line breaks, and formatting. If the text is already in Portuguese, return it exactly as is: \n\n${text}` }] }],
                    }),
                });
                const data = await response.json();
                const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text || text;
                return new Response(JSON.stringify({ text: translated }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "gemini_entertainment_info": {
                const { title, type } = payload;
                if (!title || !type) throw new Error("Missing title or type");

                const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
                const response = await fetchWithTimeout(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Find detailed information about the ${type} titled "${title}". 
            Return a JSON object with the following fields exactly and only:
            {"title": "string", "posterUrl": "string or null", "releaseDate": "YYYY-MM-DD or null", "totalSeasons": number or null, "totalEpisodes": number or null, "author": "string or null"}` }]
                        }],
                    }),
                });
                const data = await response.json();
                let extracted = data?.candidates?.[0]?.content?.parts?.[0]?.text || "null";

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
