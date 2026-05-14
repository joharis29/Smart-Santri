import React from 'react';
import { Utensils, TrendingDown, ClipboardCheck } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

interface Preferences {
  showSaldo: boolean;
  showAkumulasi: boolean;
  showSupplier: boolean;
}

export function DapurWidgets({ preferences }: { preferences: Preferences }) {
  return (
    <>
      <WidgetCard 
        title="Saldo Kas Saat Ini" 
        amount="Rp 4.500.000" 
        type="Unrestricted" 
        icon={Utensils} 
        colorType="emerald" 
        subtitle="Dana Talang Belanja Harian"
        isVisible={preferences.showSaldo}
      />
      <WidgetCard 
        title="Akumulasi Pengeluaran" 
        amount="Rp 12.300.000" 
        type="Restricted" 
        icon={TrendingDown} 
        colorType="accent" 
        subtitle="Total Belanja Bulan Ini"
        isVisible={preferences.showAkumulasi}
      />
      <WidgetCard 
        title="Tagihan Koperasi (Supplier)" 
        amount="LUNAS" 
        type="Unrestricted" 
        icon={ClipboardCheck} 
        colorType="emerald" 
        subtitle="Pembayaran Bulan Sebelumnya"
        isVisible={preferences.showSupplier}
      />
    </>
  );
}
