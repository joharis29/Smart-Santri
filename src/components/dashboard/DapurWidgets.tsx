import React from 'react';
import { Utensils, TrendingDown, ClipboardCheck } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

interface Preferences {
  showSaldo: boolean;
  showAkumulasi: boolean;
  showSupplier: boolean;
}

export function DapurWidgets({ 
  preferences,
  balances = {}
}: { 
  preferences: Preferences;
  balances?: Record<string, number>
}) {
  return (
    <>
      <WidgetCard 
        title="Saldo Kas Saat Ini" 
        amount={`Rp ${(balances['KAS_INTERNAL'] || 0).toLocaleString('id-ID')}`} 
        type="Unrestricted" 
        icon={Utensils} 
        colorType="emerald" 
        subtitle="Dana Talang Belanja Harian"
        isVisible={preferences.showSaldo}
      />
      <WidgetCard 
        title="Akumulasi Pengeluaran" 
        amount={`Rp ${(balances['AKUMULASI_PENGELUARAN'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={TrendingDown} 
        colorType="accent" 
        subtitle="Total Belanja Bulan Ini"
        isVisible={preferences.showAkumulasi}
      />
    </>
  );
}
