import { createClient } from "@supabase/supabase-js";

export const supabasePrivate = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_PRIVATE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PRIVATE_ANON_KEY!
);
