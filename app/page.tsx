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
    if (profile?.role === 'Tecnico' && (activeTab === 'dashboard' || activeTab === 'clients')) {
      return <SupportView />; // Technicians only see support/maintenance
    }
    if (profile?.role === 'Cobros' && activeTab === 'installers') {
      return <ReportsView />; // Billing operators don't see installers
    }

    switch (activeTab) {
      case 'dashboard': return <ReportsView />;
      case 'clients': return <ClientsView />;
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
              onClick={() =>d { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
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

        <div className="p-4 border-t border-gray-200">
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
            {(profile?.role === 'Admin' || profile?.role === 'SuperAdmin') && (
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

        {/* View Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>

      {isModalOpen && (
        <ClientModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            // We'll need a way to refresh the list, for now simple reload or state lift
            window.location.reload(); 
          }} 
        />
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

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
          if (c.status === 'Activo') Plan') acc.revenue += Number(c.monthly_amount || 0);
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

function ClientsView() {
  const [clients, setClients] = useState<Tables<'clients'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setClients(data);
    setLoading(false);
  }

  async function handleQuickMessage(clientId: string, name: string) {
    setIsSending(clientId);
    const result = await sendClientNotification(clientId, `Hola ${name}, gracias por preferir nuestro servicio de WiFi. ¿En qué podemos ayudarte hoy?`);
    if (result.success) {
      alert(`Mensaje enviado a ${name}`);
    }
    setIsSending(null);
  }

  const openInMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar clientes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente / Contrato</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP / MAC</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto / Corte</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No se encontraron clientes</td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-xs text-gray-500">Contrato: {client.contract_number || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{client.ip_mac || '---'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'Activo' ? 'bg-green-100 text-green-800' : 
                      client.status === 'En Mora' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">${Number(client.monthly_amount || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Día de corte: {client.due_date || 5}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openInMaps(client.address)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver en Google Maps"
                      >
                        <MapPin size={18} />
                      </button>
                      <button 
                        onClick={() => handleQuickMessage(client.id, client.name)}
                        disabled={isSending === client.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Enviar mensaje de bienvenida"
                      >
                        {isSending === client.id ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InstallersView() {
  const [installers, setInstallers] = useState<Tables<'installers'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstallers();
  }, []);

  async function fetchInstallers() {
    setLoading(true);
    const { data } = await supabase.from('installers').select('*');
    if (data) setInstallers(data);
    setLoading(false);
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {installers.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-500">No hay instaladores registrados</div>
      ) : (
        installers.map((installer) => (
          <div key={installer.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Wrench size={24} />
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                installer.status === 'Disponible' ? 'bg-green-100 text-green-800' : 
                installer.status === 'En Ruta' ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {installer.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-1">{installer.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{installer.phone || 'Sin teléfono'}</p>
            <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Ver Perfil
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function SupportView() {
  const [tickets, setTickets] = useState<(Tables<'support_tickets'> & { clients: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    
    if (data) setTickets(data as any);
    setLoading(false);
  }

  async function handleStatusUpdate(ticketId: string, currentStatus: string) {
    setUpdatingId(ticketId);
    const nextStatus = currentStatus === 'Abierto' ? 'En Proceso' : 'Cerrado';
    
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: nextStatus as any })
      .eq('id', ticketId);

    if (!error) {
      await notifyTicketUpdate(ticketId, nextStatus);
      await fetchTickets();
    }
    setUpdatingId(null);
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No hay tickets de soporte</div>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                ticket.status === 'Abierto' ? 'bg-red-50 text-red-600' : 
                ticket.status === 'En Proceso' ? 'bg-yellow-50 text-yellow-600' : 
                'bg-green-50 text-green-600'
              }`}>
                {ticket.status === 'Abierto' ? <AlertCircle size={24} /> : 
                 ticket.status === 'En Proceso' ? <Clock size={24} /> : 
                 <CheckCircle2 size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">#{ticket.id.slice(0, 8)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    ticket.priority === 'ebaAlta' ? 'bg-red-100 text-red-700' :
                    ticket.priority === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900">{ticket.issue}</h4>
                <p className="text-sm text-gray-500">{ticket.clients?.name || 'Cliente desconocido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {ticket.status !== 'Cerrado' && (
                <button 
                  onClick={() => handleStatusUpdate(ticket.id, ticket.status || 'Abierto')}
                  disabled={updatingId === ticket.id}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingId === ticket.id && <Loader2 size={14} className="animate-spin" />}
                  {ticket.status === 'Abierto' ? 'Iniciar Proceso' : 'Cerrar Ticket'}
                </button>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ClientModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'Activo',
      due_date: 5,
      monthly_amount: 50000
    }
  });

  const onSubmit = async (data: ClientFormValues) => {
    setLoading(true);
    const { error } = await supabase.from('clients').insert([data]);
    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Registrar Nuevo Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Nombre Completo" error={errors.name?.message}>
              <input {...register('name')} className="form-input-dapp" placeholder="Ej: Juan Pérez" />
            </FormField>
            
            <FormField label="Número de Contrato" error={errors.contract_number?.message}>
              <input {...register('contract_number')} className="form-input-dapp" placeholder="Ej: CNT-001" />
            </FormField>

            <FormField label="Teléfono" error={errors.phone?.message}>
              <input {...register('phone')} className="form-input-dapp" placeholder="+57 300..." />
            </FormField>

            <FormField label="Email (Opcional)" error={errors.email?.message}>
              <input {...register('email')} className="form-input-dapp" placeholder="correo@ejemplo.com" />
            </FormField>

            <FormField label="Dirección" error={errors.address?.message}>
              <input {...register('address')} className="form-input-dapp" placeholder="Calle 123 #45-67" />
            </FormField>

            <FormField label="IP / MAC" error={errors.ip_mac?.message}>
              <input {...register('ip_mac')} className="form-input-dapp" placeholder="192.168.1.50" />
            </FormField>

            <FormField label="Plan de Internet" error={errors.plan?.message}>
              <select {...register('plan')} className="form-input-dapp">
                <option value="50 Mbps">50 Mbps Básico</option>
                <option value="100 Mbps">100 Mbps Fibra</option>
                <option value="300 Mbps">300 Mbps Pro</option>
              </select>
            </FormField>

            <FormField label="Monto Mensual ($)" error={errors.monthly_amount?.message}>
              <input type="number" {...register('monthly_amount')} className="form-input-dapp" />
            </FormField>

            <FormField label="Día de Corte" error={errors.due_date?.message}>
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
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, children, error }: { label: string, children: React.ReactNode, error?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
