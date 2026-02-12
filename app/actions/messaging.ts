'use server';

import { createClient } from '@/lib/supabase/server';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function sendClientNotification(clientId: string, message: string) {
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('name, phone')
    .eq('id', clientId)
    .single();

  if (clientError || !client || !client.phone) {
    return { success: false, error: 'Cliente o teléfono no encontrado' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: client.phone.replace(/\D/g, ''), // Limpia el número (solo dígitos)
          type: "text",
          text: { body: message }
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Error en WhatsApp API');

    return { success: true, recipient: client.name };
  } catch (error: any) {
    console.error('WhatsApp Error:', error);
    return { success: false, error: error.message };
  }
}

export async function notifyTicketUpdate(ticketId: string, status: string) {
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('issue, client_id, clients(name)')
    .eq('id', ticketId)
    .single();

  if (!ticket) return { success: false };
  const message = `Hola ${ticket.clients?.name}, el estado de tu ticket "${ticket.issue}" es ahora: ${status}.`;
  return await sendClientNotification(ticket.client_id!, message);
}
