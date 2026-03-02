import React from 'react';
import { 
  Users, 
  Wrench, 
  MessageSquare, 
  LayoutDashboard, 
  LogOut
} from 'lucide-react';
import Image from 'next/image';
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
      fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 flex items-center gap-2">
        <div className="relative w-10 h-10">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">WiFiManager</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {['admin', 'superadmin', 'cobros'].includes(profile?.role?.toLowerCase()) && (
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
          />
        )}
        {['admin', 'superadmin', 'cobros'].includes(profile?.role?.toLowerCase()) && (
          <NavItem 
            icon={<Users size={20} />} 
            label="Clientes" 
            active={activeTab === 'clients'} 
            onClick={() => { setActiveTab('clients'); setIsSidebarOpen(false); }} 
          />
        )}
        {['admin', 'superadmin'].includes(profile?.role?.toLowerCase()) && (
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

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 p-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
            {profile?.role?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{profile?.email?.split('@')[0]}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.role}</p>
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
