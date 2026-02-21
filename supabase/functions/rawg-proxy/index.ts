import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { fetchWithTimeout } from "../_shared/fetch.ts";

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

        const RAWG_API_KEY = Deno.env.get("RAWG_API_KEY") || "";

        switch (action) {
            case "rawg_search": {
                const query = validateString(url.searchParams.get("query") || payload.query, 500);
                const pageSizeRaw = url.searchParams.get("page_size") || payload.page_size || "10";
                const pageSize = Math.min(Math.max(parseInt(String(pageSizeRaw), 10) || 10, 1), 40);
                if (!query) {
                    return new Response(JSON.stringify({ error: "Invalid query" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const targetUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=${pageSize}`;
                const response = await fetchWithTimeout(targetUrl);
                const data = await response.json();
                return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "rawg_details": {
                const id = validateString(url.searchParams.get("id") || payload.id, 20);
                if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
                    return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const targetUrl = `https://api.rawg.io/api/games/${id}?key=${RAWG_API_KEY}`;
                const response = await fetchWithTimeout(targetUrl);
                const data = await response.json();
                return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            default:
                return new Response(JSON.stringify({ error: "Unknown action" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
        }
    } catch (err: any) {
        console.error("rawg-proxy error:", err);
        return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
