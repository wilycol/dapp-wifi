import React from 'react';
import { 
  Bell, 
  Menu, 
  X, 
  Plus 
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
  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-colors">
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
        <button className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full relative">
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
  );
}
