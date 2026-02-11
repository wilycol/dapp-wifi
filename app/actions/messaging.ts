'use server';

import { createClient } from '@/lib/supabase reap/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

export async function sendClientNotification(clientId: string, message: string) {
  const supabase = await createClient();

  // 1. Fetch client details
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('name, phone, email')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    return { success: false, error: 'Client not found' };
  }

  // 2. Send message via Twilio
  await twilioClient.messages.create({
     from: 'whatsapp:+14155238886', // Número de Twilio
     body: message,
     to: `whatsapp:${client.phone}`
  });

  // 3. Log the notification in a hypothetical logs table or just return success
  // For now, we'll just return success to the UI
  return { 
    success: true, 
    recipient: client.name,
    timestamp: new Date().toISOString() 
  };
}

export async function notifyTicketUpdate(ticketId: string, status: string) {
  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select('issue, client_id, clients(name)')
    .eq('id', ticketId)
    .single();

  if (error || !ticket) return { success: false };

  const message = `Hola ${ticket.clients?.name}, el estado de tu ticket "${ticket.issue}" ha cambiado a: ${status}.`;
  
  return await sendClientNotification(ticket.client_id!, message);
}
