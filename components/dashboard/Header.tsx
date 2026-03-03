import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  X, 
  Plus,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeTab: string;
  profile: any;
  setIsModalOpen: (isOpen: boolean) => void;
  companyName?: string;
}

export function Header({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  activeTab, 
  profile, 
  setIsModalOpen,
  companyName
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!profile?.id) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications' as any)
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('notifications_header')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications' as any).update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-colors relative z-40">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {companyName || 'Dapp WiFi'}
          </h1>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {activeTab === 'dashboard' ? 'Panel Principal' :
             activeTab === 'clients' ? 'Clientes' :
             activeTab === 'installers' ? 'Operaciones' :
             activeTab === 'support' ? 'Soporte' :
             activeTab === 'settings' ? 'Configuración' : activeTab}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-4">
        <ThemeToggle />
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full relative transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            )}
          </button>

          {/* Panel de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h3>
                {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 min-h-[150px]">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                      <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm">No tienes notificaciones nuevas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex gap-3">
                          <div className="mt-1 shrink-0">
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="shrink-0 mt-2">
                              <span className="block w-2 h-2 bg-blue-500 rounded-full"></span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {['admin', 'superadmin'].includes(profile?.role?.toLowerCase()) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 lg:px-4 lg:py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden lg:inline">Nuevo Cliente</span>
          </button>
        )}
      </div>
    </header>
  );
}
