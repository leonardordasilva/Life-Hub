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

        const RAWG_API_KEY = Deno.env.get("RAWG_API_KEY") || "";

        switch (action) {
            case "rawg_search": {
                const query = url.searchParams.get("query") || payload.query;
                const pageSize = url.searchParams.get("page_size") || payload.page_size || 10;
                if (!query) throw new Error("Query required");

                const targetUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=${pageSize}`;
                const response = await fetchWithTimeout(targetUrl);
                const data = await response.json();
                return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "rawg_details": {
                const id = url.searchParams.get("id") || payload.id;
                if (!id) throw new Error("Invalid ID");

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
        console.error(err);
        return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
