'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { getCompanyMembers } from '@/app/actions/get-members';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface CompanyChatProps {
  profile: any;
}

export default function CompanyChat({ profile }: CompanyChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [membersMap, setMembersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!profile?.company_id) return;

    // 1. Fetch members for names
    const fetchMembers = async () => {
      const result = await getCompanyMembers(profile.company_id);
      if (result.success && result.members) {
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.company_id, supabase, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    const { error } = await supabase.from('company_messages').insert({
      company_id: profile.company_id,
      sender_id: profile.id,
      content: msg,
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
      setNewMessage(msg); // Restore if failed
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Cargando chat...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          Chat General del Equipo
        </h3>
        <p className="text-xs text-gray-500">Comunicación interna segura</p>
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
            
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs font-bold mb-1 opacity-70 text-blue-600 dark:text-blue-400">
                      {senderName}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'} text-right`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
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
    </div>
  );
}
