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
  Wifi, 
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
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
      
      setProfile(profile);
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
    // Role-based access control
    if (profile?.role === 'Tecnico') {
      return <SupportView />; 
    }

    switch (activeTab) {
      case 'dashboard': return <ReportsView />;
      case 'clients': return <ClientsView role={profile?.role} />;
      case 'installers': return <InstallersView />;
      case 'support': return <SupportView />;
      default: return <ReportsView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Wifi className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">WiFiManager</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {(profile?.role === 'Admin' || profile?.role === 'SuperAdmin' || profile?.role === 'Cobros') && (
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            />
          )}
          {(profile?.role === 'Admin' || profile?.role === 'SuperAdmin' || profile?.role === 'Cobros') && (
            <NavItem 
              icon={<Users size={20} />} 
              label="Clientes" 
              active={activeTab === 'clients'} 
              onClick={() => { setActiveTab('clients'); setIsSidebarOpen(false); }} 
            />
          )}
          {(profile?.role === 'Admin' || profile?.role === 'SuperAdmin') && (
            <NavItem 
              icon={<Wrench size={20} />} 
              label="Instaladores" 
              active={activeTab === 'installers'} 
              onClick={() => { setActiveTab('installers'); setIsSidebarOpen(false); }} 
            />
          )}
          <NavItem 
            icon={<MessageSquare size={20} />} 
            label="Soporte" 
            active={activeTab === 'support'} 
            onClick={() => { setActiveTab('support'); setIsSidebarOpen(false); }} 
          />
        </nav>

        <div className="p- Ministers border-t border-gray-200">
          <div className="flex items-center gap-3 p-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {profile?.role?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            {(profile?.role === 'Admin' || profile.role === 'SuperAdmin') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 lg:px-4 lg:py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                <span className="hidden lgd lg:inline">Nuevo Cliente</span>
              </button>
            )}
          </div>
        </header>

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

const NavItem = ({ icon, label, active, onClick }: any) => {
  const activeClass = active
    ? 'bg-blue-50 text-blue-700'
    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeClass}`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  );
};

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className={`p-6 rounded-xl border border-gray-200 ${color} flex items-center gap-4`}>
      <div className="p-3 bg-white rounded-lg shadow-sm">{icon}</div>
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
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
          if (c.status === 'Activo') acc.revenue += Number(c.monthly_amount || 0);
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

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          Resumen de Operaciones
        </h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg text-gray-400">
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
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan / Monto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {client.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{client.plan}</div>
                    <div className="text-xs text-blue-600">${client.monthly_amount} / mes</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'Activo' ? 'bg-green-100 text-green-700' :
                      client.status === 'En Mora' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="WhatsApp"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
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

function InstallersView() {
  const [installers, setInstallers] = useState<Tables<'installers'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('installers').select('*');
      if (data) setInstallers(data);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {installers.map(installer => (
        <div key={installer.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {installer.name[0]}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              installer.status === 'Disponible' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {installer.status}
            </span>
          </div>
          <h3 className="font-bold text-gray-900">{installer.name}</h3>
          <p className="text-sm text-gray-500 mb-4">{installer.phone}</p>
          <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Asignar Tarea
          </button>
        </div>
      ))}
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
        .select('*, clients(name, address)')
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
        <div key={ticket.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${
                ticket.priority === 'Alta' ? 'bg-red-500' : ticket.priority === 'Media' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></span>
              <h4 className="font-bold text-gray-900">{ticket.issue}</h4>
            </div>
            <p className="text-sm text-gray-600">{ticket.clients?.name} - {ticket.clients?.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">{ticket.status}</span>
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
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'Activo',
      due_date: 5,
      monthly_amount: 30
    }
  });

  const onSubmit = async (data: ClientFormValues) => {
    setLoading(true);
    // Insertamos el cliente con el company_id del usuario actual
    const { error } = await supabase.from('clients').insert([{
      ...data,
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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Nuevo Cliente</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);
