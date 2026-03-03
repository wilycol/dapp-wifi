'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, X, Reply, Ticket, CheckSquare, AlertCircle, User, Paperclip, Plus, HelpCircle, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getCompanyMembers } from '@/app/actions/get-members';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  reply_to_id?: string | null;
  message_type?: 'text' | 'ticket_assignment' | 'ticket_resolution' | 'ticket_created';
  metadata?: any;
  read_by?: string[]; // Array of user IDs who read the message
}

interface CompanyChatProps {
  profile: any;
  onClose?: () => void;
}

interface TicketData {
  id: string;
  issue: string;
  priority: string;
  status: string;
  client?: { full_name: string };
}

export default function CompanyChat({ profile, onClose }: CompanyChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced features state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [openTickets, setOpenTickets] = useState<TicketData[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  
  // New Ticket Features State
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketIssue, setNewTicketIssue] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('Media');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!profile?.company_id) return;

    // 1. Fetch members for names
    const fetchMembers = async () => {
      const result = await getCompanyMembers(profile.company_id);
      if (result.success && result.members) {
        setMembersList(result.members);
        const map: Record<string, string> = {};
        result.members.forEach((m: any) => {
          map[m.id] = m.full_name || m.email || 'Usuario';
        });
        setMembersMap(map);
      }
    };

    fetchMembers();

    // 2. Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('company_messages')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Error al cargar mensajes');
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // 3. Subscribe to realtime
    const channel = supabase
      .channel('company_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'company_messages',
          filter: `company_id=eq.${profile.company_id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    // 4. Mark messages as read
    const markRead = async () => {
      if (!profile.company_id || !profile.id) return;
      
      const { error } = await supabase.rpc('mark_messages_read', {
        p_company_id: profile.company_id,
        p_user_id: profile.id
      });

      if (error) console.error('Error marking messages as read:', error);
    };

    if (messages.length > 0) {
      markRead();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.company_id, supabase, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, replyingTo]);

  // Handle Mentions Logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    
    // Check if last char is '@' or if we are typing a mention
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && lastAt >= val.length - 10) { // Simple heuristic
       setShowMentions(true);
    } else {
       setShowMentions(false);
    }
  };

  const insertMention = (memberName: string) => {
    const lastAt = newMessage.lastIndexOf('@');
    const prefix = newMessage.substring(0, lastAt);
    setNewMessage(`${prefix}@${memberName} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = newMessage.trim();
    setNewMessage(''); // Optimistic clear
    const currentReply = replyingTo;
    setReplyingTo(null);

    const { error } = await supabase.from('company_messages').insert({
      company_id: profile.company_id,
      sender_id: profile.id,
      content: msg,
      reply_to_id: currentReply?.id || null,
      message_type: 'text'
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
      setNewMessage(msg); // Restore if failed
      setReplyingTo(currentReply);
    } else {
      // 2. Handle Mentions Notification
      const mentionedUsers = membersList.filter(m => 
        msg.includes(`@${m.full_name}`) || (m.email && msg.includes(`@${m.email}`))
      );
      
      if (mentionedUsers.length > 0) {
        const notifications = mentionedUsers
          .filter(u => u.id !== profile.id) // Don't notify self
          .map(user => ({
            user_id: user.id,
            title: 'Mención en el Chat',
            message: `${profile.full_name || 'Un compañero'} te mencionó: "${msg.length > 50 ? msg.substring(0, 50) + '...' : msg}"`,
            type: 'info',
            read: false,
            metadata: { 
              type: 'mention',
              sender_id: profile.id,
              sender_name: profile.full_name
            }
          }));

        if (notifications.length > 0) {
            await supabase.from('notifications' as any).insert(notifications);
        }
      }
    }
  };

  const openTicketAssignmentModal = async () => {
    // Fetch open tickets
    const { data } = await supabase
      .from('support_tickets')
      .select('id, issue, priority, status, clients(full_name)')
      .neq('status', 'Cerrado')
      .order('created_at', { ascending: false });
    
    if (data) {
      setOpenTickets(data as any);
      setShowTicketModal(true);
    } else {
      toast.error('No se pudieron cargar los tickets');
    }
  };

  const confirmAssignment = async () => {
    if (!selectedTicketId || !selectedAssigneeId) {
      toast.error('Selecciona un ticket y un técnico');
      return;
    }

    const ticket = openTickets.find(t => t.id === selectedTicketId);
    const assigneeName = membersMap[selectedAssigneeId];

    // 1. Update ticket in DB
    const { error: ticketError } = await supabase
      .from('support_tickets')
      .update({ 
        assigned_installer_id: selectedAssigneeId, 
        status: 'En Proceso'
      })
      .eq('id', selectedTicketId);

    if (ticketError) {
      toast.error('Error al actualizar el ticket');
      return;
    }

    // 2. Send System Message
    const { error: msgError } = await supabase.from('company_messages').insert({
      company_id: profile.company_id,
      sender_id: profile.id,
      content: `🎫 Asignación de Tarea: Ticket #${selectedTicketId.slice(0, 4)}`,
      message_type: 'ticket_assignment',
      metadata: {
        ticket_id: selectedTicketId,
        ticket_title: ticket?.issue,
        ticket_priority: ticket?.priority,
        assigned_to_id: selectedAssigneeId,
        assigned_to_name: assigneeName
      }
    });

    if (msgError) {
      console.error('Error sending system message:', msgError);
    } else {
      toast.success('Ticket asignado y notificado en el chat');
    }

    setShowTicketModal(false);
    setSelectedTicketId('');
    setSelectedAssigneeId('');
  };

  const resolveTicket = async (ticketId: string, ticketTitle: string) => {
    // 1. Update ticket in DB
    const { error: ticketError } = await supabase
      .from('support_tickets')
      .update({ status: 'Cerrado' })
      .eq('id', ticketId);

    if (ticketError) {
      toast.error('Error al cerrar el ticket');
      return;
    }

    // 2. Send Resolution Message
    const { error: msgError } = await supabase.from('company_messages').insert({
      company_id: profile.company_id,
      sender_id: profile.id,
      content: `✅ Tarea Resuelta: Ticket #${ticketId.slice(0, 4)}`,
      message_type: 'ticket_resolution',
      metadata: {
        ticket_id: ticketId,
        ticket_title: ticketTitle,
        resolver_name: profile.full_name || profile.email
      }
    });

    if (msgError) {
      console.error('Error sending resolution message:', msgError);
    } else {
      toast.success('Ticket marcado como resuelto');
    }
  };

  const selfAssignTicket = async (ticketId: string, ticketTitle: string, ticketPriority: string) => {
    // 1. Optimistic check or database constraint check
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ 
        assigned_installer_id: profile.id,
        status: 'En Proceso'
      })
      .eq('id', ticketId)
      .eq('status', 'Abierto') // Concurrency check!
      .select();

    if (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Error al tomar el ticket');
      return;
    }

    if (!data || data.length === 0) {
      toast.error('Este ticket ya ha sido tomado o cerrado');
      return;
    }

    // 2. Send system message
    const { error: msgError } = await supabase.from('company_messages').insert({
      company_id: profile.company_id,
      sender_id: profile.id,
      content: `🙋‍♂️ He tomado el caso: Ticket #${ticketId.slice(0, 4)}`,
      message_type: 'ticket_assignment',
      metadata: {
        ticket_id: ticketId,
        ticket_title: ticketTitle,
        ticket_priority: ticketPriority,
        assigned_to_id: profile.id,
        assigned_to_name: profile.full_name || profile.email
      }
    });
    
    if (msgError) console.error('Error sending assignment message:', msgError);
    else toast.success('Has tomado el caso exitosamente');
  };

  const handleCreateTicket = async () => {
    if (!newTicketIssue.trim()) {
      toast.error('Por favor escribe el asunto del ticket');
      return;
    }

    if (!profile.company_id) {
      toast.error('Error de sesión: No se encontró la empresa');
      return;
    }

    // 1. Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        issue: newTicketIssue,
        priority: newTicketPriority,
        status: 'Abierto',
        company_id: profile.company_id 
      } as any)
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      toast.error(`Error al crear ticket: ${ticketError.message}`);
      return;
    }

    // 2. Send Notification Message
    const { error: msgError } = await supabase.from('company_messages').insert({
      company_id: profile.company_id,
      sender_id: profile.id,
      content: `🆕 Nuevo Ticket Creado: ${newTicketIssue}`,
      message_type: 'ticket_created',
      metadata: {
        ticket_id: ticket.id,
        ticket_title: ticket.issue,
        ticket_priority: ticket.priority,
        creator_name: profile.full_name || profile.email
      }
    });

    if (msgError) {
      console.error('Error sending creation message:', msgError);
    } else {
      toast.success('Ticket creado y notificado');
    }

    // 3. Smart Detection for System Issues
    const keywords = ['bug', 'error', 'fallo', 'falla', 'render', 'pantalla', 'sistema', 'no carga', 'blanco', 'crash', 'lento'];
    const isSystemIssue = keywords.some(kw => newTicketIssue.toLowerCase().includes(kw));

    if (isSystemIssue) {
        // Find Admins or SuperAdmins to notify
        const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['Admin', 'SuperAdmin']);

        if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                title: '🚨 Alerta de Sistema Detectada',
                message: `Se ha reportado un posible fallo del sistema: "${newTicketIssue}"`,
                type: 'error',
                metadata: { ticket_id: ticket.id, priority: 'Alta' }
            }));

            const { error: notifError } = await supabase.from('notifications' as any).insert(notifications);
            if (notifError) console.error('Error creating notifications:', notifError);
        }
    }

    setShowCreateTicketModal(false);
    setNewTicketIssue('');
    setNewTicketPriority('Media');
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Cargando chat...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            Chat General del Equipo
          </h3>
          <p className="text-xs text-gray-500">Comunicación interna segura</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Cerrar chat"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-70">
            <p>No hay mensajes aún.</p>
            <p className="text-sm">¡Saluda a tu equipo!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === profile.id;
            const senderName = membersMap[msg.sender_id] || 'Usuario';
            
            // Find replied message content
            const repliedMsg = msg.reply_to_id 
              ? messages.find(m => m.id === msg.reply_to_id)
              : null;

            // Handle System Messages (Ticket Assignment)
            if (msg.message_type === 'ticket_assignment') {
              const isAssignedToMe = msg.metadata?.assigned_to_id === profile.id;
              const isAlreadyResolved = messages.some(
                m => m.message_type === 'ticket_resolution' && m.metadata?.ticket_id === msg.metadata?.ticket_id
              );

              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 max-w-sm w-full text-sm">
                    <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      <Ticket size={16} />
                      <span>Nueva Tarea Asignada</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 mb-2">
                      <p><strong>Ticket:</strong> {msg.metadata?.ticket_title}</p>
                      <p><strong>Prioridad:</strong> {msg.metadata?.ticket_priority}</p>
                      <p><strong>Asignado a:</strong> @{msg.metadata?.assigned_to_name}</p>
                    </div>
                    
                    {isAssignedToMe && !isAlreadyResolved && (
                      <button
                        onClick={() => resolveTicket(msg.metadata.ticket_id, msg.metadata.ticket_title)}
                        className="w-full mt-2 py-1 px-3 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckSquare size={12} />
                        Marcar como Resuelto
                      </button>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                      Asignado por {senderName} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            }

            // Handle System Messages (Ticket Created)
            if (msg.message_type === 'ticket_created') {
              const isAlreadyAssigned = messages.some(
                m => m.message_type === 'ticket_assignment' && m.metadata?.ticket_id === msg.metadata?.ticket_id
              );
              const isResolved = messages.some(
                m => m.message_type === 'ticket_resolution' && m.metadata?.ticket_id === msg.metadata?.ticket_id
              );
              
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg p-3 max-w-sm w-full text-sm">
                    <div className="flex items-center gap-2 font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                      <AlertCircle size={16} />
                      <span>Nuevo Ticket Disponible</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 mb-2">
                      <p><strong>Ticket:</strong> {msg.metadata?.ticket_title}</p>
                      <p><strong>Prioridad:</strong> {msg.metadata?.ticket_priority}</p>
                      <p><strong>Creado por:</strong> {msg.metadata?.creator_name}</p>
                    </div>
                    
                    {!isAlreadyAssigned && !isResolved && (
                      <button
                        onClick={() => selfAssignTicket(msg.metadata.ticket_id, msg.metadata.ticket_title, msg.metadata.ticket_priority)}
                        className="w-full mt-2 py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <User size={12} />
                        Tomar Caso
                      </button>
                    )}
                    
                    {(isAlreadyAssigned || isResolved) && (
                        <div className="w-full mt-2 py-1 px-3 bg-gray-200 dark:bg-gray-700 text-gray-500 text-xs rounded flex items-center justify-center gap-1 opacity-75 cursor-not-allowed">
                            <span>Ya gestionado</span>
                        </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            }

            // Handle System Messages (Ticket Resolution)
            if (msg.message_type === 'ticket_resolution') {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-3 max-w-sm w-full text-sm">
                    <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-300 mb-1">
                      <CheckSquare size={16} />
                      <span>Tarea Resuelta</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 mb-1">
                      <p><strong>Ticket:</strong> {msg.metadata?.ticket_title}</p>
                      <p><strong>Resuelto por:</strong> {msg.metadata?.resolver_name}</p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}
              >
                {/* Reply Button (visible on hover) */}
                <button 
                  onClick={() => setReplyingTo(msg)}
                  className={`opacity-0 group-hover:opacity-100 absolute top-2 ${isMe ? '-left-8' : '-right-8'} p-1 text-gray-400 hover:text-blue-500 transition-opacity`}
                  title="Responder"
                >
                  <Reply size={16} />
                </button>

                <div
                  className={`max-w-[75%] rounded-lg p-3 shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {/* Reply Context */}
                  {repliedMsg && (
                    <div className={`mb-2 p-2 rounded text-xs border-l-2 ${isMe ? 'bg-blue-700 border-blue-300 text-blue-100' : 'bg-gray-200 dark:bg-gray-600 border-gray-400 text-gray-600 dark:text-gray-300'}`}>
                      <div className="font-bold opacity-75">{membersMap[repliedMsg.sender_id] || 'Usuario'}</div>
                      <div className="truncate">{repliedMsg.content}</div>
                    </div>
                  )}

                  {!isMe && (
                    <div className="text-xs font-bold mb-1 opacity-70 text-blue-600 dark:text-blue-400">
                      {senderName}
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content.split(/(@\w+)/g).map((part, i) => 
                      part.startsWith('@') ? <span key={i} className="font-bold text-yellow-500 dark:text-yellow-400">{part}</span> : part
                    )}
                  </p>
                  
                  <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'} flex items-center justify-end gap-1`}>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && (
                      msg.read_by && msg.read_by.length > 0 ? (
                        <CheckCheck size={14} className="text-blue-200" />
                      ) : (
                        <Check size={14} className="text-blue-200/70" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 overflow-hidden">
            <Reply size={16} />
            <span className="font-semibold">Respondiendo a {membersMap[replyingTo.sender_id]}:</span>
            <span className="truncate max-w-[200px] text-gray-500">{replyingTo.content}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mentions Popover */}
      {showMentions && (
        <div className="absolute bottom-20 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto w-48">
          {membersList.map(member => (
            <button
              key={member.id}
              onClick={() => insertMention(member.full_name || member.email)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                {(member.full_name || member.email)[0].toUpperCase()}
              </div>
              <span className="truncate">{member.full_name || member.email}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
        <div className="flex gap-2">
          {/* Action Button: Create Ticket */}
          <button
            type="button"
            onClick={() => setShowCreateTicketModal(true)}
            className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Crear Tarea Rápida"
          >
            <Plus size={20} />
          </button>

          {/* Action Button: Assign Ticket */}
          <button
            type="button"
            onClick={openTicketAssignmentModal}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Asignar Tarea / Ticket"
          >
            <Ticket size={20} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Escribe un mensaje... Usa @ para mencionar"
            className="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      {/* Ticket Assignment Modal */}
      {showTicketModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 rounded-lg">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="text-blue-600" />
                Asignar Tarea
              </h3>
              <button onClick={() => setShowTicketModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seleccionar Ticket Pendiente
                </label>
                <select
                  value={selectedTicketId}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Seleccionar Ticket --</option>
                  {openTickets.map(ticket => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.issue} ({ticket.client?.full_name}) - {ticket.priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Asignar a Técnico/Miembro
                </label>
                <select
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- Seleccionar Responsable --</option>
                  {membersList.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.full_name || member.email} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end mt-6 gap-2">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAssignment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/30"
                >
                  Confirmar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 rounded-lg">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="text-green-600" />
                Crear Tarea Rápida
              </h3>
              <button onClick={() => setShowCreateTicketModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción de la Tarea / Ticket
                </label>
                <input
                  type="text"
                  value={newTicketIssue}
                  onChange={(e) => setNewTicketIssue(e.target.value)}
                  placeholder="Ej: Revisar conexión en calle 5"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prioridad
                </label>
                <div className="flex gap-2">
                  {['Baja', 'Media', 'Alta'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewTicketPriority(p)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        newTicketPriority === p
                          ? p === 'Alta' ? 'bg-red-100 text-red-700 border border-red-300' 
                            : p === 'Media' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => setShowCreateTicketModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicketIssue.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
