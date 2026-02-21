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

        if (action !== "openlibrary_proxy") {
            return new Response(JSON.stringify({ error: "Unknown action" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const path = url.searchParams.get("path") || payload.path || "";
        const searchConfig = url.searchParams.get("query") || payload.query || "";
        const targetUrl = `https://openlibrary.org/${path}?${searchConfig}`;

        const response = await fetchWithTimeout(targetUrl);
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
