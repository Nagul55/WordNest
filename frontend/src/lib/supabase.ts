import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Will point to local fallback storage if URL is placeholder)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kpvnsfpvnxstiwbihfqx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwdm5zZnB2bnhzdGl3YmloZnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTQxODgsImV4cCI6MjEwMTM5MDE4OH0.7s4E5bvYo1w9XwrUvSWlYiHi_0b119C3tF21BbyAkl0';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Ensures user profile credentials exist in the Supabase public.profiles table.
 * While our Postgres DB Trigger handles this automatically, this function acts as an extra safety guarantee without throwing exceptions.
 */
export const syncUserProfile = async (user: any) => {
  if (!user) return;
  try {
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "WordNest User";
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

    // Fetch existing profile first to avoid overwriting custom cropped avatars
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    const finalAvatar = existingProfile?.avatar_url || avatar;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: user.email?.split('@')[0] + "_" + user.id.slice(0, 4),
      full_name: fullName,
      avatar_url: finalAvatar,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
      console.warn("Notice: Client profile sync warning (likely handled directly by DB Trigger):", error.message);
    }
  } catch (e) {
    console.error("Profile sync exception:", e);
  }
};
