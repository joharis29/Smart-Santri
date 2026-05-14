import React from 'react';
import { LucideIcon } from 'lucide-react';

interface WidgetCardProps {
  title: string;
  amount: string;
  type: 'Restricted' | 'Unrestricted';
  icon: LucideIcon;
  colorType?: 'primary' | 'accent' | 'slate' | 'emerald';
  subtitle?: string;
  isVisible?: boolean;
}

export function WidgetCard({ 
  title, 
  amount, 
  type, 
  icon: Icon, 
  colorType = 'primary', 
  subtitle,
  isVisible = true 
}: WidgetCardProps) {
  if (!isVisible) return null;

  const bgBorderMap = {
    primary: 'border-primary',
    accent: 'border-accent',
    slate: 'border-slate-500',
    emerald: 'border-emerald-500'
  };

  const typeBadgeMap = {
    Restricted: 'bg-amber-100 text-amber-700 border border-amber-200',
    Unrestricted: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${bgBorderMap[colorType]} p-3 hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-1.5">
        <span className={`${typeBadgeMap[type]} text-[8px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider`}>
          {type === 'Restricted' ? 'Dana Dengan Pembatasan' : 'Dana Tanpa Pembatasan'}
        </span>
        <Icon className="text-slate-300 w-4 h-4" />
      </div>
      <p className="text-slate-500 text-xs font-semibold mb-0.5 truncate">{title}</p>
      <h3 className={`text-xl font-extrabold ${colorType === 'emerald' ? 'text-slate-900' : 'text-primary'} tracking-tight`}>
        {amount}
      </h3>
      {subtitle && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-slate-400 border-t border-slate-50 pt-1.5">
          <span className="truncate">{subtitle}</span>
        </div>
      )}
    </div>
  );
}
