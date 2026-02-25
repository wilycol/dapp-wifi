import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
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
