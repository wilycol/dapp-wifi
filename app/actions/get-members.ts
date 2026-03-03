'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function getCompanyMembers(companyId: string) {
  const supabase = await createClient();

  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'No autenticado' };
  }

  // 2. Verify Membership (Security)
  // Check if the current user belongs to the requested company
  const { data: currentUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !currentUserProfile) {
    return { success: false, error: 'Error al verificar perfil' };
  }

  // Allow SuperAdmin to see any company? For now, restrict to own company unless SuperAdmin
  if (currentUserProfile.company_id !== companyId && currentUserProfile.role !== 'superadmin') {
    return { success: false, error: 'No tienes permiso para ver los miembros de esta compañía' };
  }

  // 3. Fetch Profiles using Service Role
  // We use Service Role primarily to bypass RLS issues and access Auth Admin
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('company_id', companyId);

  if (profilesError) {
    return { success: false, error: 'Error al obtener perfiles: ' + profilesError.message };
  }

  // 4. Enrich with Auth Data (Email, Full Name)
  const enrichedMembers = await Promise.all(profiles.map(async (profile: any) => {
    const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    
    if (userError || !authUser) {
      console.warn(`User not found in Auth for profile ${profile.id}`);
      return {
        ...profile,
        email: 'Usuario no encontrado',
        full_name: 'Desconocido'
      };
    }

    // Get full name from metadata or fallback
    const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || null;

    return {
      ...profile,
      email: authUser.email,
      full_name: fullName
    };
  }));

  // 5. Filter sensitive roles
  // If current user is NOT superadmin, hide superadmin members
  const filteredMembers = enrichedMembers.filter((member: any) => {
    if (currentUserProfile.role?.toLowerCase() !== 'superadmin') {
      return member.role?.toLowerCase() !== 'superadmin';
    }
    return true;
  });

  return { success: true, members: filteredMembers };
}
