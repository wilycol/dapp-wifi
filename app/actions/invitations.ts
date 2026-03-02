'use server';

import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

/**
 * Crea una invitación para un nuevo usuario
 */
export async function inviteUser(email: string, role: string, companyId: string) {
  const supabase = createClient();
  
  // 1. Verificar si el usuario ya existe (opcional, por ahora asumimos flujo de invitación)
  
  // 2. Generar un código único para la invitación
  const inviteCode = randomUUID(); // O un hash más corto
  
  // 3. Insertar en la tabla company_invites
  // Usamos 'id' como el código de invitación para simplificar, o agregamos una columna 'code'
  // En el esquema actual: id, company_id, email, role, status, created_at
  // Vamos a usar el 'id' como el código que se envía en el link.
  
  const { data, error } = await supabase
    .from('company_invites')
    .insert({
      company_id: companyId,
      email: email,
      role: role,
      status: 'pending'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating invitation:', error);
    return { success: false, error: error.message };
  }
  
  // 4. Generar el link de invitación
  // En producción: https://dapp-wifi.vercel.app/invite/[id]
  // En local: http://localhost:3000/invite/[id]
  // Detectar el host o usar variable de entorno
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteLink = `${baseUrl}/invite/${data.id}`;
  
  return { success: true, inviteLink, inviteId: data.id };
}

/**
 * Obtiene los detalles de una invitación por su ID
 */
export async function getInvitation(inviteId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('company_invites')
    .select('*, companies(name)')
    .eq('id', inviteId)
    .single();
    
  if (error) {
    return { success: false, error: 'Invitación no encontrada o expirada' };
  }
  
  return { success: true, invitation: data };
}

/**
 * Acepta una invitación
 */
export async function acceptInvitation(inviteId: string, userId: string, userEmail: string) {
  const supabase = createClient();
  
  // 1. Obtener invitación
  const { data: invite, error: fetchError } = await supabase
    .from('company_invites')
    .select('*')
    .eq('id', inviteId)
    .single();
    
  if (fetchError || !invite) {
    return { success: false, error: 'Invitación inválida' };
  }
  
  if (invite.status !== 'pending') {
    return { success: false, error: 'Esta invitación ya fue usada' };
  }
  
  // Verificar que el email coincida (opcional, pero recomendado)
  // if (invite.email !== userEmail) ...
  
  // 2. Actualizar el perfil del usuario con company_id y role
  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({
      company_id: invite.company_id,
      role: invite.role
    })
    .eq('id', userId);
    
  if (updateProfileError) {
    return { success: false, error: 'Error al actualizar perfil' };
  }
  
  // 3. Marcar invitación como aceptada
  await supabase
    .from('company_invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId);
    
  return { success: true };
}
