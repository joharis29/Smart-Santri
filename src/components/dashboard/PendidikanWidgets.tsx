import React from 'react';
import { GraduationCap, Library, PiggyBank, Bus, HeartHandshake } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

interface Preferences {
  showBos: boolean;
  showYayasan: boolean;
  showTabungan: boolean;
  showAntarJemput: boolean;
  showSubsidi: boolean;
  showInfaq: boolean;
}

export function PendidikanWidgets({ 
  unitType, 
  preferences 
}: { 
  unitType: string;
  preferences: Preferences;
}) {
  const isDiniyah = unitType === 'Diniyah';
  const isTK = unitType === 'TK';

  return (
    <>
      {!isDiniyah && (
        <WidgetCard 
          title="Dana BOS" 
          amount="Rp 150.000.000" 
          type="Restricted" 
          icon={GraduationCap} 
          colorType="accent" 
          subtitle="Sharia Compliance & Juknis BOS Active"
          isVisible={preferences.showBos}
        />
      )}
      
      <WidgetCard 
        title="Dana Yayasan / Pesantren" 
        amount="Rp 85.000.000" 
        type="Unrestricted" 
        icon={Library} 
        colorType="emerald" 
        subtitle="Dari SPP (Termasuk Seragam & Perlengkapan)"
        isVisible={preferences.showYayasan}
      />

      {!isDiniyah && (
        <WidgetCard 
          title="Tabungan Siswa" 
          amount="Rp 45.000.000" 
          type="Restricted" 
          icon={PiggyBank} 
          colorType="accent" 
          subtitle="Dikelola melalui SIAP"
          isVisible={preferences.showTabungan}
        />
      )}

      {isTK && (
        <WidgetCard 
          title="Iuran Non-Wajib (Antar Jemput)" 
          amount="Rp 5.500.000" 
          type="Unrestricted" 
          icon={Bus} 
          colorType="emerald" 
          subtitle="Dikelola Mandiri oleh Unit TK"
          isVisible={preferences.showAntarJemput}
        />
      )}

      {isDiniyah && (
        <>
          <WidgetCard 
            title="Subsidi Pesantren" 
            amount="Rp 12.000.000" 
            type="Restricted" 
            icon={HeartHandshake} 
            colorType="accent" 
            subtitle="Dana Bantuan Operasional"
            isVisible={preferences.showSubsidi}
          />
          <WidgetCard 
            title="Infaq Siswa" 
            amount="Rp 1.500.000" 
            type="Unrestricted" 
            icon={PiggyBank} 
            colorType="emerald" 
            subtitle="Dana Darurat Diniyah"
            isVisible={preferences.showInfaq}
          />
        </>
      )}
    </>
  );
}
