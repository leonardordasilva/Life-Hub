import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

async function hashPassword(password: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
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

        const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        switch (action) {
            case "auth_verify": {
                const { password } = payload;
                if (!password) throw new Error("Password required");

                const inputHash = await hashPassword(password);
                const { data: pwdData } = await supabase.from("app_config").select("value").eq("key", "admin_password_hash").single();
                const { data: defData } = await supabase.from("app_config").select("value").eq("key", "is_default_password").single();

                if (!pwdData) {
                    return new Response(JSON.stringify({ success: false, resetRequired: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const storedHash = pwdData.value;
                const isDefault = defData ? defData.value === "true" : false;

                if (inputHash === storedHash) {
                    return new Response(JSON.stringify({ success: true, resetRequired: isDefault }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
                return new Response(JSON.stringify({ success: false, resetRequired: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "auth_change_password": {
                const { currentPassword, newPassword } = payload;
                if (!newPassword || newPassword.length < 4) throw new Error("Invalid new password");

                if (currentPassword) {
                    const currentHash = await hashPassword(currentPassword);
                    const { data } = await supabase.from("app_config").select("value").eq("key", "admin_password_hash").single();
                    if (!data || data.value !== currentHash) {
                        return new Response(JSON.stringify({ success: false, error: "Current password incorrect" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                    }
                }

                const newHash = await hashPassword(newPassword);
                const { error: pwdError } = await supabase.from("app_config").upsert({ key: "admin_password_hash", value: newHash });
                if (pwdError) throw pwdError;

                const { error: defError } = await supabase.from("app_config").upsert({ key: "is_default_password", value: "false" });
                if (defError) throw defError;

                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
