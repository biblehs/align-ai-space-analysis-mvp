import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Ensure environment variables are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key is missing. Check your environment variables. Using dummy values for local demo without backend.");
}
if (!supabaseServiceRoleKey) {
    console.warn("Supabase service role key is missing. Server write operations will stay in demo mode.");
}

const safeUrl = supabaseUrl || "https://dummy-project.supabase.co";
const safeKey = supabaseAnonKey || "dummy-key";
const safeAdminKey = supabaseServiceRoleKey || safeKey;

// Client for Frontend/Public operations
export const supabase = createClient<Database>(safeUrl, safeKey);

// Client for Backend/Admin operations (bypasses RLS)
export const supabaseAdmin = createClient<Database>(safeUrl, safeAdminKey);
