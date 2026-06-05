import React from 'react';
import { Vault, HandCoins, Store, Activity, PiggyBank, Wallet, Landmark } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

interface Preferences {
  showSpp: boolean;
  showZakat: boolean;
  showWakaf?: boolean;
  showInfaqYayasan: boolean;
  showKoperasi: boolean;
  showPoskestren: boolean;
  showTabungan: boolean;
  showTabunganSiswa?: boolean;
  showUangSaku: boolean;
}

export function YayasanWidgets({ 
  preferences,
  balances = {}
}: { 
  preferences: Preferences,
  balances?: Record<string, number>
}) {
  return (
    <>
      <WidgetCard 
        title="Dompet SPP" 
        amount={`Rp ${(balances['SPP'] || 0).toLocaleString('id-ID')}`} 
        type="Unrestricted" 
        icon={Vault} 
        colorType="emerald" 
        subtitle="Dana Utama Operasional Pesantren"
        isVisible={preferences.showSpp}
      />
      <WidgetCard 
        title="Dana Zakat" 
        amount={`Rp ${(balances['ZAKAT'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={HandCoins} 
        colorType="accent" 
        subtitle="Sharia Compliance Validator Active"
        isVisible={preferences.showZakat}
      />
      <WidgetCard 
        title="Dana Wakaf" 
        amount={`Rp ${(balances['YAYASAN'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={Landmark} 
        colorType="accent" 
        subtitle="Dana Abadi Produktif Pesantren"
        isVisible={preferences.showWakaf !== false}
      />
      <WidgetCard 
        title="Infaq & Sedekah Bebas" 
        amount={`Rp ${(balances['INFAQ'] || 0).toLocaleString('id-ID')}`} 
        type="Unrestricted" 
        icon={HandCoins} 
        colorType="emerald" 
        subtitle="Dana Bebas / Operasional Tambahan"
        isVisible={preferences.showInfaqYayasan}
      />
      <WidgetCard 
        title="Infaq & Sedekah Terikat" 
        amount={`Rp ${(balances['INFAQ_TERIKAT'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={HandCoins} 
        colorType="accent" 
        subtitle="Dana Dengan Pembatasan"
        isVisible={preferences.showInfaqYayasan}
      />
      <WidgetCard 
        title="Laba Usaha Koperasi" 
        amount={`Rp ${(balances['KOPERASI'] || 0).toLocaleString('id-ID')}`} 
        type="Unrestricted" 
        icon={Store} 
        colorType="emerald" 
        subtitle="Sisa Hasil Usaha Koperasi Santri"
        isVisible={preferences.showKoperasi}
      />
      <WidgetCard 
        title="Laba Usaha Poskestren" 
        amount={`Rp ${(balances['POSKESTREN'] || 0).toLocaleString('id-ID')}`} 
        type="Unrestricted" 
        icon={Activity} 
        colorType="emerald" 
        subtitle="Pendapatan Klinik / Pos Kesehatan"
        isVisible={preferences.showPoskestren}
      />
      <WidgetCard 
        title="Tabungan Wajib" 
        amount={`Rp ${(balances['TABUNGAN_WAJIB'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={PiggyBank} 
        colorType="accent" 
        subtitle="Titipan - Hanya dicairkan saat lulus"
        isVisible={preferences.showTabungan}
      />
      <WidgetCard 
        title="Tabungan Siswa" 
        amount={`Rp ${(balances['TABUNGAN_SISWA'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={PiggyBank} 
        colorType="accent" 
        subtitle="Tabungan Harian/Sukarela Santri"
        isVisible={preferences.showTabunganSiswa !== false}
      />
      <WidgetCard 
        title="Total Uang Saku" 
        amount={`Rp ${(balances['UANG_SAKU'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={Wallet} 
        colorType="accent" 
        subtitle="Titipan Orang Tua Santri"
        isVisible={preferences.showUangSaku}
      />
    </>
  );
}
