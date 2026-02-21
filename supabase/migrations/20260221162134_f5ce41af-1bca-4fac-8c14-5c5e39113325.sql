
-- Lock down app_config - only service role can access (edge functions use service role)
DROP POLICY IF EXISTS "Allow all access to app_config" ON app_config;
CREATE POLICY "Service role only" ON app_config
FOR ALL USING (false) WITH CHECK (false);
