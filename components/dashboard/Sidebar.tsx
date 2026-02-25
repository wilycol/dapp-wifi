import React from 'react';
import { 
  Users, 
  Wrench, 
  MessageSquare, 
  LayoutDashboard, 
  Wifi, 
  LogOut
} from 'lucide-react';
import { NavItem } from '../ui/NavItem';

interface SidebarProps {
  isSidebarOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  profile: any;
  handleLogout: () => void;
}

export function Sidebar({ 
  isSidebarOpen, 
  activeTab, 
  setActiveTab, 
  setIsSidebarOpen, 
  profile, 
  handleLogout 
}: SidebarProps) {
  return (
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
  );
}
