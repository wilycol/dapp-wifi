import React from 'react';

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const NavItem = ({ icon, label, active, onClick }: NavItemProps) => {
  const activeClass = active
    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white';

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
