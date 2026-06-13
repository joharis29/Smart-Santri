'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { Filter } from 'lucide-react';

interface Transaction {
  nominal: number;
  sumber_dana: string;
  tanggal: string;
}

interface MonthlyCashFlowChartProps {
  txIn: Transaction[];
  txOut: Transaction[];
  sources: { name: string }[];
  activeTahunAjaran: string;
}

const MONTHS_ORDER = ['07', '08', '09', '10', '11', '12', '01', '02', '03', '04', '05', '06'];
const MONTHS_LABELS: Record<string, string> = {
  '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun'
};

const formatCompactNumber = (value: any) => {
  const number = Number(value);
  if (!number || number === 0 || isNaN(number)) return '';
  const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  return formatter.format(number);
};

export function MonthlyCashFlowChart({ txIn, txOut, sources, activeTahunAjaran }: MonthlyCashFlowChartProps) {
  const [selectedSource, setSelectedSource] = useState<string>('SEMUA');

  const chartData = useMemo(() => {
    // 1. Initialize data structure for 12 months
    const dataMap: Record<string, { name: string, pemasukan: number, pengeluaran: number }> = {};
    MONTHS_ORDER.forEach(m => {
      dataMap[m] = { name: MONTHS_LABELS[m], pemasukan: 0, pengeluaran: 0 };
    });

    // 2. Filter logic function
    const filterFn = (tx: Transaction) => {
      if (!tx.tanggal) return false;
      if (selectedSource === 'SEMUA') return true;
      
      const sd = tx.sumber_dana?.toUpperCase() || '';
      const filterUpp = selectedSource.toUpperCase();
      
      if (filterUpp === 'SPP' && sd.includes('SPP')) return true;
      if (filterUpp === 'BOS' && sd.includes('BOS')) return true;
      if (filterUpp === 'YAYASAN' && (sd.includes('YAYASAN') || sd.includes('SUBSIDI'))) return true;
      
      return sd === filterUpp;
    };

    // 3. Process Pemasukan
    (txIn || []).filter(filterFn).forEach(tx => {
      const parts = tx.tanggal.split('-');
      if (parts.length > 1) {
        const month = parts[1];
        if (dataMap[month]) {
          dataMap[month].pemasukan += Number(tx.nominal) || 0;
        }
      }
    });

    // 4. Process Pengeluaran
    (txOut || []).filter(filterFn).forEach(tx => {
      const parts = tx.tanggal.split('-');
      if (parts.length > 1) {
        const month = parts[1];
        if (dataMap[month]) {
          dataMap[month].pengeluaran += Number(tx.nominal) || 0;
        }
      }
    });

    return MONTHS_ORDER.map(m => dataMap[m]);
  }, [txIn, txOut, selectedSource]);

  const totalPemasukan = chartData.reduce((acc, curr) => acc + curr.pemasukan, 0);
  const totalPengeluaran = chartData.reduce((acc, curr) => acc + curr.pengeluaran, 0);

  // Generate unique available sources from actual data
  const availableSources = useMemo(() => {
    const s = new Set<string>();
    (txIn || []).forEach(tx => { if(tx.sumber_dana) s.add(tx.sumber_dana.toUpperCase()); });
    (txOut || []).forEach(tx => { if(tx.sumber_dana) s.add(tx.sumber_dana.toUpperCase()); });
    (sources || []).forEach(src => { if(src.name) s.add(src.name.toUpperCase()); });
    return ['SEMUA', ...Array.from(s).sort()];
  }, [txIn, txOut, sources]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full mt-4">
      <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            Grafik Arus Kas Bulanan
          </h3>
          <p className="text-xs font-bold text-slate-400 mt-0.5">TAHUN AJARAN {activeTahunAjaran}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
            In: Rp {totalPemasukan.toLocaleString('id-ID')}
          </div>
          <div className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-rose-100">
            Out: Rp {totalPengeluaran.toLocaleString('id-ID')}
          </div>
          <div className="relative">
            <select
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1.5 pl-8 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[11px] cursor-pointer"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
            >
              {availableSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              tickFormatter={(value) => formatCompactNumber(value)}
              width={45}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl z-50">
                      <p className="text-xs font-black text-slate-800 uppercase mb-2">{label}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-3 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">
                            {entry.name}
                          </span>
                          <span className="text-xs font-black text-slate-700">
                            Rp {Number(entry.value).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }}
              iconType="circle"
            />
            <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="pemasukan" position="top" formatter={formatCompactNumber} style={{ fontSize: '9px', fill: '#10b981', fontWeight: 'bold' }} />
            </Bar>
            <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="pengeluaran" position="top" formatter={formatCompactNumber} style={{ fontSize: '9px', fill: '#f43f5e', fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
