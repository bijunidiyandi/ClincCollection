import { createServerClient } from '@/lib/db/server';

export async function checkSuperAdmin(token: string) {
  const supabase = createServerClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, user: null, supabase };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isSuperAdmin = (userData as any)?.role === 'SUPER_ADMIN';

  return { authorized: isSuperAdmin, user, supabase };
}
