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
  preferences,
  balances = {}
}: { 
  unitType: string;
  preferences: Preferences;
  balances?: Record<string, number>
}) {
  const isDiniyah = unitType.trim() === 'Diniyah';
  const isTK = unitType.trim() === 'TK';

  return (
    <>
      {!isDiniyah && (
        <WidgetCard 
          title="Dana BOS" 
          amount={`Rp ${(balances['BOS'] || 0).toLocaleString('id-ID')}`} 
          type="Restricted" 
          icon={GraduationCap} 
          colorType="accent" 
          subtitle="Sharia Compliance & Juknis BOS Active"
          isVisible={preferences.showBos}
        />
      )}
      
      <WidgetCard 
        title="Dana Pesantren / Yayasan" 
        amount={`Rp ${(balances['YAYASAN'] || 0).toLocaleString('id-ID')}`} 
        type="Unrestricted" 
        icon={Library} 
        colorType="emerald" 
        subtitle="Operasional Pendidikan Unit"
        isVisible={preferences.showYayasan}
      />

      {!isDiniyah && (
        <WidgetCard 
          title="Tabungan Siswa" 
          amount={`Rp ${(balances['TABUNGAN_SISWA'] || 0).toLocaleString('id-ID')}`} 
          type="Restricted" 
          icon={PiggyBank} 
          colorType="accent" 
          subtitle="Dikelola melalui SIAP"
          isVisible={preferences.showTabungan}
        />
      )}

      {isTK && (
        <WidgetCard 
          title="Iuran Non-Wajib" 
          amount={`Rp ${(balances['IURAN_NON_WAJIB'] || 0).toLocaleString('id-ID')}`} 
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
            amount={`Rp ${(balances['YAYASAN'] || 0).toLocaleString('id-ID')}`} 
            type="Restricted" 
            icon={HeartHandshake} 
            colorType="accent" 
            subtitle="Dana Bantuan Operasional"
            isVisible={preferences.showSubsidi}
          />
          <WidgetCard 
            title="Infaq Siswa" 
            amount={`Rp ${(balances['INFAQ'] || 0).toLocaleString('id-ID')}`} 
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
