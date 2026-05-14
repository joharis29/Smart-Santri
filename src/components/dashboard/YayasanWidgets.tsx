import React from 'react';
import { Vault, HandCoins, Store, Activity, PiggyBank, Wallet } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

interface Preferences {
  showSpp: boolean;
  showZakat: boolean;
  showInfaqYayasan: boolean;
  showKoperasi: boolean;
  showPoskestren: boolean;
  showTabungan: boolean;
  showUangSaku: boolean;
}

export function YayasanWidgets({ 
  preferences,
  simulatedBalances 
}: { 
  preferences: Preferences,
  simulatedBalances?: { spp: number, yayasan: number }
}) {
  return (
    <>
      <WidgetCard 
        title="Dompet SPP" 
        amount={`Rp ${simulatedBalances?.spp.toLocaleString('id-ID') || '450.000.000'}`} 
        type="Unrestricted" 
        icon={Vault} 
        colorType="emerald" 
        subtitle="Dana Utama Operasional Pesantren"
        isVisible={preferences.showSpp}
      />
      <WidgetCard 
        title="Dana Zakat" 
        amount="Rp 75.000.000" 
        type="Restricted" 
        icon={HandCoins} 
        colorType="accent" 
        subtitle="Sharia Compliance Validator Active"
        isVisible={preferences.showZakat}
      />
      <WidgetCard 
        title="Infaq Pesantren/Yayasan" 
        amount={`Rp ${simulatedBalances?.yayasan.toLocaleString('id-ID') || '15.000.000'}`} 
        type="Unrestricted" 
        icon={HandCoins} 
        colorType="emerald" 
        subtitle="Dana Bebas / Operasional Tambahan"
        isVisible={preferences.showInfaqYayasan}
      />
      <WidgetCard 
        title="Laba Usaha Koperasi" 
        amount="Rp 12.500.000" 
        type="Unrestricted" 
        icon={Store} 
        colorType="emerald" 
        subtitle="Sisa Hasil Usaha Koperasi Santri"
        isVisible={preferences.showKoperasi}
      />
      <WidgetCard 
        title="Laba Usaha Poskestren" 
        amount="Rp 3.200.000" 
        type="Unrestricted" 
        icon={Activity} 
        colorType="emerald" 
        subtitle="Pendapatan Klinik / Pos Kesehatan"
        isVisible={preferences.showPoskestren}
      />
      <WidgetCard 
        title="Tabungan Wajib Santri" 
        amount="Rp 120.000.000" 
        type="Restricted" 
        icon={PiggyBank} 
        colorType="accent" 
        subtitle="Titipan - Hanya dicairkan saat lulus"
        isVisible={preferences.showTabungan}
      />
      <WidgetCard 
        title="Total Uang Saku" 
        amount="Rp 85.000.000" 
        type="Restricted" 
        icon={Wallet} 
        colorType="accent" 
        subtitle="Titipan Orang Tua Santri"
        isVisible={preferences.showUangSaku}
      />
    </>
  );
}
