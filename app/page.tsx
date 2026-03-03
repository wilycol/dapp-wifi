'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Wrench, 
  MessageSquare, 
  LayoutDashboard, 
  Plus, 
  Search, 
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Loader2,
  Send,
  Menu,
  X,
  MapPin,
  TrendingUp,
  DollarSign,
  LogOut
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/database.types';
import { sendClientNotification, notifyTicketUpdate } from '@/app/actions/messaging';
import { inviteUser } from '@/app/actions/invitations';
import { getCompanyMembers } from '@/app/actions/get-members';
import { StatCard } from '@/components/ui/StatCard';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import CompanyChat from '@/components/dashboard/CompanyChat';

const supabase = createClient();

const clientSchema = z.object({
  name: z.string().min(3, 'El nombre es muy corto'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(7, 'Teléfono inválido'),
  address: z.string().min(5, 'Dirección requerida'),
  plan: z.string().min(1, 'Selecciona un plan'),
  contract_number: z.string().min(1, 'Número de contrato requerido'),
  ip_mac: z.string().optional(),
  monthly_amount: z.coerce.number().min(0),
  due_date: z.coerce.number().min(1).max(31),
 
  status: z.enum(['Activo', 'En Mora', 'Cortado']),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      // --- MODO DESARROLLO: BYPASS LOGIN ---
      // Si estamos en localhost y quieres saltar el login para ver el dashboard
      // Cambia esta variable a true temporalmente
      const isDevBypass = true; // CAMBIAR A false PARA PRODUCCION

      if (isDevBypass && process.env.NODE_ENV === 'development') {
        console.log('⚡ MODO DEV: Saltando Login con usuario Admin Real');
        // Usamos el ID del perfil Admin encontrado en la BD
        const adminUserId = '97807d28-5bca-475e-80f3-b7f40ed9f3c5';
        const adminCompanyId = '470bd945-3e8f-426a-a8a3-64a1c15e1c35';
        
        setUser({ 
          id: adminUserId, 
          email: 'admin-test@example.com',
          role: 'authenticated',
          user_metadata: {
            avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocL-...' // Mock url or empty to test fallback
          }
        });
        
        setProfile({
          id: adminUserId,
          email: 'admin-test@example.com',
          role: 'Admin',
          company_id: adminCompanyId,
          first_name: 'User A',
          last_name: 'Test',
          full_name: 'User A Test',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' // Avatar de prueba para verificar visualización
        });
        setCompanyName('Dapp WiFi (Dev Mode)');
        setLoading(false);
        return;
      }
      // -------------------------------------

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Merge user email if not in profile (for display purposes)
      const profileWithEmail = {
        ...profile,
        email: profile?.email || user.email,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
      };
      
      setProfile(profileWithEmail);

      // Redirect to onboarding if no company_id and not superadmin
      if (profileWithEmail && !profileWithEmail.company_id && profileWithEmail.role?.toLowerCase() !== 'superadmin') {
        router.push('/onboarding');
        return;
      }

      // Fetch Company Name
      if (profileWithEmail?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', profileWithEmail.company_id)
          .single();
        
        if (companyData) {
          setCompanyName(companyData.name);
        }
      }
      
      setLoading(false);
    }
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <ReportsView />;
      case 'clients': return <ClientsView role={profile?.role} />;
      case 'installers': return <InstallersView profile={profile} />;
      case 'support': return <SupportView />;
      case 'settings': return <SettingsView profile={profile} />;
      default: return <ReportsView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors">
      {/* Sidebar */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsSidebarOpen={setIsSidebarOpen}
        profile={profile}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeTab={activeTab}
          profile={profile}
          setIsModalOpen={setIsModalOpen}
          companyName={companyName}
        />

        {/* View Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>

      {isModalOpen && (
        <ClientModal 
          companyId={profile?.company_id}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            window.location.reload(); 
          }} 
        />
      )}
    </div>
  );
}

function ReportsView() {
  const [stats, setStats] = useState({
    active: 0,
    mora: 0,
    cut: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data: clients } = await supabase.from('clients').select('status, monthly_amount');
      if (clients) {
        const s = clients.reduce((acc, c) => {
          if (c.status === 'Activo') acc.active++;
          if (c.status === 'En Mora') acc.mora++;
          if (c.status === 'Cortado') acc.cut++;
          if (c.status === 'Activo' && c.monthly_amount) acc.revenue += Number(c.monthly_amount || 0);
          return acc;
        }, { active: 0, mora: 0, cut: 0, revenue: 0 });
        setStats(s);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Clientes Activos" value={stats.active} icon={<CheckCircle2 className="text-green-600" />} color="bg-green-50" />
        <StatCard title="En Mora" value={stats.mora} icon={<Clock className="text-yellow-600" />} color="bg-yellow-50" />
        <StatCard title="Cortados" value={stats.cut} icon={<AlertCircle className="text-red-600" />} color="bg-red-50" />
        <StatCard title="Ingresos Estimados" value={`$${stats.revenue.toLocaleString()}`} icon={<DollarSign className="text-blue-600" />} color="bg-blue-50" />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <TrendingUp size={20} className="text-blue-600" />
          Resumen de Operaciones
        </h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-lg text-gray-400 dark:text-gray-500">
          [Gráfico de Crecimiento Mensual - Próxima Fase]
        </div>
      </div>
    </div>
  );
}

function ClientsView({ role }: { role: string }) {
  const [clients, setClients] = useState<Tables<'clients'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setClients(data);
    setLoading(false);
  }

  const filteredClients = clients.filter(c => 
    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Buscar cliente por nombre o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transition-colors"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan / Monto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{client.full_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin size={12} /> {client.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{client.plan}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">${client.monthly_amount} / mes</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'Activo' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      client.status === 'En Mora' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank')}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="WhatsApp"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InstallersView({ profile }: { profile: any }) {
  const [subTab, setSubTab] = useState<'list' | 'chat'>('list');
  const [installers, setInstallers] = useState<Tables<'installers'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetch() {
      if (!profile?.company_id) return;

      // 1. Get allowed members (security filter applied on server)
      const membersResult = await getCompanyMembers(profile.company_id);
      let allowedIds = new Set<string>();
      
      if (membersResult.success && membersResult.members) {
        membersResult.members.forEach((m: any) => allowedIds.add(m.id));
      }

      // 2. Fetch installers data
      const { data } = await supabase.from('installers').select('*');
      
      if (data) {
        // 3. Filter out installers that are not in the allowed members list (hides SuperAdmin)
        const filtered = data.filter(i => allowedIds.has(i.id));
        setInstallers(filtered);
      }
      setLoading(false);
    }
    fetch();

    // Realtime Presence Logic
    if (profile?.id && profile?.company_id) {
      const channel = supabase.channel(`presence:${profile.company_id}`, {
        config: {
          presence: {
            key: profile.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          const onlineIds = new Set(Object.keys(newState));
          setOnlineUsers(onlineIds);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ 
              online_at: new Date().toISOString(),
              user_id: profile.id 
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setSubTab('list')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            subTab === 'list'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Integrantes Del equipo
        </button>
        <button
          onClick={() => setSubTab('chat')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            subTab === 'chat'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Chat de Equipo
        </button>
      </div>

      {subTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installers.map(installer => {
            const isOnline = onlineUsers.has(installer.id);
            return (
              <div key={installer.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors relative overflow-hidden">
                {/* Connection Status Indicator Line */}
                <div className={`absolute top-0 left-0 w-full h-1 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                      {installer.name[0]}
                    </div>
                    {/* Online Dot */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                      isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    installer.status === 'Disponible' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  }`}>
                    {installer.status}
                  </span>
                </div>
                
                <div className="mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {installer.name}
                  </h3>
                  <p className={`text-xs font-medium ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                    {isOnline ? '● Conectado' : '○ Desconectado'}
                  </p>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{installer.phone || 'Sin teléfono'}</p>
                <button className="w-full py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors">
                  Asignar Tarea
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <CompanyChat profile={profile} onClose={() => setSubTab('list')} />
      )}
    </div>
  );
}

function SupportView() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('support_tickets')
        .select('*, clients(full_name, address)')
        .order('created_at', { ascending: false });
      if (data) setTickets(data);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <div key={ticket.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${
                ticket.priority === 'Alta' ? 'bg-red-500' : ticket.priority === 'Media' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></span>
              <h4 className="font-bold text-gray-900 dark:text-white">{ticket.title || ticket.issue || 'Sin Asunto'}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.clients?.full_name || 'Sin Cliente'} - {ticket.clients?.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded transition-colors">{ticket.status}</span>
            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientModal({ onClose, onSuccess, companyId }: { onClose: () => void, onSuccess: () => void, companyId: string }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      status: 'Activo',
      due_date: 5,
      monthly_amount: 30
    }
  });

  const onSubmit = async (data: ClientFormValues) => {
    setLoading(true);
    // Insertamos el cliente con el company_id del usuario actual
    const { name, ...rest } = data;
    const { error } = await supabase.from('clients').insert([{
      full_name: name,
      ...rest,
      company_id: companyId
    }]);
    
    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10 transition-colors">
          <h2 className="text-xl font-bold">Nuevo Cliente</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Nombre Completo" error={errors.name?.message}>
              <input {...register('name')} className="form-input-dapp" placeholder="Ej: Juan Pérez" />
            </FormField>
            <FormField label="Teléfono (WhatsApp)" error={errors.phone?.message}>
              <input {...register('phone')} className="form-input-dapp" placeholder="+504 9999-9999" />
            </FormField>
            <FormField label="Dirección Exacta" error={errors.address?.message}>
              <input {...register('address')} className="form-input-dapp" placeholder="Barrio, Calle, Casa..." />
            </FormField>
            <FormField label="Número de Contrato" error={errors.contract_number?.message}>
              <input {...register('contract_number')} className="form-input-dapp" placeholder="WIFI-2024-001" />
            </FormField>
            <FormField label="Plan de Internet" error={errors.plan?.message}>
              <select {...register('plan')} className="form-input-dapp">
                <option value="50 Mbps Básico">50 Mbps Básico</option>
                <option value="100 Mbps Fibra">100 Mbps Fibra</option>
                <option value="200 Mbps Premium">200 Mbps Premium</option>
              </select>
            </FormField>
            <FormField label="Monto Mensual ($)" error={errors.monthly_amount?.message}>
              <input type="number" {...register('monthly_amount')} className="form-input-dapp" />
            </FormField>
            <FormField label="Día de Pago" error={errors.due_date?.message}>
              <input type="number" {...register('due_date')} className="form-input-dapp" min="1" max="31" />
            </FormField>
            <FormField label="Estado Inicial" error={errors.status?.message}>
              <select {...register('status')} className="form-input-dapp">
                <option value="Activo">Activo</option>
                <option value="En Mora">En Mora</option>
                <option value="Cortado">Cortado</option>
              </select>
            </FormField>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FormField = ({ label, error, children }: any) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

function SettingsView({ profile }: { profile: any }) {
  const [activeSettingsTab, setActiveSettingsTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  // Invitation Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteMethod, setInviteMethod] = useState<'whatsapp' | 'email' | null>(null);
  
  const { register: registerInvite, handleSubmit: handleSubmitInvite, reset: resetInvite, formState: { errors: inviteErrors } } = useForm();

  useEffect(() => {
    async function fetchData() {
      if (profile?.company_id) {
        // Fetch Company Data
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
        
        if (companyData) {
          setCompany(companyData);
          setValue('company_name', companyData.name);
          setValue('company_address', companyData.address);
          setValue('company_phone', companyData.phone);
          setValue('company_email', companyData.email);
        }

        // Fetch Members
        const result = await getCompanyMembers(profile.company_id);
        if (result.success) {
          setMembers(result.members || []);
        } else {
          console.error('Error fetching members:', result.error);
        }
      }
    }
    fetchData();
  }, [profile, setValue]);

  const onUpdateCompany = async (data: any) => {
    setLoading(true);
    const { error } = await supabase
      .from('companies')
      .update({
        name: data.company_name,
        address: data.company_address,
        phone: data.company_phone,
        email: data.company_email
      })
      .eq('id', profile.company_id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      alert('Datos de la empresa actualizados correctamente');
    }
    setLoading(false);
  };

  const onInviteUser = async (data: any, method: 'whatsapp' | 'email') => {
    setInviteLoading(true);
    setInviteMethod(method);
    
    // Pasamos true como cuarto argumento solo si el método es email
    const result = await inviteUser(data.email, data.role, profile.company_id, method === 'email');
    
    if (result.success && result.inviteLink) {
      setInviteLink(result.inviteLink);
      
      if (method === 'whatsapp') {
        const message = `Hola, te invito a unirte a ${company?.name || 'nuestro equipo'} en Dapp WiFi. Haz clic aquí para registrarte: ${result.inviteLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else if (method === 'email') {
        if (result.warning) {
          alert('Invitación creada, pero hubo un problema al enviar el correo: ' + result.warning);
        } else {
          // Éxito al enviar correo
        }
      }
    } else {
      alert('Error al crear invitación: ' + result.error);
    }
    setInviteLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Enlace copiado al portapapeles');
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteLink('');
    setInviteMethod(null);
    resetInvite();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button 
          onClick={() => setActiveSettingsTab('company')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeSettingsTab === 'company' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          Datos de la Empresa
        </button>
        <button 
          onClick={() => setActiveSettingsTab('team')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeSettingsTab === 'team' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          Equipo y Empleados
        </button>
      </div>

      {activeSettingsTab === 'company' ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors max-w-2xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Información del Negocio</h3>
          <form onSubmit={handleSubmit(onUpdateCompany)} className="space-y-4">
            <FormField label="Nombre del Negocio" error={errors.company_name?.message as string}>
              <input {...register('company_name', { required: 'Nombre requerido' })} className="form-input-dapp" />
            </FormField>
            <FormField label="Dirección Fiscal" error={errors.company_address?.message as string}>
              <input {...register('company_address', { required: 'Dirección requerida' })} className="form-input-dapp" />
            </FormField>
            <FormField label="Teléfono de Contacto" error={errors.company_phone?.message as string}>
              <input {...register('company_phone', { required: 'Teléfono requerido' })} className="form-input-dapp" />
            </FormField>
            <FormField label="Correo Electrónico" error={errors.company_email?.message as string}>
              <input {...register('company_email', { required: 'Email requerido' })} className="form-input-dapp" />
            </FormField>
            
            <div className="pt-4">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Miembros del Equipo</h3>
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Invitar Miembro
            </button>
          </div>
          
          {/* Invite Modal */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invitar Nuevo Miembro</h3>
                  <button onClick={closeInviteModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6">
                  {!inviteLink ? (
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                      <FormField label="Correo Electrónico del Invitado" error={inviteErrors.email?.message as string}>
                        <input 
                          {...registerInvite('email', { 
                            required: 'El correo es obligatorio',
                            pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' }
                          })} 
                          className="form-input-dapp w-full" 
                          placeholder="usuario@ejemplo.com"
                        />
                      </FormField>
                      
                      <FormField label="Rol Asignado">
                        <select {...registerInvite('role')} className="form-input-dapp w-full">
                          <option value="tecnico">Técnico</option>
                          <option value="cobrador">Cobrador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </FormField>

                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button 
                          type="button" 
                          onClick={handleSubmitInvite((data) => onInviteUser(data, 'whatsapp'))}
                          disabled={inviteLoading}
                          className="flex flex-col items-center justify-center gap-2 p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-green-700 dark:text-green-400"
                        >
                          <MessageSquare size={24} />
                          <span className="font-medium">Vía WhatsApp</span>
                        </button>
                        
                        <button 
                          type="button"
                          onClick={handleSubmitInvite((data) => onInviteUser(data, 'email'))}
                          disabled={inviteLoading}
                          className="flex flex-col items-center justify-center gap-2 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-blue-700 dark:text-blue-400"
                        >
                          <Send size={24} />
                          <span className="font-medium">Vía Email</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6 text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">¡Invitación Generada!</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comparte este enlace con el nuevo miembro</p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg break-all text-sm font-mono text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {inviteLink}
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={copyToClipboard}
                          className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Copiar Enlace
                        </button>
                        {inviteMethod === 'whatsapp' && (
                          <a 
                            href={`https://wa.me/?text=${encodeURIComponent(`Hola, te invito a unirte a ${company?.name} en Dapp WiFi. Haz clic aquí: ${inviteLink}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={18} />
                            WhatsApp
                          </a>
                        )}
                      </div>
                      
                      <button 
                        onClick={closeInviteModal}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                      >
                        Cerrar y volver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => (
              <div key={member.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                    {member.first_name?.[0] || member.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{member.full_name || 'Usuario'}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded uppercase font-medium">
                    {member.role}
                  </span>
                  <button className="text-red-500 hover:text-red-700 text-sm font-medium">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
