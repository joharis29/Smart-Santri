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
  preferences 
}: { 
  unitType: string;
  preferences: Preferences;
}) {
  const isTHQ = unitType.trim() === 'THQ';

  return (
    <>
      <WidgetCard 
        title="Dana Yayasan / Pesantren" 
        amount="Rp 0" 
        type="Unrestricted" 
        icon={Home} 
        colorType="emerald" 
        subtitle="Dana Operasional"
        isVisible={preferences.showYayasan}
      />

      {!isTHQ && (
        <WidgetCard 
          title="Kas Internal" 
          amount="Rp 0" 
          type="Unrestricted" 
          icon={Banknote} 
          colorType="emerald" 
          subtitle="Uang Kas Nakib / OSIS"
          isVisible={preferences.showKasInternal}
        />
      )}

      <WidgetCard 
        title="Uang Saku Santri" 
        amount="Rp 0" 
        type="Restricted" 
        icon={Wallet} 
        colorType="accent" 
        subtitle="Titipan Orang Tua"
        isVisible={preferences.showUangSaku}
      />

      {isTHQ && (
        <WidgetCard 
          title="Tabungan Siswa" 
          amount="Rp 0" 
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
