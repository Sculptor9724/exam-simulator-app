import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase configuration. Set REACT_APP_SUPABASE_URL and " +
      "REACT_APP_SUPABASE_ANON_KEY in .env.local; see docs/database-setup.md.",
  );
}

// Browser-visible configuration: use only the anon/publishable key, never service_role.
export const supabase = createClient(url, anonKey);
