import React, { useState } from 'react';
import { 
  Bell, 
  Menu, 
  X, 
  Plus,
  Info
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeTab: string;
  profile: any;
  setIsModalOpen: (isOpen: boolean) => void;
}

export function Header({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  activeTab, 
  profile, 
  setIsModalOpen 
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-colors relative z-40">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-xl font-semibold capitalize text-gray-900 dark:text-white">{activeTab}</h1>
      </div>
      <div className="flex items-center gap-2 lg:gap-4">
        <ThemeToggle />
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full relative transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
          </button>

          {/* Panel de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h3>
              </div>
              <div className="p-4 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 min-h-[150px]">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm">No tienes notificaciones nuevas</p>
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
