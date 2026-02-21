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

        const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY") || "";

        switch (action) {
            case "tmdb_search": {
                const type = url.searchParams.get("type") || payload.type;
                const query = validateString(url.searchParams.get("query") || payload.query, 500);
                if (type !== "MOVIE" && type !== "SERIES" && type !== "ANIME") {
                    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
                if (!query) {
                    return new Response(JSON.stringify({ error: "Invalid query" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const endpoint = type === "MOVIE" ? "search/movie" : "search/tv";
                const targetUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;

                const response = await fetchWithTimeout(targetUrl);
                const data = await response.json();
                return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "tmdb_details": {
                const type = url.searchParams.get("type") || payload.type;
                const id = validateString(url.searchParams.get("id") || payload.id, 20);
                if (type !== "MOVIE" && type !== "SERIES" && type !== "ANIME") {
                    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
                if (!id || !/^[0-9]+$/.test(id)) {
                    return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const endpoint = type === "MOVIE" ? "movie" : "tv";
                const targetUrl = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`;

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
        console.error("tmdb-proxy error:", err);
        return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
