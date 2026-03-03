'use server';

import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { resend } from '@/lib/resend';

/**
 * Crea una invitación para un nuevo usuario
 */
export async function inviteUser(email: string, role: string, companyId: string, sendEmail: boolean = false) {
  const supabase = await createClient();
  
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
    .select('*, companies(name)')
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
  
  // 5. Enviar correo si se solicita
  if (sendEmail) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY no configurada. Saltando envío de correo.');
      return { 
        success: true, 
        inviteLink, 
        inviteId: data.id, 
        warning: 'Invitación creada, pero no se envió el correo porque falta configurar RESEND_API_KEY en el servidor.' 
      };
    }

    try {
      const companyName = data.companies?.name || 'Dapp WiFi';
      await resend.emails.send({
        from: 'Dapp WiFi <onboarding@resend.dev>', // Actualizar con dominio verificado en producción
        to: email,
        subject: `Invitación a unirte a ${companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Has sido invitado a unirte a ${companyName}</h2>
            <p>Hola,</p>
            <p>Has recibido una invitación para colaborar en el equipo de <strong>${companyName}</strong> con el rol de <strong>${role}</strong>.</p>
            <p>Haz clic en el siguiente botón para aceptar la invitación:</p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Aceptar Invitación</a>
            <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador: <br>${inviteLink}</p>
          </div>
        `
      });
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      // No fallamos toda la operación si el correo falla, pero avisamos (o retornamos warning)
      return { success: true, inviteLink, inviteId: data.id, warning: 'Invitación creada pero falló el envío del correo: ' + emailError.message };
    }
  }
  
  return { success: true, inviteLink, inviteId: data.id };
}

/**
 * Obtiene los detalles de una invitación por su ID
 */
export async function getInvitation(inviteId: string) {
  const supabase = await createClient();
  
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
  const supabase = await createClient();
  
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
