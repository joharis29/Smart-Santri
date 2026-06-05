import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

export function UniversalCashFlowWidgets({ 
  balances = {}
}: { 
  balances?: Record<string, number>
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 border-t border-slate-100 pt-3">
      <WidgetCard 
        title="Total Pemasukan (Tahun Ajaran Ini)" 
        amount={`Rp ${(balances['AKUMULASI_PEMASUKAN'] || 0).toLocaleString('id-ID')}`} 
        type="Unrestricted" 
        icon={TrendingUp} 
        colorType="emerald" 
        subtitle="Akumulasi Seluruh Dana Masuk"
        isVisible={true}
        hideBadge={true}
        bgClass="bg-emerald-100"
        titleClass="text-emerald-900 text-xs font-black"
        amountClass="text-emerald-900"
      />
      <WidgetCard 
        title="Total Pengeluaran (Tahun Ajaran Ini)" 
        amount={`Rp ${(balances['AKUMULASI_PENGELUARAN'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={TrendingDown} 
        colorType="accent" 
        subtitle="Akumulasi Seluruh Belanja / LPJ"
        isVisible={true}
        hideBadge={true}
        bgClass="bg-yellow-200"
        titleClass="text-yellow-900 text-xs font-black"
        amountClass="text-yellow-900"
      />
    </div>
  );
}
