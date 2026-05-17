import React from 'react';
import { Home, Wallet, Banknote, PiggyBank } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

interface Preferences {
  showYayasan: boolean;
  showKasInternal: boolean;
  showUangSaku: boolean;
  showTabungan: boolean;
}

export function AsramaWidgets({ 
  unitType, 
  preferences,
  balances = {}
}: { 
  unitType: string;
  preferences: Preferences;
  balances?: Record<string, number>
}) {
  const isTHQ = unitType.trim() === 'THQ';

  return (
    <>
      <WidgetCard 
        title="Dana Pesantren / Yayasan" 
        amount={`Rp ${(balances['YAYASAN'] || 0).toLocaleString('id-ID')}`} 
        type="Unrestricted" 
        icon={Home} 
        colorType="emerald" 
        subtitle="Dana Operasional"
        isVisible={preferences.showYayasan}
      />

      {!isTHQ && (
        <WidgetCard 
          title="Kas Internal" 
          amount={`Rp ${(balances['KAS_INTERNAL'] || 0).toLocaleString('id-ID')}`} 
          type="Unrestricted" 
          icon={Banknote} 
          colorType="emerald" 
          subtitle="Uang Kas Nakib / OSIS"
          isVisible={preferences.showKasInternal}
        />
      )}

      <WidgetCard 
        title="Uang Saku" 
        amount={`Rp ${(balances['UANG_SAKU'] || 0).toLocaleString('id-ID')}`} 
        type="Restricted" 
        icon={Wallet} 
        colorType="accent" 
        subtitle="Titipan Orang Tua"
        isVisible={preferences.showUangSaku}
      />

      {isTHQ && (
        <WidgetCard 
          title="Tabungan Siswa" 
          amount={`Rp ${(balances['TABUNGAN_SISWA'] || 0).toLocaleString('id-ID')}`} 
          type="Restricted" 
          icon={PiggyBank} 
          colorType="accent" 
          subtitle="Dikelola oleh THQ"
          isVisible={preferences.showTabungan}
        />
      )}
    </>
  );
}
