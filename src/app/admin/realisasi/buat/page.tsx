'use client';

import React, { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { 
    ClipboardCheck, 
    Search, 
    ArrowRight, 
    Calculator, 
    FileText, 
    Calendar,
    Layers,
    GraduationCap,
    Camera as CameraIcon, 
    Upload, 
    X, 
    AlertTriangle, 
    CheckCircle2, 
    Plus,
    ChevronDown,
    Building2,
    DollarSign,
    Info,
    Layout,
    ArrowUpRight,
    Send,
    Percent,
    LayoutGrid,
    Trash2,
    PlusCircle,
    RotateCcw,
    File as FileIcon,
    Image as ImageIcon,
    FileSpreadsheet,
    Download as DownloadIcon,
    Edit3,
    Save,
    Banknote
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { saveLPJ } from '@/app/admin/pengajuan/buat/actions';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const OPERASIONAL_CATEGORIES = [
  'Konsumsi',
  'ATK & Fotocopy',
  'Honor / Insentif',
  'Transportasi',
  'Sewa Sarana',
  'Perlengkapan',
  'Pemeliharaan',
  'Lain-lain'
];

const RKA_PROGRAMS = [
  'Optimalisasi Manajemen Pengarsipan/Mengelola surat statis & dinamis',
  'Optimalisasi Manajemen Pengarsipan/Mutasi santri',
  'Optimalisasi Manajemen Pengarsipan/Arsip proposal/laporan',
  'Optimalisasi Manajemen Pengarsipan/Backup dokumen Naqieb',
  'Optimalisasi ATK & Sarpras/Pengadaan ATK',
  'Optimalisasi ATK & Sarpras/Sarpras kantor',
  'Optimalisasi ATK & Sarpras/Pemeliharaan sarpras',
  'Optimalisasi ATK & Sarpras/Inventarisasi aset',
  'Optimalisasi ATK & Sarpras/Seragam pengurus',
  'Manajemen Buku Admin/Pengadaan, pengisian rutin, dan evaluasi kelengkapan buku administrasi',
  'Database Santri/Update data semesteran & digitalisasi database santri',
  'Layanan & Komunikasi/WAG Ortu',
  'Layanan & Komunikasi/Booklet profil',
  'Layanan & Komunikasi/Buku santri',
  'Layanan & Komunikasi/Penyambutan santri baru',
  'Layanan & Komunikasi/Optimasi IG asrama',
  'Koordinasi Rapat/Rapat pekanan',
  'Koordinasi Rapat/Rapat terbatas',
  'Koordinasi Rapat/Rapat Naqieb',
  'Koordinasi Rapat/Rapat Kerja (Raker)',
  'Sistem Keuangan/Penyusunan RAB',
  'Sistem Keuangan/Pencairan dana',
  'Sistem Keuangan/Pencatatan BKU',
  'Sistem Keuangan/Pelaporan realisasi',
  'Manajemen Aset/Penitipan uang santri',
  'Manajemen Aset/Pengadaan sarpras kebutuhan santri',
  'Kegiatan Pendidikan/KISS (Kajian Senin Subuh)',
  'Kegiatan Pendidikan/Halaqah Masa',
  'Kegiatan Pendidikan/Bimbel sore',
  'Kegiatan Pendidikan/Rapot Asrama Bulanan',
  'Penegakan Disiplin/Operasi rambut/kerapihan',
  'Penegakan Disiplin/Sidak kamar',
  'Penegakan Disiplin/Pembinaan santri',
  'Penegakan Disiplin/Reward & punishment',
  'Minat Bakat/Muhadharah (Pidato)',
  'Minat Bakat/Olahraga pekanan',
  'Minat Bakat/Seni Bela Diri',
  'Program Tahfidz/Setoran hafalan harian',
  'Program Tahfidz/Tasmi\'',
  'Program Tahfidz/Munaqasyah',
  'Program Tahfidz/Wisuda Tahfidz',
  'Pembiasaan Ibadah/Shalat berjamaah 5 waktu',
  'Pembiasaan Ibadah/Tahajjud bersama',
  'Pembiasaan Ibadah/Puasa Sunnah',
  'Lingkungan & Kesehatan/Roan (Kerja bakti)',
  'Lingkungan & Kesehatan/Pengelolaan sampah',
  'Lingkungan & Kesehatan/Layanan Poskestren',
  'Lingkungan & Kesehatan/Sosialisasi PHBS',
  'Pemeliharaan/Perbaikan sarana rusak',
  'Pemeliharaan/Pembersihan fasilitas (Masjid, Kamar Mandi, Halaman)'
];

const FUND_SOURCES = ['Kas Operasional', 'Yayasan', 'Zakat', 'Infaq', 'Dana BOS'];

const FUNDING_SOURCES_BY_UNIT: Record<string, string[]> = {
    'Pusat (Yayasan)': [
        'Dana SPP', 
        'Dana Zakat', 
        'Dana Wakaf', 
        'Dana Infaq', 
        'Laba Usaha Koperasi', 
        'Laba Usaha Poskestren', 
        'Tabungan Wajib', 
        'Tabungan Siswa', 
        'Uang Saku'
    ],
    'TK': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa', 
        'Iuran Non-Wajib'
    ],
    'SDIT 1': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa'
    ],
    'SDIT 2': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa'
    ],
    'MTs': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa'
    ],
    'MA': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa'
    ],
    'Diniyah': [
        'Dana Pesantren/Yayasan', 
        'Subsidi Pesantren', 
        'Infaq Siswa'
    ],
    'Asrama Putra': [
        'Dana Pesantren/Yayasan', 
        'Kas Internal', 
        'Uang Saku'
    ],
    'Asrama Putri': [
        'Dana Pesantren/Yayasan', 
        'Kas Internal', 
        'Uang Saku'
    ],
    'THQ': [
        'Dana Pesantren/Yayasan', 
        'Uang Saku', 
        'Tabungan Siswa'
    ],
    'Dapur Asrama Putra': [
        'Kas Internal'
    ],
    'Dapur Asrama Putri': [
        'Kas Internal'
    ]
};

interface SubsidiSource {
    source: string;
    amount: number;
    percent: number;
}

interface LPJRow {
    id: string;
    program: string;
    operasional: string;
    jumlah: string;
    waktu: string;
    tempat: string;
    pic: string;
    sasaran: string;
    nominal: number;
    details: {
        items: Array<{ name: string; unit: string; price: number; qty: number; total: number; }>;
        fundingSplits: Array<{ source: string; percent: number; nominal: number; }>;
    };
    isFilled: boolean;
}

export default function BuatRealisasiPage() {
    const [approvedRkas, setApprovedRkas] = useState<any[]>([]);
    const [selectedRkaId, setSelectedRkaId] = useState('');
    const [selectedRkaData, setSelectedRkaData] = useState<any>(null);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const [attachments, setAttachments] = useState<Array<{ file?: File; url?: string; base64?: string; customName: string }>>([]);
    const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
    const importRef = useRef<HTMLInputElement>(null);
    const [unit, setUnit] = useState('');
    const [bidang, setBidang] = useState('');
    const [bulan, setBulan] = useState('');
    const [tahunAjaran, setTahunAjaran] = useState('');
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const urlParsedRef = useRef(false);
    
    const [editId, setEditId] = useState<string | null>(null);
    const [docStatus, setDocStatus] = useState<string>('DRAFT');
    const [catatanRevisi, setCatatanRevisi] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const isLoadingEditRef = useRef(false);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };
    
    const [lpjRows, setLpjRows] = useState<LPJRow[]>([
        { 
            id: '1', 
            program: '', 
            operasional: '', 
            jumlah: '', 
            waktu: '', 
            tempat: '', 
            pic: '', 
            sasaran: '', 
            nominal: 0, 
            details: { 
                items: [{ name: '', unit: '', price: 0, qty: 0, total: 0 }], 
                fundingSplits: [{ source: '', percent: 0, nominal: 0 }] 
            }, 
            isFilled: false 
        }
    ]);

    const [narasi, setNarasi] = useState('');
    const [subsidiSources, setSubsidiSources] = useState<SubsidiSource[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // FETCH APPROVED RKAs & USER PROFILE UNIT
    useEffect(() => {
        const fetchApproved = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('dokumen_pengajuan')
                .select('*, item_pengajuan(*)')
                .in('status', ['CAIR', 'SUDAH_DITERIMA', 'SELESAI'])
                .eq('jenis', 'RKA')
                .order('created_at', { ascending: false });
            
            if (data) {
                // Fetch all LPJ documents to find which RKAs have already been reported
                const { data: lpjDocs } = await supabase
                    .from('dokumen_pengajuan')
                    .select('item_pengajuan(rincian_json)')
                    .eq('jenis', 'LPJ');

                const realizedRkaIds = new Set<string>();
                lpjDocs?.forEach(doc => {
                    doc.item_pengajuan?.forEach((it: any) => {
                        try {
                            const details = typeof it.rincian_json === 'string' 
                                ? JSON.parse(it.rincian_json) 
                                : (it.rincian_json || {});
                            if (details.rka_id) {
                                realizedRkaIds.add(details.rka_id);
                            }
                        } catch(e) {}
                    });
                });

                // Filter out RKAs that have already been reported in an LPJ
                const filtered = data.filter(doc => !realizedRkaIds.has(doc.id));
                setApprovedRkas(filtered);
            }

            // Fetch user profile unit
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*, unit:unit_id(name)')
                    .eq('id', user.id)
                    .single() as any;
                
                if (profile?.unit?.name) {
                    setUnit(profile.unit.name);
                }
            }
        };
        fetchApproved();
    }, []);

    // Detect edit ID from URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const idParam = params.get('id');
            if (idParam) {
                setEditId(idParam);
            }
        }
    }, []);

    // Load LPJ Draft if editId is set
    useEffect(() => {
        const loadLpjDraft = async () => {
            if (!editId) return;
            isLoadingEditRef.current = true;
            const supabase = createClient();
            
            const { data: d, error } = await supabase
                .from('dokumen_pengajuan')
                .select('*, item_pengajuan(*)')
                .eq('id', editId)
                .single();
                
            if (error) {
                console.error("Gagal memuat draf LPJ:", error);
                isLoadingEditRef.current = false;
                return;
            }
            
            if (d) {
                setDocStatus(d.status);
                setCatatanRevisi(d.catatan_revisi || '');
                
                const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const bulanVal = monthNames[d.periode_bulan] || String(d.periode_bulan);
                setBulan(bulanVal);
                
                const tahunVal = d.periode_tahun ? `${d.periode_tahun}/${Number(d.periode_tahun) + 1}` : '';
                setTahunAjaran(tahunVal);
                setUnit(d.unit || '');
                setBidang(d.bidang || '');
                
                const items = d.item_pengajuan || [];
                if (items.length > 0) {
                    const firstItem = items[0];
                    const details = firstItem.rincian_json || {};
                    
                    if (details.rka_id) {
                        setSelectedRkaId(details.rka_id);
                    }
                    
                    setNarasi(details.narasi || '');
                    setSubsidiSources(details.subsidiSources || []);
                    
                    const savedAttachments = details.attachments || [];
                    setAttachments(savedAttachments);
                    setAttachmentPreviews(savedAttachments.map((att: any) => att.url || att.base64 || ''));
                    
                    const mappedRows = items.map((it: any, index: number) => {
                        const itemDetails = it.rincian_json || {};
                        return {
                            id: String(index + 1),
                            program: it.judul_kegiatan,
                            operasional: it.kategori_coa,
                            jumlah: itemDetails.jumlah_kegiatan || '1x',
                            waktu: it.waktu || '',
                            tempat: it.tempat || '',
                            pic: it.pic || '',
                            sasaran: it.sasaran || '',
                            nominal: it.nominal,
                            details: {
                                items: itemDetails.items || [],
                                fundingSplits: itemDetails.fundingSplits || []
                            },
                            isFilled: true
                        };
                    });
                    setLpjRows(mappedRows);
                }
            }
            // Keep isLoadingEditRef.current true for a brief period so RKA sync doesn't overwrite
            setTimeout(() => {
                isLoadingEditRef.current = false;
            }, 800);
        };
        loadLpjDraft();
    }, [editId]);

    // SYNC SELECTED RKA & AUTOFILL METADATA
    useEffect(() => {
        // Step 1: Detect if there is a redirect query param (?itemId=...)
        let targetRkaId = selectedRkaId;
        let targetItemIdParam = activeItemId || '';
        
        if (typeof window !== 'undefined' && approvedRkas.length > 0 && !urlParsedRef.current) {
            const params = new URLSearchParams(window.location.search);
            const itemIdParam = params.get('itemId');
            if (itemIdParam) {
                targetItemIdParam = itemIdParam;
                setActiveItemId(itemIdParam);
                // Find matching document for this itemIdParam (either as item ID or document ID)
                let foundDoc = approvedRkas.find(doc => 
                    doc.item_pengajuan?.some((it: any) => it.id === itemIdParam)
                );
                if (!foundDoc) {
                    foundDoc = approvedRkas.find(doc => doc.id === itemIdParam);
                }
                
                urlParsedRef.current = true; // Mark as parsed so we don't repeat URL checking
                if (foundDoc && selectedRkaId !== foundDoc.id) {
                    targetRkaId = foundDoc.id;
                    setSelectedRkaId(foundDoc.id);
                    return; // Let the state update trigger the next run of this effect
                }
            } else {
                urlParsedRef.current = true;
            }
        }

        // Step 2: Sync RKA data and metadata when targetRkaId is set
        if (targetRkaId && approvedRkas.length > 0) {
            const rka = approvedRkas.find(r => r.id === targetRkaId);
            if (rka) {
                // Determine which items to display
                let filteredItems = rka.item_pengajuan || [];
                let singleTargetItem: any = null;

                // Try to find the matching RKA item based on the LPJ program name if targetItemIdParam is empty
                if (!targetItemIdParam && lpjRows.length > 0 && lpjRows[0]?.program) {
                    const matched = (rka.item_pengajuan || []).find((it: any) => it.judul_kegiatan === lpjRows[0].program);
                    if (matched) {
                        targetItemIdParam = matched.id;
                        setActiveItemId(matched.id);
                    }
                }

                if (targetItemIdParam) {
                    const matched = (rka.item_pengajuan || []).find((it: any) => it.id === targetItemIdParam);
                    if (matched) {
                        singleTargetItem = matched;
                        filteredItems = [matched];
                    } else if (rka.item_pengajuan?.length > 0) {
                        singleTargetItem = rka.item_pengajuan[0];
                    }
                } else if (rka.item_pengajuan?.length > 0) {
                    singleTargetItem = rka.item_pengajuan[0];
                }

                // Set isolated selected RKA data
                setSelectedRkaData({
                    ...rka,
                    nominal: filteredItems.reduce((acc: number, it: any) => acc + Number(it.nominal || 0), 0),
                    item_pengajuan: filteredItems
                });

                // If loading draft, stop here to avoid overwriting metadata or lpjRows loaded from draft
                if (isLoadingEditRef.current) {
                    return;
                }

                // Unit mapping (prioritize name string like 'SDIT 1' instead of UUID)
                const unitVal = rka.unit || rka.unit_id || '';
                setUnit(unitVal);

                // Bidang mapping (convert to uppercase, map 'Sarana' -> 'SARPRAS')
                const dbBidang = String(rka.bidang || '').toUpperCase();
                if (dbBidang.includes('SARANA') || dbBidang.includes('SARPRAS')) {
                    setBidang('SARPRAS');
                } else {
                    setBidang(dbBidang);
                }

                // Bulan mapping (convert number 1-12 to string name)
                const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const bulanVal = typeof rka.periode_bulan === 'number'
                    ? monthNames[rka.periode_bulan]
                    : (monthNames[Number(rka.periode_bulan)] || rka.bulan || rka.periode_bulan || '');
                setBulan(bulanVal);

                // Tahun Ajaran mapping
                const tahunVal = rka.tahun_ajaran || (rka.periode_tahun ? `${rka.periode_tahun}/${Number(rka.periode_tahun) + 1}` : '');
                setTahunAjaran(tahunVal);

                // Autofill the LPJ input table (Tabel Realisasi Anggaran) using details from this isolated item!
                if (singleTargetItem) {
                    let details: any = {};
                    try {
                        details = typeof singleTargetItem.rincian_json === 'string' 
                            ? JSON.parse(singleTargetItem.rincian_json) 
                            : (singleTargetItem.rincian_json || {});
                    } catch (e) {
                        details = {};
                    }

                    const defaultItems = details.items || [{ name: singleTargetItem.judul_kegiatan || '', unit: 'Pcs', price: Number(singleTargetItem.nominal || 0), qty: 1, total: Number(singleTargetItem.nominal || 0) }];
                    const defaultSplits = details.fundingSplits || [{ source: singleTargetItem.sumber_dana || 'Yayasan', percent: 100, nominal: singleTargetItem.nominal }];

                    setLpjRows([
                        {
                            id: '1',
                            program: singleTargetItem.judul_kegiatan || '',
                            operasional: singleTargetItem.kategori_coa || '',
                            jumlah: details.jumlah_kegiatan || '1x',
                            waktu: singleTargetItem.waktu || '',
                            tempat: singleTargetItem.tempat || '',
                            pic: singleTargetItem.pic || '',
                            sasaran: singleTargetItem.sasaran || '',
                            nominal: Number(singleTargetItem.nominal || 0),
                            details: {
                                items: defaultItems,
                                fundingSplits: defaultSplits
                            },
                            isFilled: true
                        }
                    ]);
                }
            }
        } else {
            setSelectedRkaData(null);
        }
    }, [selectedRkaId, approvedRkas, activeItemId]);
    
    const budgetTotal = useMemo(() => {
        if (!selectedRkaData) return 0;
        return Number(selectedRkaData.nominal || 0);
    }, [selectedRkaData]);

    const realisasiTotal = useMemo(() => 
        lpjRows.reduce((acc, curr) => acc + curr.nominal, 0),
    [lpjRows]);

    const availableFundSources = useMemo(() => {
        let normalizedUnit = unit || '';
        if (normalizedUnit.includes('Yayasan')) normalizedUnit = 'Pusat (Yayasan)';
        
        const unitSources = FUNDING_SOURCES_BY_UNIT[normalizedUnit] || [];
        if (unitSources.length > 0) {
            return unitSources;
        }
        return ['Kas Operasional', 'Yayasan', 'Zakat', 'Infaq', 'Dana BOS'];
    }, [unit]);

    const selisih = useMemo(() => {
        if (!selectedRkaData) return 0;
        return realisasiTotal - budgetTotal;
    }, [selectedRkaData, realisasiTotal, budgetTotal]);

    const totalSubsidi = useMemo(() => 
        subsidiSources.reduce((acc, curr) => acc + curr.amount, 0), 
    [subsidiSources]);

    const totalSubsidiPercent = useMemo(() => 
        subsidiSources.reduce((acc, curr) => acc + (curr.percent || 0), 0), 
    [subsidiSources]);

    const isSubsidiComplete = totalSubsidiPercent >= 100;

    const sisaKekurangan = useMemo(() => {
        if (selisih <= 0) return 0;
        return Math.max(0, selisih - totalSubsidi);
    }, [selisih, totalSubsidi]);

    const isSubmitDisabled = useMemo(() => {
        // 1. Check metadata headers
        if (!unit || !bidang || !bulan || !tahunAjaran || !selectedRkaId) {
            return true;
        }

        // 2. Check Bukti Nota / Lampiran (attachments)
        if (attachments.length === 0) {
            return true;
        }

        // 3. Check Rincian Detail Realisasi (for all lpjRows)
        for (const row of lpjRows) {
            const items = row.details?.items || [];
            if (items.length === 0) {
                return true;
            }
            for (const item of items) {
                if (!item.name || !item.name.trim()) {
                    return true;
                }
                if (!item.unit || !item.unit.trim()) {
                    return true;
                }
                if (!item.price || Number(item.price) <= 0) {
                    return true;
                }
                if (!item.qty || Number(item.qty) <= 0) {
                    return true;
                }
            }
        }

        // 4. If over budget, require cross-subsidy coverage to fully cover it and be exactly 100%
        if (selisih > 0) {
            if (Math.abs(totalSubsidiPercent - 100) > 0.01 || sisaKekurangan > 0) {
                return true;
            }
            for (const sub of subsidiSources) {
                if (!sub.source || sub.amount <= 0) {
                    return true;
                }
            }
        }

        return false;
    }, [unit, bidang, bulan, tahunAjaran, selectedRkaId, attachments, lpjRows, selisih, sisaKekurangan, subsidiSources, totalSubsidiPercent]);

    const rkaFundingAggregated = useMemo(() => {
        if (!selectedRkaData) return [];
        const splits: Record<string, number> = {};
        selectedRkaData.item_pengajuan?.forEach((it: any) => {
            try {
                const details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {});
                const itemSplits = details.fundingSplits || (Array.isArray(details) ? [] : []);
                itemSplits.forEach((s: any) => {
                    const source = s.source || 'Lainnya';
                    splits[source] = (splits[source] || 0) + Number(s.nominal || 0);
                });
            } catch(e) {}
        });
        return Object.entries(splits).map(([source, nominal]) => ({ source, nominal }));
    }, [selectedRkaData]);

    const lpjFundingAggregated = useMemo(() => {
        const splits: Record<string, number> = {};
        lpjRows.forEach(row => {
            row.details.fundingSplits.forEach(s => {
                if (s.source && s.nominal > 0) {
                    splits[s.source] = (splits[s.source] || 0) + s.nominal;
                }
            });
        });
        return Object.entries(splits).map(([source, nominal]) => ({ source, nominal }));
    }, [lpjRows]);

    // --- Row Logic ---
    const updateLpjRow = (id: string, field: keyof LPJRow, value: any) => {
        setLpjRows(prev => prev.map(row => {
            if (row.id === id) return { ...row, [field]: value, isFilled: true };
            return row;
        }));
    };

    const updateLpjItem = (rowId: string, itemIdx: number, field: string, value: any) => {
        setLpjRows(prev => prev.map(row => {
            if (row.id === rowId) {
                const newItems = [...row.details.items];
                newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
                
                // Recalculate total for this item
                if (field === 'price' || field === 'qty') {
                    newItems[itemIdx].total = Number(newItems[itemIdx].price) * Number(newItems[itemIdx].qty);
                }

                // Recalculate main row nominal
                const newNominal = newItems.reduce((acc, it) => acc + it.total, 0);

                // Sync funding splits with new nominal
                const newSplits = row.details.fundingSplits.map(s => ({
                    ...s,
                    nominal: (s.percent / 100) * newNominal
                }));

                return { 
                    ...row, 
                    nominal: newNominal,
                    details: { ...row.details, items: newItems, fundingSplits: newSplits } 
                };
            }
            return row;
        }));
    };

    const addLpjRow = () => {
        const newId = (lpjRows.length + 1).toString();
        setLpjRows([...lpjRows, { 
            id: newId, 
            program: '', 
            operasional: '', 
            jumlah: '', 
            waktu: '', 
            tempat: '', 
            pic: '', 
            sasaran: '', 
            nominal: 0, 
            details: { 
                items: [{ name: '', unit: '', price: 0, qty: 0, total: 0 }], 
                fundingSplits: [{ source: '', percent: 0, nominal: 0 }] 
            }, 
            isFilled: false 
        }]);
    };

    const deleteLpjRow = (id: string) => {
        // Reset data instead of deleting row, as only one program is allowed
        setLpjRows(prev => prev.map(row => {
            if (row.id === id) {
                return {
                    ...row,
                    program: '',
                    operasional: '',
                    jumlah: '1x',
                    waktu: '',
                    tempat: '',
                    pic: '',
                    sasaran: '',
                    nominal: 0,
                    details: {
                        items: [{ name: '', unit: 'Pcs', price: 0, qty: 0, total: 0 }],
                        fundingSplits: [{ source: 'Yayasan', percent: 100, nominal: 0 }]
                    }
                };
            }
            return row;
        }));
    };

    const addItemDetail = (rowId: string) => {
        setLpjRows(prev => prev.map(row => {
            if (row.id === rowId) {
                return {
                    ...row,
                    details: {
                        ...row.details,
                        items: [...row.details.items, { name: '', unit: '', price: 0, qty: 0, total: 0 }]
                    }
                };
            }
            return row;
        }));
    };

    const removeItemDetail = (rowId: string, itemIdx: number) => {
        setLpjRows(prev => prev.map(row => {
            if (row.id === rowId) {
                if (row.details.items.length === 1) return row;
                const newItems = row.details.items.filter((_, idx) => idx !== itemIdx);
                const newNominal = newItems.reduce((acc, it) => acc + it.total, 0);
                return {
                    ...row,
                    nominal: newNominal,
                    details: { ...row.details, items: newItems }
                };
            }
            return row;
        }));
    };

    const updateSubsidi = (index: number, field: 'amount' | 'percent' | 'source', value: any) => {
        const news = [...subsidiSources];
        const item = { ...news[index] };

        if (field === 'source') {
            item.source = value;
        } else if (field === 'amount') {
            let amt = Math.max(0, Number(value));
            const otherAmount = news.reduce((acc, curr, idx) => idx === index ? acc : acc + (curr.amount || 0), 0);
            if (selisih > 0 && otherAmount + amt > selisih) {
                amt = Math.max(0, selisih - otherAmount);
            }
            item.amount = amt;
            item.percent = selisih > 0 ? (item.amount / selisih) * 100 : 0;
        } else if (field === 'percent') {
            let pct = Math.max(0, Number(value));
            const otherPercent = news.reduce((acc, curr, idx) => idx === index ? acc : acc + (curr.percent || 0), 0);
            if (otherPercent + pct > 100) {
                pct = Math.max(0, 100 - otherPercent);
            }
            item.percent = pct;
            item.amount = selisih > 0 ? (item.percent / 100) * selisih : 0;
        }

        news[index] = item;
        setSubsidiSources(news);
    };

    const addSubsidi = () => {
        setSubsidiSources(prev => [...prev, { source: '', amount: 0, percent: 0 }]);
    };

    const removeSubsidi = (index: number) => {
        setSubsidiSources(prev => prev.filter((_, idx) => idx !== index));
    };

    const addLpjFundingSplit = (rowId: string) => {
        setLpjRows(prev => prev.map(row => {
            if (row.id === rowId) {
                return {
                    ...row,
                    details: {
                        ...row.details,
                        fundingSplits: [...row.details.fundingSplits, { source: '', percent: 0, nominal: 0 }]
                    }
                };
            }
            return row;
        }));
    };

    const removeLpjFundingSplit = (rowId: string, splitIdx: number) => {
        setLpjRows(prev => prev.map(row => {
            if (row.id === rowId) {
                if (row.details.fundingSplits.length === 1) return row;
                return {
                    ...row,
                    details: {
                        ...row.details,
                        fundingSplits: row.details.fundingSplits.filter((_, i) => i !== splitIdx)
                    }
                };
            }
            return row;
        }));
    };

    const updateLpjFundingSplit = (rowId: string, splitIdx: number, field: string, value: any) => {
        setLpjRows(prev => prev.map(row => {
            if (row.id === rowId) {
                const newSplits = [...row.details.fundingSplits];
                const split = { ...newSplits[splitIdx], [field]: value };
                
                if (field === 'percent') {
                    split.percent = Number(value);
                    split.nominal = (Number(value) / 100) * row.nominal;
                } else if (field === 'nominal') {
                    split.nominal = Number(value);
                    split.percent = row.nominal > 0 ? (Number(value) / row.nominal) * 100 : 0;
                }
                
                newSplits[splitIdx] = split;
                return {
                    ...row,
                    details: { ...row.details, fundingSplits: newSplits }
                };
            }
            return row;
        }));
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Detect Start Row
            const startRowIdx = aoa.findIndex(row => String(row[0]) === 'No' || String(row[1]) === 'Program/ Kegiatan');
            if (startRowIdx === -1) {
                alert("Format file tidak dikenali. Pastikan menggunakan template yang sesuai.");
                return;
            }

            const dataRows = aoa.slice(startRowIdx + 1);
            const newLpjRows: LPJRow[] = [];
            let currentParent: LPJRow | null = null;

            const cleanNumber = (val: any) => {
                if (val === undefined || val === null || val === '') return 0;
                if (typeof val === 'number') return val;
                const cleaned = String(val).replace(/Rp/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
                return Number(cleaned) || 0;
            };

            const headerRow = aoa[startRowIdx];
            const getIdx = (keywords: string[]) => {
                return headerRow.findIndex(h => {
                    const header = String(h || '').toLowerCase();
                    return keywords.some(k => header.includes(k.toLowerCase()));
                });
            };

            // Column mapping based on headers
            const colMap = {
                program: getIdx(['program', 'kegiatan']),
                operasional: getIdx(['deskripsi', 'operasional', 'bidang']),
                jumlah: getIdx(['jumlah kegiatan', 'qty kegiatan']),
                waktu: getIdx(['waktu', 'tanggal']),
                tempat: getIdx(['tempat', 'lokasi']),
                pic: getIdx(['pic', 'penanggung']),
                sasaran: getIdx(['sasaran', 'target']),
                nominal: getIdx(['realisasi', 'total', 'nominal', 'anggaran']),
                // Detail items
                unit: getIdx(['satuan', 'unit']),
                price: getIdx(['harga', 'price']),
                qty: getIdx(['qty', 'kuantitas']),
            };

            dataRows.forEach((row) => {
                const no = row[0];
                const desc = String(row[1] || '').trim();

                if (no && !isNaN(Number(no))) {
                    // Main Row
                    const mainRow: LPJRow = {
                        id: (newLpjRows.length + 1).toString(),
                        program: desc,
                        operasional: colMap.operasional !== -1 ? String(row[colMap.operasional] || '') : '',
                        jumlah: colMap.jumlah !== -1 ? String(row[colMap.jumlah] || '1x') : '1x',
                        waktu: colMap.waktu !== -1 ? String(row[colMap.waktu] || '') : '',
                        tempat: colMap.tempat !== -1 ? String(row[colMap.tempat] || '') : '',
                        pic: colMap.pic !== -1 ? String(row[colMap.pic] || '') : '',
                        sasaran: colMap.sasaran !== -1 ? String(row[colMap.sasaran] || '') : '',
                        nominal: colMap.nominal !== -1 ? cleanNumber(row[colMap.nominal]) : 0,
                        details: {
                            items: [],
                            fundingSplits: [] 
                        },
                        isFilled: true
                    };
                    // --- Detect Funding Splits ---
                    let splits: Array<{ source: string; percent: number; nominal: number; }> = [];
                    
                    // 1. Try to find in columns first (as before)
                    FUND_SOURCES.forEach(source => {
                        const sIdx = headerRow.findIndex(h => {
                            const header = String(h || '').toLowerCase();
                            return header.includes(source.toLowerCase()) || 
                                   (source === 'Yayasan' && header.includes('dana yayasan')) ||
                                   (source === 'Dana BOS' && header.includes('bos'));
                        });
                        if (sIdx !== -1) {
                            const val = cleanNumber(row[sIdx]);
                            if (val > 0) splits.push({ source, nominal: val, percent: 0 });
                        }
                    });

                    // 2. If no columns found, try a very flexible search for the summary section
                    if (splits.length === 0) {
                        const summaryStartIdx = aoa.findIndex(r => 
                            r.some(cell => {
                                const val = String(cell || '').toUpperCase();
                                return val.includes('RINGKASAN') && val.includes('SUMBER DANA');
                            })
                        );

                        if (summaryStartIdx !== -1) {
                            const summaryRows = aoa.slice(summaryStartIdx + 1);
                            summaryRows.forEach(sRow => {
                                // Find which cell contains a fund source name
                                let matchedSource: string | null = null;
                                let sourceCellIdx = -1;
                                
                                sRow.forEach((cell, idx) => {
                                    const cellVal = String(cell || '').toLowerCase();
                                    // Check if it's one of our sources
                                    const found = FUND_SOURCES.find(fs => cellVal.includes(fs.toLowerCase()));
                                    if (found && !cellVal.includes('total')) { // Avoid 'Total Keseluruhan'
                                        matchedSource = found;
                                        sourceCellIdx = idx;
                                    }
                                });

                                if (matchedSource && sourceCellIdx !== -1) {
                                    // Look for the nominal in the row. In the screenshot it's at index 7 (Column H)
                                    // But we search all cells after the source name
                                    let sNominal = 0;
                                    for (let i = sourceCellIdx + 1; i < sRow.length; i++) {
                                        const val = cleanNumber(sRow[i]);
                                        if (val > 0) {
                                            sNominal = val;
                                            break;
                                        }
                                    }

                                    if (sNominal > 0) {
                                        splits.push({ source: matchedSource, nominal: sNominal, percent: 0 });
                                    }
                                }
                            });
                        }
                    }

                    // Calculate percentages and finalize
                    const finalNominal = mainRow.nominal > 0 ? mainRow.nominal : splits.reduce((acc, s) => acc + s.nominal, 0);
                    if (mainRow.nominal === 0) mainRow.nominal = finalNominal;

                    splits = splits.map(s => ({
                        ...s,
                        percent: finalNominal > 0 ? (s.nominal / finalNominal) * 100 : 0
                    }));

                    mainRow.details.fundingSplits = splits.length > 0 ? splits : [{ source: 'Yayasan', percent: 100, nominal: mainRow.nominal }];
                    
                    newLpjRows.push(mainRow);
                    currentParent = mainRow;
                } else if (desc.includes('•') && currentParent) {
                    // Detail Item
                    const itemName = desc.replace(/•/g, '').trim();
                    const itemTotal = colMap.nominal !== -1 ? cleanNumber(row[colMap.nominal]) : 0;
                    currentParent.details.items.push({
                        name: itemName,
                        unit: colMap.unit !== -1 ? String(row[colMap.unit] || 'Pcs') : 'Pcs',
                        price: colMap.price !== -1 ? cleanNumber(row[colMap.price]) : 0,
                        qty: colMap.qty !== -1 ? cleanNumber(row[colMap.qty]) : 0,
                        total: itemTotal
                    });
                }
            });

            if (newLpjRows.length > 0) {
                // Limit to only one row as requested
                setLpjRows([newLpjRows[0]]);
                alert("Data berhasil di-import! (Hanya 1 Program/Kegiatan pertama yang diambil)");
            }
            if (importRef.current) importRef.current.value = ''; // Reset input
        };
        reader.readAsArrayBuffer(file);
    };

    // --- Camera Logic ---
    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        } catch (err) {
            alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const name = window.prompt("Masukkan nama untuk foto ini (misal: Nota Makan):", "Nota Baru");
                        if (name) {
                            const file = new File([blob], `lpj-nota-${Date.now()}.jpg`, { type: 'image/jpeg' });
                            setAttachments(prev => [...prev, { file, customName: name }].slice(0, 50));
                            setIsCameraOpen(false);
                            stopCamera();
                        }
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    useEffect(() => {
        if (isCameraOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isCameraOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            
            // Filter only images
            const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length < newFiles.length) {
                alert("Hanya file gambar yang diperbolehkan (JPG, PNG, dll.). File lainnya akan diabaikan.");
            }

            if (imageFiles.length > 0) {
                const labeledFiles: Array<{ file: File; customName: string }> = [];
                for (const f of imageFiles) {
                    const name = window.prompt(`Masukkan nama untuk file "${f.name}":`, f.name.split('.')[0]);
                    if (name) {
                        labeledFiles.push({ file: f, customName: name });
                    }
                }

                if (labeledFiles.length > 0) {
                    setAttachments(prev => [...prev, ...labeledFiles].slice(0, 50));
                    
                    // Create previews for images
                    const newPreviews = labeledFiles.map(obj => URL.createObjectURL(obj.file));
                    setAttachmentPreviews(prev => [...prev, ...newPreviews].slice(0, 50));
                }
            }
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
        setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Realisasi');

        // Helper for borders
        const thinBorder: Partial<ExcelJS.Borders> = {
            top: { style: 'thin' as ExcelJS.BorderStyle },
            left: { style: 'thin' as ExcelJS.BorderStyle },
            bottom: { style: 'thin' as ExcelJS.BorderStyle },
            right: { style: 'thin' as ExcelJS.BorderStyle }
        };

        const thickBorder: Partial<ExcelJS.Borders> = {
            top: { style: 'thick' as ExcelJS.BorderStyle },
            left: { style: 'thick' as ExcelJS.BorderStyle },
            bottom: { style: 'thick' as ExcelJS.BorderStyle },
            right: { style: 'thick' as ExcelJS.BorderStyle }
        };

        // Column Config
        worksheet.columns = [
            { key: 'A', width: 5 },   // No
            { key: 'B', width: 35 },  // Program
            { key: 'C', width: 15 },  // Operasional
            { key: 'D', width: 12 },  // Jml
            { key: 'E', width: 12 },  // Waktu
            { key: 'F', width: 12 },  // Tempat
            { key: 'G', width: 15 },  // PIC
            { key: 'H', width: 15 },  // Sasaran
            { key: 'I', width: 18 },  // Total
            { key: 'J', width: 3 },   // Spacer
            { key: 'K', width: 30 },  // Sidebar Column
            { key: 'L', width: 10 }   // Extra
        ];

        // 1. Title
        worksheet.mergeCells('A1:I1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Laporan Realisasi Anggaran';
        titleCell.font = { bold: true, size: 14 };

        // 2. Metadata Row
        worksheet.getRow(2).values = ['Unit :', '', 'Bidang :', '', 'Bulan :', '', 'Tahun Ajaran :'];
        worksheet.getCell('B2').value = unit || '-';
        worksheet.getCell('D2').value = bidang || '-';
        worksheet.getCell('F2').value = bulan || '-';
        worksheet.getCell('H2').value = tahunAjaran || '-';
        worksheet.getRow(2).font = { bold: true, size: 10 };
        
        // Right align labels
        [1, 3, 5, 7].forEach(col => {
            worksheet.getCell(2, col).alignment = { horizontal: 'right' };
        });

        let currentRow = 4;

        // --- SECTION 1: RKA ---
        const rkaStartRow = currentRow;
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const rkaTitle = worksheet.getCell(`A${currentRow}`);
        rkaTitle.value = 'Tabel Rencana Kegiatan & Anggaran (RKA)';
        rkaTitle.font = { bold: true };
        currentRow++;

        const rkaHeaderRow = worksheet.getRow(currentRow);
        rkaHeaderRow.values = ['No', 'Nama Program/ Kegiatan', 'Operasional', 'Jumlah Kegiatan', 'Waktu', 'Tempat', 'Penanggung Jawab', 'Sasaran', 'Rencana Anggaran'];
        currentRow++;

        // RKA Data
        const rkaItem = selectedRkaData?.item_pengajuan?.[0];
        let rkaDetails: any = {};
        if (rkaItem?.rincian_json) {
            try {
                rkaDetails = typeof rkaItem.rincian_json === 'string'
                    ? JSON.parse(rkaItem.rincian_json)
                    : rkaItem.rincian_json;
            } catch (e) {
                rkaDetails = {};
            }
        }

        const rkaMainRow = worksheet.getRow(currentRow);
        rkaMainRow.values = [
            1, 
            rkaItem?.judul_kegiatan || rkaItem?.kegiatan || '-', 
            rkaItem?.kategori_coa || '-', 
            rkaDetails?.jumlah_kegiatan || '1x', 
            rkaItem?.waktu || '-', 
            rkaItem?.tempat || '-', 
            rkaItem?.pic || '-', 
            rkaItem?.sasaran || '-', 
            Number(rkaItem?.nominal || 0)
        ];
        rkaMainRow.getCell(9).numFmt = '"Rp "#,##0';
        currentRow++;

        // RKA Rincian Title
        const rkaRincianLabelRow = worksheet.getRow(currentRow);
        rkaRincianLabelRow.getCell(2).value = 'Rincian Detail & Budgeting:';
        rkaRincianLabelRow.getCell(2).font = { italic: true, size: 9 };
        currentRow++;

        const rkaSubHeader = worksheet.getRow(currentRow);
        rkaSubHeader.values = ['No', 'Nama Item / Spesifikasi', 'Satuan', 'Harga Satuan', 'Qty', 'Total (Rp)'];
        currentRow++;

        const rkaSubItems = rkaDetails?.items || [{ name: rkaItem?.judul_kegiatan || '', unit: 'Pcs', price: Number(rkaItem?.nominal || 0), qty: 1, total: Number(rkaItem?.nominal || 0) }];
        rkaSubItems.forEach((item: any, i: number) => {
            const row = worksheet.getRow(currentRow);
            row.values = [i + 1, item.name, item.unit, Number(item.price || 0), Number(item.qty || 0), Number(item.total || 0)];
            [4, 6].forEach(c => row.getCell(c).numFmt = '"Rp "#,##0');
            currentRow++;
        });

        // RKA Footer
        worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
        worksheet.getCell(`G${currentRow}`).value = 'Alokasi Sumber Dana';
        currentRow++;

        const rkaSplits = rkaDetails?.fundingSplits || [{ source: rkaItem?.sumber_dana || 'Yayasan', percent: 100, nominal: rkaItem?.nominal }];
        rkaSplits.forEach((split: any) => {
            worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
            worksheet.getCell(`G${currentRow}`).value = `${split.source} (${split.percent}%)`;
            worksheet.getCell(`I${currentRow}`).value = Number(split.nominal);
            worksheet.getCell(`I${currentRow}`).numFmt = '"Rp "#,##0';
            currentRow++;
        });
        
        worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
        worksheet.getCell(`G${currentRow}`).value = 'Total Pengajuan';
        worksheet.getCell(`G${currentRow}`).font = { bold: true };
        worksheet.getCell(`I${currentRow}`).value = Number(rkaItem?.nominal || 0);
        worksheet.getCell(`I${currentRow}`).numFmt = '"Rp "#,##0';
        worksheet.getCell(`I${currentRow}`).font = { bold: true };
        currentRow++;

        worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
        worksheet.getCell(`G${currentRow}`).value = 'Jenis Pencairan';
        worksheet.getCell(`G${currentRow}`).font = { bold: true };
        worksheet.getCell(`I${currentRow}`).value = selectedRkaData?.metode_pencairan || selectedRkaData?.metode_pembayaran || 'CASH';
        worksheet.getCell(`I${currentRow}`).font = { italic: true };
        const rkaEndRow = currentRow;

        // Apply Borders & Bold Headers
        for (let r = rkaStartRow; r <= rkaEndRow; r++) {
            for (let c = 1; c <= 9; c++) {
                const cell = worksheet.getCell(r, c);
                cell.border = thinBorder;
                
                // Bold Headers
                if (r === rkaStartRow || r === rkaStartRow + 1 || r === rkaStartRow + 4) {
                    cell.font = { bold: true, size: r === rkaStartRow ? 10 : 9 };
                }
                
                if (r === rkaStartRow || r === rkaStartRow + 1) cell.alignment = { horizontal: 'center' };
            }
        }
        // Bold RKA Summary Titles
        for (let r = rkaEndRow - rkaSplits.length - 1; r <= rkaEndRow; r++) {
            worksheet.getCell(r, 7).font = { bold: true };
        }

        currentRow += 2;

        // --- SECTION 2: LPJ ---
        const lpjStartRow = currentRow;
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const lpjTitle = worksheet.getCell(`A${currentRow}`);
        lpjTitle.value = 'Tabel Realisasi Anggaran';
        lpjTitle.font = { bold: true };
        currentRow++;

        const lpjHeaderRow = worksheet.getRow(currentRow);
        lpjHeaderRow.values = ['No', 'Nama Program/ Kegiatan', 'Operasional', 'Jumlah Kegiatan', 'Waktu', 'Tempat', 'Penanggung Jawab', 'Sasaran', 'Total Realisasi'];
        currentRow++;

        const lpjData = lpjRows[0];
        const lpjMainRow = worksheet.getRow(currentRow);
        lpjMainRow.values = [1, lpjData.program, lpjData.operasional, lpjData.jumlah, lpjData.waktu, lpjData.tempat, lpjData.pic, lpjData.sasaran, Number(lpjData.nominal)];
        lpjMainRow.getCell(9).numFmt = '"Rp "#,##0';
        currentRow++;

        const lpjRincianLabelRow = worksheet.getRow(currentRow);
        lpjRincianLabelRow.getCell(2).value = 'Rincian Detail Realisasi:';
        lpjRincianLabelRow.getCell(2).font = { italic: true, size: 9 };
        currentRow++;

        const lpjSubHeader = worksheet.getRow(currentRow);
        lpjSubHeader.values = ['No', 'Nama Item / Spesifikasi', 'Satuan', 'Harga Satuan', 'Qty', 'Total (Rp)'];
        currentRow++;

        lpjData.details.items.forEach((item, i) => {
            const row = worksheet.getRow(currentRow);
            row.values = [i + 1, item.name, item.unit, Number(item.price), Number(item.qty), Number(item.total)];
            [4, 6].forEach(c => row.getCell(c).numFmt = '"Rp "#,##0');
            currentRow++;
        });

        // LPJ Footer
        worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
        worksheet.getCell(`G${currentRow}`).value = 'Total Realisasi';
        worksheet.getCell(`G${currentRow}`).font = { bold: true };
        worksheet.getCell(`I${currentRow}`).value = Number(lpjData.nominal);
        worksheet.getCell(`I${currentRow}`).numFmt = '"Rp "#,##0';
        worksheet.getCell(`I${currentRow}`).font = { bold: true };
        const lpjEndRow = currentRow;

        // Apply Borders & Bold Headers to LPJ Section
        for (let r = lpjStartRow; r <= lpjEndRow; r++) {
            for (let c = 1; c <= 9; c++) {
                const cell = worksheet.getCell(r, c);
                cell.border = thinBorder;
                
                // Bold Headers
                if (r === lpjStartRow || r === lpjStartRow + 1 || r === lpjStartRow + 4) {
                    cell.font = { bold: true, size: r === lpjStartRow ? 10 : 9 };
                }

                if (r === lpjStartRow || r === lpjStartRow + 1) cell.alignment = { horizontal: 'center' };
            }
        }
        // Bold LPJ Summary Titles
        worksheet.getCell(lpjEndRow, 7).font = { bold: true };

        // RIGHT SIDEBAR: Selisih, Subsidi Silang, & Catatan
        worksheet.mergeCells(`K${lpjStartRow}:L${lpjStartRow+1}`);
        const selisihBox = worksheet.getCell(`K${lpjStartRow}`);
        const rawSelisih = Number(rkaItem?.nominal || 0) - Number(lpjData.nominal);
        selisihBox.value = `Selisih\nRp ${rawSelisih.toLocaleString('id-ID')}`;
        selisihBox.font = { bold: true };
        selisihBox.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        selisihBox.border = thickBorder;

        let nextSidebarRow = lpjStartRow + 3;

        if (selisih > 0) {
            worksheet.mergeCells(`K${nextSidebarRow}:L${nextSidebarRow+2}`);
            const subsidiBox = worksheet.getCell(`K${nextSidebarRow}`);
            const subsidiText = subsidiSources.map(s => `- ${s.source}: Rp ${s.amount.toLocaleString('id-ID')} (${s.percent.toFixed(0)}%)`).join('\n');
            subsidiBox.value = `Subsidi Silang:\n${subsidiText || '-'}`;
            subsidiBox.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
            subsidiBox.border = thickBorder;
            nextSidebarRow += 4;
        }

        const catatanEndRow = Math.max(lpjEndRow, nextSidebarRow + 4);
        worksheet.mergeCells(`K${nextSidebarRow}:L${catatanEndRow}`);
        const catatanBox = worksheet.getCell(`K${nextSidebarRow}`);
        catatanBox.value = `Catatan:\n${narasi || '-'}`;
        catatanBox.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        catatanBox.border = thickBorder;

        // Apply Font "Times New Roman" Globally
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                if (!cell.font) cell.font = {};
                cell.font.name = 'Times New Roman';
            });
        });

        currentRow = Math.max(currentRow, catatanEndRow);

        // SECTION: Bukti Nota / Kuitansi (Moved to Bottom)
        if (attachments.length > 0) {
            currentRow += 3;
            worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
            const buktiHeader = worksheet.getCell(`A${currentRow}`);
            buktiHeader.value = 'BUKTI NOTA / KUITANSI';
            buktiHeader.font = { bold: true, size: 12 };
            buktiHeader.alignment = { horizontal: 'center' };
            buktiHeader.border = thickBorder;
            currentRow++;

            const buktiStartRow = currentRow;
            let imgCol = 1;
            let imgRow = currentRow;

            for (const att of attachments) {
                const { file, url, base64, customName } = att as any;
                
                // Determine extension and base64/buffer
                let extension: 'png' | 'jpeg' | 'gif' = 'png';
                let imageInput: { buffer: ArrayBuffer } | { base64: string } | null = null;
                
                if (file) {
                    if (file.type.startsWith('image/')) {
                        try {
                            const buffer = await file.arrayBuffer();
                            imageInput = { buffer };
                            extension = (file.name.split('.').pop() as any) || 'png';
                        } catch (e) {
                            console.error(e);
                        }
                    }
                } else if (base64 || url) {
                    const sourceString = base64 || url || '';
                    if (sourceString.startsWith('data:image/')) {
                        const matches = sourceString.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
                        if (matches && matches.length === 3) {
                            extension = matches[1] as any;
                            imageInput = { base64: matches[2] };
                        }
                    }
                }
                
                if (imageInput) {
                    try {
                        const imageId = workbook.addImage({
                            ...imageInput,
                            extension: extension
                        } as any);
                        
                        // Add Image First
                        worksheet.addImage(imageId, {
                            tl: { col: imgCol - 0.9, row: imgRow },
                            ext: { width: 250, height: 250 }
                        });

                        // Add Label BELOW image (approx row offset for 250px)
                        const labelRow = imgRow + 13;
                        worksheet.getCell(labelRow, imgCol).value = customName;
                        worksheet.getCell(labelRow, imgCol).font = { bold: true, size: 10, name: 'Times New Roman' };
                        worksheet.getCell(labelRow, imgCol).alignment = { horizontal: 'center' };
                        
                        imgCol += 4;
                        if (imgCol > 8) {
                            imgCol = 1;
                            imgRow += 16; 
                        }
                    } catch (e) {
                        console.error('Failed to add image to excel', e);
                    }
                }
            }
            // Ensure enough rows for images to be visible
            const finalImgRow = imgCol === 1 ? imgRow : imgRow + 16;
            for(let r=buktiStartRow; r<=finalImgRow; r++) {
                worksheet.getRow(r).height = 20; // Ensure row existence
            }
            currentRow = finalImgRow + 2;
        } else {
            currentRow += 2;
        }

        // SECTION: Otorisasi & Tanda Tangan
        currentRow += 1;
        const signRow = currentRow;
        
        // Bendahara Unit
        worksheet.mergeCells(`B${signRow}:C${signRow}`);
        worksheet.getCell(`B${signRow}`).value = 'Bendahara Unit,';
        worksheet.getCell(`B${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`B${signRow}`).alignment = { horizontal: 'center' };

        // Kepala Unit
        worksheet.mergeCells(`E${signRow}:F${signRow}`);
        worksheet.getCell(`E${signRow}`).value = 'Kepala Unit,';
        worksheet.getCell(`E${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`E${signRow}`).alignment = { horizontal: 'center' };

        // Bendahara Pusat
        worksheet.mergeCells(`H${signRow}:I${signRow}`);
        worksheet.getCell(`H${signRow}`).value = 'Bendahara Pusat,';
        worksheet.getCell(`H${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`H${signRow}`).alignment = { horizontal: 'center' };

        // Signature Spaces (Empty rows)
        currentRow += 5;
        const nameRow = currentRow;

        // Names (Underlines)
        worksheet.mergeCells(`B${nameRow}:C${nameRow}`);
        worksheet.getCell(`B${nameRow}`).border = { bottom: { style: 'thin' } };
        
        worksheet.mergeCells(`E${nameRow}:F${nameRow}`);
        worksheet.getCell(`E${nameRow}`).border = { bottom: { style: 'thin' } };
        
        worksheet.mergeCells(`H${nameRow}:I${nameRow}`);
        worksheet.getCell(`H${nameRow}`).border = { bottom: { style: 'thin' } };

        // Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LPJ_Formal_${unit || 'SmartSantri'}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (window.confirm("Apakah Anda yakin ingin mereset Tabel Realisasi Anggaran (LPJ)?")) {
            setLpjRows([
                { 
                    id: '1', 
                    program: '', 
                    operasional: '', 
                    jumlah: '1x', 
                    waktu: '', 
                    tempat: '', 
                    pic: '', 
                    sasaran: '', 
                    nominal: 0, 
                    details: { 
                        items: [{ name: '', unit: '', price: 0, qty: 0, total: 0 }], 
                        fundingSplits: [{ source: '', percent: 0, nominal: 0 }] 
                    }, 
                    isFilled: false 
                }
            ]);
            setNarasi('');
            setAttachments([]);
            setAttachmentPreviews([]);
            if (importRef.current) importRef.current.value = '';
        }
    };

    const handleExportPDF = () => {
        // Since jspdf is not available, we use window.print() 
        // with a print-friendly CSS approach (handled by tailwind print: classes or global css)
        window.print();
    };

    const handleSimpanDraft = async () => {
        if (!selectedRkaId) { alert('Rencana Kegiatan & Anggaran (RKA) wajib dipilih!'); return; }
        
        if (selisih > 0) {
            if (Math.abs(totalSubsidiPercent - 100) > 0.01) {
                alert(`Akumulasi Alokasi Subsidi Silang baru mencapai ${totalSubsidiPercent.toFixed(0)}%. Silakan lengkapi alokasi Subsidi Silang Anda hingga tepat 100% untuk menutupi seluruh overbudget sebesar Rp ${selisih.toLocaleString('id-ID')} sebelum menyimpan draf!`);
                return;
            }
        }
        
        setIsSaving(true);
        try {
            const processedAttachments = [];
            for (const att of attachments) {
                if (att.file) {
                    try {
                        const b64 = await fileToBase64(att.file);
                        processedAttachments.push({
                            customName: att.customName,
                            base64: b64
                        });
                    } catch (err) {
                        console.error("Failed to convert file to base64:", err);
                        processedAttachments.push({
                            customName: att.customName,
                            url: att.url || ''
                        });
                    }
                } else {
                    processedAttachments.push({
                        customName: att.customName,
                        url: att.url || '',
                        base64: att.base64 || ''
                    });
                }
            }

            const payload = {
                id: editId || undefined,
                rka_id: selectedRkaId,
                unit,
                bidang,
                bulan,
                tahun_ajaran: tahunAjaran,
                status: 'DRAFT' as const,
                total_nominal: realisasiTotal,
                lpjRows,
                narasi,
                subsidiSources,
                attachments: processedAttachments
            };

            const res = await saveLPJ(payload);
            if (res.error) {
                alert("Gagal menyimpan draf: " + res.error);
            } else {
                alert("Draf LPJ berhasil disimpan!");
                window.location.href = '/admin/pengajuan/draft-saya';
            }
        } catch (err: any) { 
            console.error("Error saving draft:", err);
            alert("Terjadi kesalahan: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKirim = async () => {
        // Validate unit, bidang, bulan, tahunAjaran
        if (!unit) { alert('Unit wajib dipilih!'); return; }
        if (!bidang) { alert('Bidang wajib dipilih!'); return; }
        if (!bulan) { alert('Bulan wajib dipilih!'); return; }
        if (!tahunAjaran) { alert('Tahun Ajaran wajib dipilih!'); return; }
        if (!selectedRkaId) { alert('Rencana Kegiatan & Anggaran (RKA) wajib dipilih!'); return; }

        // Validate LPJ Rows
        for (const row of lpjRows) {
            for (let rIdx = 0; rIdx < row.details.items.length; rIdx++) {
                const item = row.details.items[rIdx];
                if (!item.name?.trim()) {
                    alert(`Nama Item / Spesifikasi ke-${rIdx + 1} di Rincian Detail Realisasi wajib diisi!`);
                    return;
                }
                if (!item.unit?.trim()) {
                    alert(`Satuan item ke-${rIdx + 1} ("${item.name}") wajib diisi!`);
                    return;
                }
                if (Number(item.price || 0) <= 0) {
                    alert(`Harga item ke-${rIdx + 1} ("${item.name}") wajib lebih dari 0!`);
                    return;
                }
                if (Number(item.qty || 0) <= 0) {
                    alert(`Qty item ke-${rIdx + 1} ("${item.name}") wajib lebih dari 0!`);
                    return;
                }
            }
        }

        // Validate Bukti Nota / Lampiran
        if (attachments.length === 0) {
            alert('Bukti Nota / Lampiran wajib diunggah (minimal 1 file)!');
            return;
        }

        // Validate Subsidi Silang if over budget
        if (selisih > 0) {
            if (Math.abs(totalSubsidiPercent - 100) > 0.01 || sisaKekurangan > 0) {
                alert(`Realisasi melebihi anggaran sebesar Rp ${selisih.toLocaleString('id-ID')}. Anda harus mengalokasikan Subsidi Silang sampai tepat 100% untuk menutupi seluruh overbudget (sisa kekurangan harus Rp 0, akumulasi subsidi silang harus 100%)!`);
                return;
            }
            for (let sIdx = 0; sIdx < subsidiSources.length; sIdx++) {
                const sub = subsidiSources[sIdx];
                if (!sub.source) {
                    alert(`Sumber dana subsidi silang ke-${sIdx + 1} wajib dipilih!`);
                    return;
                }
                if (Number(sub.amount || 0) <= 0) {
                    alert(`Nominal subsidi silang ke-${sIdx + 1} ("${sub.source}") harus lebih dari 0!`);
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            const processedAttachments = [];
            for (const att of attachments) {
                if (att.file) {
                    try {
                        const b64 = await fileToBase64(att.file);
                        processedAttachments.push({
                            customName: att.customName,
                            base64: b64
                        });
                    } catch (err) {
                        console.error("Failed to convert file to base64:", err);
                        processedAttachments.push({
                            customName: att.customName,
                            url: att.url || ''
                        });
                    }
                } else {
                    processedAttachments.push({
                        customName: att.customName,
                        url: att.url || '',
                        base64: att.base64 || ''
                    });
                }
            }

            const payload = {
                id: editId || undefined,
                rka_id: selectedRkaId,
                unit,
                bidang,
                bulan,
                tahun_ajaran: tahunAjaran,
                status: 'MENUNGGU_VERIFIKASI' as const,
                total_nominal: realisasiTotal,
                lpjRows,
                narasi,
                subsidiSources,
                attachments: processedAttachments
            };

            const res = await saveLPJ(payload);
            if (res.error) {
                alert("Gagal mengirim realisasi: " + res.error);
            } else {
                alert('Berhasil dikirim ke Bendahara Unit!');
                window.location.href = '/admin';
            }
        } catch (err: any) { 
            console.error("Error submitting LPJ:", err);
            alert("Terjadi kesalahan: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-3 md:p-6 font-sans">
            <div className="max-w-[1440px] mx-auto space-y-4">
                
                {/* Header Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 shrink-0">
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                        {(docStatus === 'REVISI' || catatanRevisi) ? 'Revisi Realisasi Anggaran (LPJ)' : 'Buat Realisasi Anggaran (LPJ)'}
                                        {(docStatus === 'REVISI' || catatanRevisi) && (
                                            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-md animate-pulse">REVISI</span>
                                        )}
                                    </h1>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Pencatatan Realisasi Penggunaan Dana Program</p>
                                </div>
                            </div>

                            {catatanRevisi && (
                                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3 animate-in slide-in-from-top-2">
                                    <div className="bg-rose-500 text-white p-1.5 rounded-lg h-fit">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Catatan Revisi dari Bendahara:</p>
                                        <p className="text-xs font-bold text-rose-800 leading-relaxed italic">"{catatanRevisi}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Metadata Row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Building2 className="w-3 h-3 text-emerald-600" /> Unit <span className="text-rose-600">*</span>
                                    </label>
                                    <select 
                                        value={unit}
                                        disabled
                                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 outline-none cursor-not-allowed transition-all opacity-75"
                                    >
                                        <option value="">Pilih Unit...</option>
                                        <option value="SDIT 1">SDIT 1</option>
                                        <option value="SDIT 2">SDIT 2</option>
                                        <option value="SMPIT">SMPIT</option>
                                        <option value="SMAIT">SMAIT</option>
                                        <option value="Pesantren">Pesantren</option>
                                        <option value="TK">TK</option>
                                        <option value="MTs">MTs</option>
                                        <option value="MA">MA</option>
                                        <option value="Diniyah">Diniyah</option>
                                        <option value="Asrama Putra">Asrama Putra</option>
                                        <option value="Asrama Putri">Asrama Putri</option>
                                        <option value="THQ">THQ</option>
                                        <option value="Pusat (Yayasan)">Pusat (Yayasan)</option>
                                        {unit && !["SDIT 1", "SDIT 2", "SMPIT", "SMAIT", "Pesantren", "TK", "MTs", "MA", "Diniyah", "Asrama Putra", "Asrama Putri", "THQ", "Pusat (Yayasan)"].includes(unit) && (
                                            <option value={unit}>{unit}</option>
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <GraduationCap className="w-3 h-3 text-emerald-600" /> Bidang <span className="text-rose-600">*</span>
                                    </label>
                                    <select 
                                        value={bidang}
                                        onChange={(e) => setBidang(e.target.value)}
                                        className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    >
                                        <option value="">Pilih Bidang...</option>
                                        <option value="KESISWAAN">KESISWAAN</option>
                                        <option value="KURIKULUM">KURIKULUM</option>
                                        <option value="SARPRAS">SARPRAS</option>
                                        <option value="SDM">SDM</option>
                                        <option value="HUMAS">HUMAS</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3 text-emerald-600" /> Bulan <span className="text-rose-600">*</span>
                                    </label>
                                    <select 
                                        value={bulan}
                                        onChange={(e) => setBulan(e.target.value)}
                                        className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    >
                                        <option value="">Pilih Bulan...</option>
                                        <option value="Januari" disabled>Januari (Lampau)</option>
                                        <option value="Februari" disabled>Februari (Lampau)</option>
                                        <option value="Maret" disabled>Maret (Lampau)</option>
                                        <option value="April" disabled>April (Lampau)</option>
                                        <option value="Mei">Mei (Sekarang)</option>
                                        <option value="Juni">Juni</option>
                                        <option value="Juli">Juli</option>
                                        <option value="Agustus">Agustus</option>
                                        <option value="September">September</option>
                                        <option value="Oktober">Oktober</option>
                                        <option value="November">November</option>
                                        <option value="Desember">Desember</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Layers className="w-3 h-3 text-emerald-600" /> Tahun Ajaran <span className="text-rose-600">*</span>
                                    </label>
                                    <select 
                                        value={tahunAjaran}
                                        onChange={(e) => setTahunAjaran(e.target.value)}
                                        className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    >
                                        <option value="">Pilih Tahun...</option>
                                        <option value="2024/2025" disabled>2024/2025 (Lampau)</option>
                                        <option value="2025/2026">2025/2026 (Aktif)</option>
                                        <option value="2026/2027">2026/2027</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 relative">
                            <button 
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm group active:scale-95"
                            >
                                <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                    <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <span>Ekspor Excel</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 w-full">
                    
                    {/* Main Content Area (Tables) */}
                    <div className="space-y-6 w-full">
                        
                        {/* Selector for RKA */}
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                <Search className="w-3 h-3 text-emerald-600" /> Pilih Rencana Kegiatan & Anggaran (RKA) <span className="text-rose-600">*</span>
                            </label>
                            <select 
                                value={selectedRkaId && activeItemId ? `${selectedRkaId}##${activeItemId}` : selectedRkaId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        const [docId, itemId] = val.split('##');
                                        setSelectedRkaId(docId);
                                        setActiveItemId(itemId);
                                    } else {
                                        setSelectedRkaId('');
                                        setActiveItemId(null);
                                    }
                                    if (typeof window !== 'undefined') {
                                        window.history.replaceState({}, '', window.location.pathname);
                                    }
                                    setSubsidiSources([]);
                                }}
                                className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            >
                                <option value="">-- Pilih RKA yang sudah diterima --</option>
                                {(() => {
                                    const flatItems: any[] = [];
                                    approvedRkas
                                        .filter(doc => !unit || doc.unit === unit)
                                        .forEach(doc => {
                                            const items = doc.item_pengajuan || [];
                                            items.forEach((it: any) => {
                                                flatItems.push({
                                                    docId: doc.id,
                                                    itemId: it.id,
                                                    dateStr: doc.created_at?.split('T')[0] || '',
                                                    judul: it.judul_kegiatan || it.kegiatan || 'Tanpa Judul'
                                                });
                                            });
                                        });
                                    return flatItems.map(item => (
                                        <option key={`${item.docId}##${item.itemId}`} value={`${item.docId}##${item.itemId}`}>
                                            [{item.dateStr}] {item.judul}
                                        </option>
                                    ));
                                })()}
                            </select>
                        </div>

                        {/* TABEL RKA (TOP) */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tabel Rencana Kegiatan & Anggaran (RKA)</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[11px] min-w-[900px]">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr className="divide-x divide-slate-200">
                                            <th className="px-2 py-2 w-10 text-center font-black text-slate-900 uppercase tracking-widest">No</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-900 uppercase tracking-widest">Nama Program/ Kegiatan</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-900 uppercase tracking-widest">Deskripsi Kegiatan</th>
                                            <th className="px-2 py-2 text-center w-20 font-black text-slate-900 uppercase tracking-widest leading-tight">Jumlah</th>
                                            <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">Waktu</th>
                                            <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">Tempat</th>
                                            <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest leading-tight">PIC</th>
                                            <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">Sasaran</th>
                                            <th className="px-3 py-2 text-right w-28 font-black text-slate-900 uppercase tracking-widest">Anggaran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {selectedRkaData ? (
                                            selectedRkaData.item_pengajuan?.map((it: any, idx: number) => (
                                                <tr key={idx} className="divide-x divide-slate-100 hover:bg-slate-50 transition-colors italic">
                                                    <td className="px-3 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-bold text-slate-700">{it.judul_kegiatan}</td>
                                                    <td className="px-3 py-2 font-medium text-slate-600">{it.kategori_coa}</td>
                                                    <td className="px-2 py-2 text-center font-medium">{it.jumlah_kegiatan || 1}</td>
                                                    <td className="px-2 py-2">{it.waktu || '-'}</td>
                                                    <td className="px-2 py-2">{it.tempat || '-'}</td>
                                                    <td className="px-2 py-2">{it.pic || '-'}</td>
                                                    <td className="px-2 py-2">{it.sasaran || '-'}</td>
                                                    <td className="px-3 py-2 text-right font-black text-slate-900 bg-slate-50/30">Rp {(it.nominal || 0).toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="divide-x divide-slate-100 italic text-slate-300">
                                                <td className="px-3 py-2 text-center">-</td>
                                                <td className="px-3 py-2">-</td>
                                                <td className="px-3 py-2">-</td>
                                                <td className="px-2 py-2 text-center">-</td>
                                                <td className="px-2 py-2">-</td>
                                                <td className="px-2 py-2">-</td>
                                                <td className="px-2 py-2">-</td>
                                                <td className="px-2 py-2">-</td>
                                                <td className="px-3 py-2 text-right font-bold">-</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Detail Table Section for RKA */}
                            <div className="p-5 bg-slate-50/50 border-t border-slate-100">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Info className="w-3.5 h-3.5 text-emerald-600" />
                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Rincian Detail & Budgeting Plan:</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <table className="w-full border-collapse bg-white text-[10px]">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr className="divide-x divide-slate-200">
                                                        <th className="px-2 py-2 w-10 text-center font-black text-slate-600 uppercase tracking-widest">No</th>
                                                        <th className="px-3 py-2 text-left font-black text-slate-600 uppercase tracking-widest">Item / Spesifikasi</th>
                                                        <th className="px-2 py-2 text-center w-16 font-black text-slate-600 uppercase tracking-widest">Satuan</th>
                                                        <th className="px-2 py-2 text-right w-24 font-black text-slate-600 uppercase tracking-widest">Harga</th>
                                                        <th className="px-2 py-2 text-center w-12 font-black text-slate-600 uppercase tracking-widest">Qty</th>
                                                        <th className="px-3 py-2 text-right w-28 font-black text-emerald-800 uppercase tracking-widest bg-emerald-50/30">Total (Rp)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 italic">
                                                    {selectedRkaData ? (
                                                        selectedRkaData.item_pengajuan?.flatMap((it: any) => {
                                                            let details: any = {};
                                                            try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                            return details.items || (Array.isArray(details) ? details : []);
                                                        }).map((rin: any, rIdx: number) => (
                                                            <tr key={rIdx} className="divide-x divide-slate-100 hover:bg-slate-50 transition-colors">
                                                                <td className="px-2 py-1.5 text-center text-slate-400 font-bold">{rIdx + 1}</td>
                                                                <td className="px-3 py-1.5 font-bold text-slate-700">{rin.name || rin.item}</td>
                                                                <td className="px-2 py-1.5 text-center font-medium text-slate-500">{rin.unit || rin.satuan || '-'}</td>
                                                                <td className="px-2 py-1.5 text-right font-medium text-slate-600">{(rin.price || rin.harga_satuan || 0).toLocaleString('id-ID')}</td>
                                                                <td className="px-2 py-1.5 text-center font-bold text-slate-800">{rin.qty || rin.jumlah || 1}</td>
                                                                <td className="px-3 py-1.5 text-right font-black text-emerald-900 bg-emerald-50/10">{( (rin.price || rin.harga_satuan || 0) * (rin.qty || rin.jumlah || 1) ).toLocaleString('id-ID')}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr className="divide-x divide-slate-100 text-slate-300">
                                                            <td className="px-2 py-1.5 text-center">-</td>
                                                            <td className="px-3 py-1.5">-</td>
                                                            <td className="px-2 py-1.5 text-center">-</td>
                                                            <td className="px-2 py-1.5 text-right">-</td>
                                                            <td className="px-2 py-1.5 text-center">-</td>
                                                            <td className="px-3 py-1.5 text-right font-bold">-</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="w-56 shrink-0 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Alokasi Sumber Dana:</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2 text-[10px] font-bold">
                                            {rkaFundingAggregated.length > 0 ? rkaFundingAggregated.map((s, i) => (
                                                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-50">
                                                    <span className="text-slate-400">{s.source}</span>
                                                    <span className="text-slate-800">Rp {s.nominal.toLocaleString('id-ID')}</span>
                                                </div>
                                            )) : (
                                                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                                    <span className="text-slate-400 italic">Belum ada data dana</span>
                                                    <span className="text-slate-800">-</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-slate-100 text-slate-900">
                                                <span className="uppercase tracking-widest text-[9px] font-black">Total Anggaran</span>
                                                <span className="text-sm font-black italic tracking-tighter text-emerald-700">Rp {budgetTotal.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50 text-slate-900">
                                                <span className="uppercase tracking-widest text-[9px] font-black text-slate-400">Jenis Pencairan Dana</span>
                                                <span className="text-[10px] font-black text-slate-700 italic uppercase">
                                                    {selectedRkaData?.metode_pencairan || selectedRkaData?.metode_pembayaran || 'CASH'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TABEL REALISASI (BOTTOM) */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tabel Realisasi Anggaran (LPJ)</h2>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="file"
                                        ref={importRef}
                                        onChange={handleImportExcel}
                                        className="hidden"
                                        accept=".xlsx,.xls"
                                    />
                                    <button 
                                        onClick={() => importRef.current?.click()}
                                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 text-[10px] font-black transition-all uppercase tracking-widest"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                        Impor Excel
                                    </button>
                                    <button 
                                        onClick={handleReset}
                                        className="text-rose-600 hover:text-rose-700 flex items-center gap-1.5 text-[10px] font-black transition-all uppercase tracking-widest border-l border-slate-200 pl-3"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset Data
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[11px] min-w-[900px]">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr className="divide-x divide-slate-200">
                                            <th className="px-2 py-2 w-10 text-center font-black text-slate-900 uppercase tracking-widest">No</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                                Program/ Kegiatan <span className="text-rose-500">*</span>
                                            </th>
                                            <th className="px-3 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                                Deskripsi Kegiatan <span className="text-rose-500">*</span>
                                            </th>
                                            <th className="px-2 py-2 text-center w-20 font-black text-slate-900 uppercase tracking-widest leading-tight">
                                                Jumlah <span className="text-rose-500">*</span>
                                            </th>
                                            <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                                Waktu <span className="text-rose-500">*</span>
                                            </th>
                                            <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                                Tempat <span className="text-rose-500">*</span>
                                            </th>
                                            <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest leading-tight">
                                                PIC <span className="text-rose-500">*</span>
                                            </th>
                                            <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                                Sasaran <span className="text-rose-500">*</span>
                                            </th>
                                            <th className="px-3 py-2 text-right w-28 font-black text-slate-900 uppercase tracking-widest">
                                                Realisasi <span className="text-rose-500">*</span>
                                            </th>
                                            <th className="px-2 py-2 w-10 text-center font-black text-slate-900 uppercase tracking-widest">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {lpjRows.map((row, idx) => (
                                            <tr key={row.id} className="divide-x divide-slate-100 bg-white hover:bg-emerald-50/10 transition-colors group">
                                                <td className="px-3 py-2 text-center font-black text-slate-300">{idx + 1}</td>
                                                <td className="p-0 relative group border-r border-slate-100">
                                                    <select 
                                                        value={row.program}
                                                        onChange={(e) => updateLpjRow(row.id, 'program', e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-slate-100 outline-none text-[11px] font-black focus:ring-2 focus:ring-emerald-500 transition-all appearance-none text-emerald-900"
                                                    >
                                                        <option value="">Pilih Program...</option>
                                                        {RKA_PROGRAMS.map(prog => <option key={prog} value={prog}>{prog}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-300 pointer-events-none group-hover:text-emerald-500" />
                                                </td>
                                                <td className="p-0 relative group border-r border-slate-100">
                                                    <select 
                                                        value={row.operasional}
                                                        onChange={(e) => updateLpjRow(row.id, 'operasional', e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-slate-100 outline-none text-[11px] font-black focus:ring-2 focus:ring-emerald-500 transition-all appearance-none text-emerald-900"
                                                    >
                                                        <option value="">Deskripsi Kegiatan...</option>
                                                        {OPERASIONAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-300 pointer-events-none group-hover:text-emerald-500" />
                                                </td>
                                                <td className="p-0 border-r border-slate-100">
                                                    <input 
                                                        type="text"
                                                        value={row.jumlah}
                                                        onChange={(e) => updateLpjRow(row.id, 'jumlah', e.target.value)}
                                                        className="w-full h-10 px-2 bg-white border border-slate-100 outline-none text-[11px] font-black text-center focus:ring-2 focus:ring-emerald-500"
                                                        placeholder="1x"
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-100">
                                                    <input 
                                                        type="text"
                                                        value={row.waktu}
                                                        onChange={(e) => updateLpjRow(row.id, 'waktu', e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-slate-100 outline-none text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                                        placeholder="..."
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-100">
                                                    <input 
                                                        type="text"
                                                        value={row.tempat}
                                                        onChange={(e) => updateLpjRow(row.id, 'tempat', e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-slate-100 outline-none text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                                        placeholder="..."
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-100">
                                                    <input 
                                                        type="text"
                                                        value={row.pic}
                                                        onChange={(e) => updateLpjRow(row.id, 'pic', e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-slate-100 outline-none text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                                        placeholder="..."
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-100">
                                                    <input 
                                                        type="text"
                                                        value={row.sasaran}
                                                        onChange={(e) => updateLpjRow(row.id, 'sasaran', e.target.value)}
                                                        className="w-full h-10 px-3 bg-white border border-slate-100 outline-none text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                                        placeholder="..."
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right font-black text-emerald-900 bg-emerald-50/20">
                                                    Rp {row.nominal.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    <button 
                                                        onClick={() => deleteLpjRow(row.id)}
                                                        className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors"
                                                        title="Hapus Baris"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Detail Table Section for Realisasi */}
                            <div className="p-5 bg-slate-50/50 border-t border-slate-100">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Info className="w-3.5 h-3.5 text-emerald-600" />
                                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Rincian Detail Realisasi:</p>
                                            </div>
                                            <button 
                                                onClick={() => lpjRows[0] && addItemDetail(lpjRows[0].id)}
                                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-[9px] transition-all uppercase tracking-widest shadow-md shadow-emerald-100"
                                            >
                                                <PlusCircle className="w-3.5 h-3.5" /> Tambah Item Rincian
                                            </button>
                                        </div>
                                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <table className="w-full border-collapse bg-white text-[10px]">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr className="divide-x divide-slate-200">
                                                        <th className="px-2 py-2 w-10 text-center font-black text-slate-600 uppercase tracking-widest">No</th>
                                                        <th className="px-3 py-2 text-left font-black text-slate-600 uppercase tracking-widest">
                                                            Nama Item / Spesifikasi <span className="text-rose-500">*</span>
                                                        </th>
                                                        <th className="px-2 py-2 text-center w-16 font-black text-slate-600 uppercase tracking-widest">
                                                            Satuan <span className="text-rose-500">*</span>
                                                        </th>
                                                        <th className="px-2 py-2 text-right w-24 font-black text-slate-600 uppercase tracking-widest">
                                                            Harga <span className="text-rose-500">*</span>
                                                        </th>
                                                        <th className="px-2 py-2 text-center w-12 font-black text-slate-600 uppercase tracking-widest">
                                                            Qty <span className="text-rose-500">*</span>
                                                        </th>
                                                        <th className="px-3 py-2 text-right w-28 font-black text-emerald-800 uppercase tracking-widest bg-emerald-50/30">Total (Rp)</th>
                                                        <th className="px-2 py-2 w-10 text-center font-black text-slate-600 uppercase tracking-widest">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                {lpjRows.map((row) => (
                                                    <Fragment key={row.id}>
                                                        {row.details.items.map((rin: any, rIdx: number) => (
                                                            <tr key={`${row.id}-${rIdx}`} className="divide-x divide-slate-100 hover:bg-emerald-50/5 transition-colors">
                                                                <td className="px-2 py-1.5 text-center text-slate-400 font-bold">{rIdx + 1}</td>
                                                                <td className="p-0">
                                                                    <input 
                                                                        type="text"
                                                                        value={rin.name}
                                                                        onChange={(e) => updateLpjItem(row.id, rIdx, 'name', e.target.value)}
                                                                        className="w-full h-8 px-3 bg-transparent border-none outline-none text-xs font-bold text-slate-800 focus:bg-emerald-50/10"
                                                                        placeholder="Uraian item..."
                                                                    />
                                                                </td>
                                                                <td className="p-0">
                                                                    <input 
                                                                        type="text"
                                                                        value={rin.unit}
                                                                        onChange={(e) => updateLpjItem(row.id, rIdx, 'unit', e.target.value)}
                                                                        className="w-full h-8 px-2 bg-transparent border-none outline-none text-xs font-bold text-center text-slate-700 focus:bg-emerald-50/10"
                                                                        placeholder="Pcs"
                                                                    />
                                                                </td>
                                                                <td className="p-0">
                                                                    <div className="relative">
                                                                        <span className="absolute left-2 top-2 text-[8px] font-bold text-slate-300">Rp</span>
                                                                        <input 
                                                                            type="number"
                                                                            value={rin.price || ''}
                                                                            onChange={(e) => updateLpjItem(row.id, rIdx, 'price', e.target.value)}
                                                                            className="w-full h-8 pl-6 pr-2 bg-transparent border-none outline-none text-xs font-black text-right text-slate-800 focus:bg-emerald-50/10"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="p-0">
                                                                    <input 
                                                                        type="number"
                                                                        value={rin.qty || ''}
                                                                        onChange={(e) => updateLpjItem(row.id, rIdx, 'qty', e.target.value)}
                                                                        className="w-full h-8 px-2 bg-transparent border-none outline-none text-xs font-black text-center text-emerald-600 focus:bg-emerald-50/10"
                                                                        placeholder="0"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-1.5 text-right font-black text-emerald-900 bg-emerald-50/10">
                                                                    {rin.total.toLocaleString('id-ID')}
                                                                </td>
                                                                <td className="px-2 py-1.5 text-center">
                                                                    <button 
                                                                        onClick={() => removeItemDetail(row.id, rIdx)}
                                                                        className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                                                                        title="Hapus Item"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </Fragment>
                                                ))}
                                                {lpjRows.every(row => row.details.items.length === 0) && (
                                                    <tr className="divide-x divide-slate-100 text-slate-300">
                                                        <td className="px-2 py-1.5 text-center">-</td>
                                                        <td className="px-3 py-1.5">-</td>
                                                        <td className="px-2 py-1.5 text-center">-</td>
                                                        <td className="px-2 py-1.5 text-right">-</td>
                                                        <td className="px-2 py-1.5 text-center">-</td>
                                                        <td className="px-3 py-1.5 text-right font-bold">-</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Bottom Action & Attachment Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full pt-4 items-start">
                        {/* Summary Box */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>Total Budget RKA</span>
                                    <span className="text-slate-600 italic">Rp {budgetTotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-50">
                                    <span>Total Realisasi</span>
                                    <span className="text-emerald-700 text-lg tracking-tighter italic">Rp {realisasiTotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className={`flex justify-between items-center text-[11px] font-black uppercase tracking-widest pt-2 border-t border-slate-50 ${selisih > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    <span>Selisih (Variance)</span>
                                    <span>Rp {Math.abs(selisih).toLocaleString('id-ID')}</span>
                                </div>
                                {selisih > 0 && (
                                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest pt-1 text-slate-400">
                                        <span>Subsidi Silang</span>
                                        <span className="text-emerald-600">-Rp {totalSubsidi.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                {selisih > 0 && (
                                    <div className={`flex justify-between items-center text-[11px] font-black uppercase tracking-widest pt-2 border-t border-dashed border-slate-100 ${sisaKekurangan > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        <span>Sisa Selisih</span>
                                        <span>Rp {sisaKekurangan.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <button 
                                    onClick={handleKirim}
                                    disabled={isSubmitDisabled || isSaving}
                                    className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed disabled:shadow-none text-white font-black py-4 px-6 rounded-2xl shadow-xl transition-all flex flex-col items-center justify-center gap-0.5 group relative overflow-hidden active:scale-95"
                                >
                                    <div className="flex items-center gap-2">
                                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-emerald-400" />
                                        <span className="text-xs uppercase tracking-widest">{isSaving ? 'Memproses...' : 'Kirim Realisasi'}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Finalisasi LPJ Unit</span>
                                </button>

                                <button 
                                    onClick={handleSimpanDraft}
                                    disabled={isSaving}
                                    className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-slate-100 disabled:text-slate-300 text-amber-900 font-black py-3 px-6 rounded-2xl shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95 border-b-4 border-amber-600"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaving ? 'Menyimpan...' : 'Simpan Draft'}
                                </button>
                            </div>
                        </div>

                        {/* File Upload / Bukti Nota & Variance Box */}
                        <div className="space-y-4">
                            {/* Catatan / Keterangan Realisasi */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Catatan / Keterangan Realisasi
                                </label>
                                <textarea
                                    value={narasi}
                                    onChange={(e) => setNarasi(e.target.value)}
                                    placeholder="Masukkan catatan tambahan mengenai realisasi ini (misalnya: rincian kendala, alasan selisih anggaran, dsb)..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[90px] resize-y placeholder:text-slate-400 transition-all"
                                />
                            </div>

                            {/* File Upload / Bukti Nota */}
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Bukti Nota / Lampiran <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full">{attachments.length} File</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setIsCameraOpen(true)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 border-dashed rounded-2xl transition-all group"
                                    >
                                        <CameraIcon className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">Ambil Foto</span>
                                    </button>
                                    <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-2xl cursor-pointer transition-all group">
                                        <Upload className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Upload File</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>

                                {attachments.length > 0 && (
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                        {attachments.map((att, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shrink-0">
                                                        <FileIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-bold text-slate-700 truncate">{att.customName}</p>
                                                        <p className="text-[8px] text-slate-400">{att.file ? `${(att.file.size / 1024).toFixed(1)} KB` : 'Draf tersimpan'}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => removeAttachment(idx)}
                                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Variance Logic Box & Cross-Subsidy Allocation */}
                            {selisih !== 0 && (
                                <div className="space-y-4">
                                    <div className={`rounded-3xl p-5 border-2 animate-in slide-in-from-right-4 duration-500 ${selisih > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                        <div className="flex gap-3">
                                            <div className={`p-2 rounded-xl h-fit ${selisih > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${selisih > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {selisih > 0 ? 'Over Budget Detected' : 'Under Budget Detected'}
                                                </p>
                                                <p className={`text-[11px] leading-relaxed font-bold ${selisih > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
                                                    {selisih > 0 
                                                        ? `Terdapat selisih lebih sebesar Rp ${selisih.toLocaleString('id-ID')}. Silakan alokasikan Subsidi Silang di bawah ini untuk menutup kekurangan sebesar Rp ${sisaKekurangan.toLocaleString('id-ID')}.` 
                                                        : `Hemat anggaran sebesar Rp ${Math.abs(selisih).toLocaleString('id-ID')}.`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {selisih > 0 && (
                                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Percent className="w-3.5 h-3.5 text-rose-500" /> Alokasi Subsidi Silang <span className="text-rose-500">*</span>
                                                </label>
                                                <button 
                                                    onClick={isSubsidiComplete ? undefined : addSubsidi}
                                                    disabled={isSubsidiComplete}
                                                    className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors ${
                                                        isSubsidiComplete 
                                                            ? 'text-slate-300 cursor-not-allowed' 
                                                            : 'text-rose-600 hover:text-rose-700'
                                                    }`}
                                                >
                                                    + Tambah Alokasi Subsidi
                                                </button>
                                            </div>

                                            {totalSubsidiPercent < 100 && (
                                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl animate-pulse text-amber-800 text-[10px] font-bold leading-relaxed">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                    <span>Akumulasi Alokasi Subsidi Silang baru <strong>{totalSubsidiPercent.toFixed(0)}%</strong>. Silakan lengkapi alokasi Subsidi Silang Anda hingga tepat <strong>100%</strong> untuk menutupi seluruh overbudget sebesar Rp {selisih.toLocaleString('id-ID')}!</span>
                                                </div>
                                            )}

                                            {subsidiSources.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center gap-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum Ada Subsidi</span>
                                                    <span className="text-[9px] font-medium text-slate-400 max-w-[200px]">Alokasikan sumber dana tambahan untuk menutup kekurangan anggaran LPJ.</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {subsidiSources.map((sub, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                                                            <div className="flex-1">
                                                                <select
                                                                    value={sub.source}
                                                                    onChange={(e) => updateSubsidi(idx, 'source', e.target.value)}
                                                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
                                                                >
                                                                    <option value="">Pilih Sumber Dana...</option>
                                                                    {availableFundSources.map((src) => (
                                                                        <option key={src} value={src}>{src}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="w-20 relative">
                                                                <input
                                                                    type="number"
                                                                    value={sub.percent || ''}
                                                                    onChange={(e) => updateSubsidi(idx, 'percent', e.target.value)}
                                                                    className="w-full pl-2 pr-6 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 text-right"
                                                                    placeholder="0"
                                                                />
                                                                <Percent className="absolute right-2 top-2.5 w-3 h-3 text-slate-400" />
                                                            </div>
                                                            <div className="w-28 relative">
                                                                <span className="absolute left-2 top-2.5 text-[9px] font-bold text-slate-400">Rp</span>
                                                                <input
                                                                    type="number"
                                                                    value={sub.amount || ''}
                                                                    onChange={(e) => updateSubsidi(idx, 'amount', e.target.value)}
                                                                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 text-right"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => removeSubsidi(idx)}
                                                                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between items-center px-2 pt-2 border-t border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <span>Total Terdistribusi</span>
                                                        <span className={sisaKekurangan === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                            Rp {totalSubsidi.toLocaleString('id-ID')} / Rp {selisih.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>


            </div>

            {/* Camera Modal (Preserved) */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setIsCameraOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                                    <CameraIcon className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Ambil Foto Nota</h3>
                            </div>
                            <button onClick={() => setIsCameraOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="relative bg-black aspect-[3/4] flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 p-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black/60 to-transparent">
                                <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all group">
                                    <div className="w-12 h-12 border-4 border-slate-900 rounded-full group-hover:bg-slate-100 transition-colors"></div>
                                </button>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                <RotateCcw className="w-3 h-3" /> Posisikan nota tepat di tengah kamera
                            </p>
                        </div>
                    </div>
                </div>
            )}
                    </div>

            {/* --- PRINT ONLY REPORT --- */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 overflow-y-auto" style={{ fontFamily: '"Times New Roman", serif' }}>
                <div className="max-w-[1000px] mx-auto space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <h1 className="text-xl font-bold uppercase underline">Laporan Realisasi Anggaran</h1>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-4 gap-x-4 text-sm font-bold">
                        <div className="text-right">Unit :</div>
                        <div className="border-b border-black">{unit || '-'}</div>
                        <div className="text-right">Bulan :</div>
                        <div className="border-b border-black">{bulan || '-'}</div>
                        
                        <div className="text-right">Bidang :</div>
                        <div className="border-b border-black">{bidang || '-'}</div>
                        <div className="text-right">Tahun Ajaran :</div>
                        <div className="border-b border-black">{tahunAjaran || '-'}</div>
                    </div>

                    {/* RKA SECTION */}
                    <div className="space-y-2">
                        <div className="border border-black p-1 text-center font-bold bg-slate-50 text-sm">
                            Tabel Rencana Kegiatan & Anggaran (RKA)
                        </div>
                        <table className="w-full text-[10px] border-collapse border border-black">
                            <thead>
                                <tr className="font-bold text-center">
                                    <th className="border border-black p-1 w-8">No</th>
                                    <th className="border border-black p-1 text-left">Nama Program/ Kegiatan</th>
                                    <th className="border border-black p-1">Operasional</th>
                                    <th className="border border-black p-1">Jumlah</th>
                                    <th className="border border-black p-1">Waktu</th>
                                    <th className="border border-black p-1">Tempat</th>
                                    <th className="border border-black p-1">PIC</th>
                                    <th className="border border-black p-1">Sasaran</th>
                                    <th className="border border-black p-1">Anggaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedRkaData?.data?.map((rka: any, i: number) => (
                                    <tr key={i}>
                                        <td className="border border-black p-1 text-center">{i+1}</td>
                                        <td className="border border-black p-1">{rka.program}</td>
                                        <td className="border border-black p-1">{rka.operasional}</td>
                                        <td className="border border-black p-1 text-center">{rka.jumlah}</td>
                                        <td className="border border-black p-1 text-center">{rka.waktu}</td>
                                        <td className="border border-black p-1 text-center">{rka.tempat}</td>
                                        <td className="border border-black p-1 text-center">{rka.pic}</td>
                                        <td className="border border-black p-1 text-center">{rka.sasaran}</td>
                                        <td className="border border-black p-1 text-right">Rp {Number(rka.nominal).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* LPJ & SIDEBAR SECTION */}
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="border border-black p-1 text-center font-bold bg-slate-50 text-sm">
                                Tabel Realisasi Anggaran (LPJ)
                            </div>
                            <table className="w-full text-[10px] border-collapse border border-black">
                                <thead>
                                    <tr className="font-bold text-center">
                                        <th className="border border-black p-1 w-8">No</th>
                                        <th className="border border-black p-1 text-left">Nama Program/ Kegiatan</th>
                                        <th className="border border-black p-1">Operasional</th>
                                        <th className="border border-black p-1">Jumlah</th>
                                        <th className="border border-black p-1 text-right">Total Realisasi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lpjRows.map((row, i) => (
                                        <Fragment key={row.id}>
                                            <tr className="font-bold">
                                                <td className="border border-black p-1 text-center">{i+1}</td>
                                                <td className="border border-black p-1">{row.program}</td>
                                                <td className="border border-black p-1">{row.operasional}</td>
                                                <td className="border border-black p-1 text-center">{row.jumlah}</td>
                                                <td className="border border-black p-1 text-right">Rp {Number(row.nominal).toLocaleString()}</td>
                                            </tr>
                                            {/* Items */}
                                            {row.details.items.map((item, idx) => (
                                                <tr key={idx} className="italic text-slate-600">
                                                    <td className="border border-black"></td>
                                                    <td className="border border-black p-0.5 pl-4">• {item.name}</td>
                                                    <td className="border border-black p-0.5 text-center text-[8px]">{item.price.toLocaleString()} x {item.qty}</td>
                                                    <td className="border border-black"></td>
                                                    <td className="border border-black p-0.5 text-right">Rp {item.total.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {/* Splits */}
                                            {row.details.fundingSplits.map((split, sidx) => (
                                                <tr key={`s-${sidx}`} className="text-[9px]">
                                                    <td colSpan={3} className="border border-black"></td>
                                                    <td className="border border-black p-0.5 text-right font-bold italic">{split.source} ({split.percent}%):</td>
                                                    <td className="border border-black p-0.5 text-right font-bold">Rp {Number(split.nominal).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold bg-slate-100">
                                        <td colSpan={4} className="border border-black p-1 text-right uppercase">Total Seluruh Realisasi</td>
                                        <td className="border border-black p-1 text-right">Rp {realisasiTotal.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Sidebar */}
                        <div className="w-64 space-y-4 pt-10">
                            <div className="border-2 border-black p-4 text-center space-y-1">
                                <p className="text-[10px] font-bold uppercase underline">Selisih Anggaran</p>
                                <p className={`text-sm font-bold ${selisih > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    Rp {selisih.toLocaleString()}
                                </p>
                            </div>
                            <div className="border-2 border-black p-4 h-48">
                                <p className="text-[10px] font-bold uppercase underline mb-2">Catatan:</p>
                                <p className="text-[10px] whitespace-pre-wrap">{narasi || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Evidence Gallery */}
                    {attachments.length > 0 && (
                        <div className="space-y-4">
                            <div className="border-2 border-black bg-slate-900 text-white text-center py-1 text-xs font-bold uppercase tracking-widest">
                                Bukti Nota / Kuitansi (Evidence Gallery)
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                {attachments.map((att, idx) => (
                                    <div key={idx} className="space-y-2 text-center break-inside-avoid">
                                        <img 
                                            src={att.file ? URL.createObjectURL(att.file) : (att.base64 || att.url || '')} 
                                            alt={att.customName}
                                            className="w-full h-64 object-contain border border-slate-300 rounded shadow-sm"
                                        />
                                        <p className="text-xs font-bold uppercase underline">{att.customName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer / Signature Area */}
                    <div className="pt-12 grid grid-cols-2 text-center text-xs">
                        <div className="space-y-12">
                            <p>Diajukan Oleh,</p>
                            <div className="border-b border-black w-48 mx-auto"></div>
                            <p className="font-bold uppercase">( Staff / Pelaksana )</p>
                        </div>
                        <div className="space-y-12">
                            <p>Mengetahui,</p>
                            <div className="border-b border-black w-48 mx-auto"></div>
                            <p className="font-bold uppercase">( Bendahara Unit )</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
