import React from 'react';
import { Vault, HandCoins, Store, Activity, PiggyBank, Wallet, Landmark, Coins, Briefcase } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

interface DynamicWidgetsProps {
  sources: { name: string }[];
  exactBalances: Record<string, number>;
  preferences: any;
}

export function DynamicWidgets({ sources, exactBalances, preferences }: DynamicWidgetsProps) {
  
  // Helper to determine visibility based on existing preferences
  const getVisibility = (name: string) => {
    if (!preferences) return true;
    const lower = name.toLowerCase();
    
    if (lower.includes('spp')) return preferences.showSpp ?? true;
    if (lower.includes('zakat')) return preferences.showZakat ?? true;
    if (lower.includes('wakaf')) return preferences.showWakaf !== false;
    if (lower.includes('infaq') || lower.includes('sedekah')) {
      return preferences.showInfaqYayasan ?? preferences.showInfaq ?? true;
    }
    if (lower.includes('koperasi')) return preferences.showKoperasi ?? true;
    if (lower.includes('poskestren')) return preferences.showPoskestren ?? true;
    if (lower.includes('tabungan wajib')) return preferences.showTabungan ?? true;
    if (lower.includes('tabungan')) return preferences.showTabunganSiswa !== false && (preferences.showTabungan ?? true);
    if (lower.includes('uang saku')) return preferences.showUangSaku ?? true;
    if (lower.includes('bos')) return preferences.showBos ?? true;
    if (lower.includes('yayasan') || lower.includes('pesantren')) return preferences.showYayasan ?? true;
    if (lower.includes('subsidi')) return preferences.showSubsidi ?? true;
    if (lower.includes('antar jemput')) return preferences.showAntarJemput ?? true;
    
    return true; // Default to visible if it's a completely custom new fund
  };

  // Helper to determine the aesthetic properties of the widget
  const getWidgetProps = (name: string) => {
    const lower = name.toLowerCase();
    
    // Default values
    let icon = Wallet;
    let colorType: 'emerald' | 'accent' | 'blue' | 'amber' | 'rose' | 'slate' = 'emerald';
    let type: 'Restricted' | 'Unrestricted' = 'Unrestricted';
    let subtitle = "Dana Operasional / Custom";

    // Infer properties based on keywords
    if (lower.includes('spp')) {
      icon = Vault;
      subtitle = "Dana Utama Operasional";
    } else if (lower.includes('zakat')) {
      icon = HandCoins;
      colorType = 'accent';
      type = 'Restricted';
      subtitle = "Dana Asnaf (Sangat Terikat)";
    } else if (lower.includes('wakaf')) {
      icon = Landmark;
      colorType = 'accent';
      type = 'Restricted';
      subtitle = "Dana Pokok (Tidak Boleh Berkurang)";
    } else if (lower.includes('infaq') || lower.includes('sedekah')) {
      icon = HandCoins;
      if (lower.includes('terikat') || lower.includes('pembatasan')) {
        colorType = 'accent';
        type = 'Restricted';
        subtitle = "Dana Dengan Pembatasan Khusus";
      } else {
        subtitle = "Dana Bebas / Operasional Tambahan";
      }
    } else if (lower.includes('koperasi') || lower.includes('usaha') || lower.includes('poskestren')) {
      icon = lower.includes('poskestren') ? Activity : Store;
      subtitle = "Pendapatan Unit Usaha";
    } else if (lower.includes('tabungan')) {
      icon = PiggyBank;
      colorType = 'accent';
      type = 'Restricted';
      subtitle = "Dana Titipan Santri";
    } else if (lower.includes('uang saku')) {
      icon = Coins;
      colorType = 'accent';
      type = 'Restricted';
      subtitle = "Uang Jajan Santri (Titipan)";
    } else if (lower.includes('bos') || lower.includes('bantuan')) {
      icon = Briefcase;
      colorType = 'blue';
      subtitle = "Dana Bantuan Operasional";
    } else if (lower.includes('yayasan') || lower.includes('pesantren') || lower.includes('subsidi')) {
      icon = Landmark;
      subtitle = "Dana Induk / Subsidi";
    }

    return { icon, colorType, type, subtitle };
  };

  if (!sources || sources.length === 0) {
    return (
      <div className="col-span-full p-6 text-center bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada sumber dana yang dikonfigurasi.</p>
        <p className="text-[10px] text-slate-400 mt-1">Silakan tambahkan di menu Pengaturan Kelola Bidang & Dana.</p>
      </div>
    );
  }

  return (
    <>
      {sources.map((source, idx) => {
        const props = getWidgetProps(source.name);
        // Use exact calculated balance for this specific string
        const balance = exactBalances[source.name] || 0;
        
        return (
          <WidgetCard 
            key={`${source.name}-${idx}`}
            title={source.name} 
            amount={`Rp ${balance.toLocaleString('id-ID')}`} 
            type={props.type} 
            icon={props.icon} 
            colorType={props.colorType} 
            subtitle={props.subtitle}
            isVisible={getVisibility(source.name)}
          />
        );
      })}
    </>
  );
}
