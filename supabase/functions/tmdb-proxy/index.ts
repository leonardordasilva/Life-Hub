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

        const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY") || "";

        switch (action) {
            case "tmdb_search": {
                const type = url.searchParams.get("type") || payload.type;
                const query = url.searchParams.get("query") || payload.query;
                if (type !== "MOVIE" && type !== "SERIES" && type !== "ANIME") throw new Error("Invalid type");
                if (!query) throw new Error("Query required");

                const endpoint = type === "MOVIE" ? "search/movie" : "search/tv";
                const targetUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;

                const response = await fetchWithTimeout(targetUrl);
                const data = await response.json();
                return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "tmdb_details": {
                const type = url.searchParams.get("type") || payload.type;
                const id = url.searchParams.get("id") || payload.id;
                if (type !== "MOVIE" && type !== "SERIES" && type !== "ANIME") throw new Error("Invalid type");
                if (!id) throw new Error("Invalid ID");

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
        console.error(err);
        return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
