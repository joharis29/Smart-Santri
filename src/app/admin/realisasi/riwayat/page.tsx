'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { 
    History, 
    Download, 
    Eye, 
    FileText, 
    FileSpreadsheet,
    Search, 
    Filter, 
    ArrowUpRight,
    CheckCircle2,
    Building2,
    Calendar,
    Wallet,
    X,
    ClipboardCheck,
    Paperclip,
    AlertTriangle,
    Activity,
    Tag,
    GraduationCap,
    Bot
} from 'lucide-react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/client';

interface RiwayatDokumen {
    id: string;
    itemId: string;
    tanggal: string;
    pengaju: string;
    unit: string;
    bidang?: string;
    bulan?: string;
    tahun_ajaran?: string;
    kegiatan: string;
    program?: string;
    sumber: string;
    nominal: number;
    status: string;
}

export default function RiwayatDokumenPage() {
    const supabase = createClient();
    const [riwayatItems, setRiwayatItems] = useState<RiwayatDokumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Filter States
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [selectedBidangs, setSelectedBidangs] = useState<string[]>([]);
    const [selectedSumber, setSelectedSumber] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string[]>([]);

    // Detail Modal States
    const [selectedItemForDetail, setSelectedItemForDetail] = useState<RiwayatDokumen | null>(null);
    const [detailLpjDoc, setDetailLpjDoc] = useState<any>(null);
    const [detailRkaDoc, setDetailRkaDoc] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedRevisionSnapshot, setSelectedRevisionSnapshot] = useState<any>(null);
    
    // AI Audit States
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResult, setAuditResult] = useState<any>(null);

    const handleAuditAI = async () => {
        if (!selectedItemForDetail?.itemId) return;
        
        // Extract data for payload
        const lpjItem = detailLpjDoc?.item_pengajuan?.find((it: any) => it.id === selectedItemForDetail.itemId) || detailLpjDoc?.item_pengajuan?.[0];
        let lpjDetails: any = {};
        try { lpjDetails = typeof lpjItem?.rincian_json === 'string' ? JSON.parse(lpjItem.rincian_json) : (lpjItem?.rincian_json || {}); } catch(e) {}
        
        const payload = {
            id: selectedItemForDetail.itemId,
            jenis: 'LPJ',
            narasi: lpjDetails.narasi || lpjItem?.judul_kegiatan || 'Realisasi anggaran',
            kategoriCoa: lpjItem?.kategori_coa || selectedItemForDetail.bidang || 'Lainnya',
            sumberDana: lpjItem?.sumber_dana || selectedItemForDetail.sumber || 'Yayasan',
            nominal: Number(lpjItem?.nominal || selectedItemForDetail.nominal || 0),
            rincian: lpjDetails.items || []
        };

        setIsAuditing(true);
        setAuditResult(null);
        try {
            const res = await fetch('/api/audit-lpj', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setAuditResult(data.result);
                // Update local detail object so it persists in UI without refresh
                if (detailLpjDoc && detailLpjDoc.item_pengajuan) {
                    const idx = detailLpjDoc.item_pengajuan.findIndex((it: any) => it.id === selectedItemForDetail.itemId);
                    if (idx > -1) {
                        detailLpjDoc.item_pengajuan[idx].status_audit_ai = data.result.status;
                        detailLpjDoc.item_pengajuan[idx].catatan_ai = data.result;
                    }
                }
            } else {
                alert("Audit gagal: " + (data.error || "Unknown error"));
            }
        } catch (e: any) {
            alert("Terjadi kesalahan jaringan saat Audit AI.");
        } finally {
            setIsAuditing(false);
        }
    };

    const handleViewDetail = async (item: RiwayatDokumen) => {
        setSelectedItemForDetail(item);
        setAuditResult(null);
        setLoadingDetail(true);
        try {
            // Fetch full LPJ Document and its items
            const { data: lpjDoc, error: lpjError } = await supabase
                .from('dokumen_pengajuan')
                .select('*, item_pengajuan(*)')
                .eq('id', item.id)
                .maybeSingle();

            if (lpjError || !lpjDoc) {
                console.error("Gagal mengambil data detail LPJ:", lpjError);
                return;
            }

            setDetailLpjDoc(lpjDoc);

            const lpjItem = lpjDoc.item_pengajuan?.find((it: any) => it.id === item.itemId) || lpjDoc.item_pengajuan?.[0];
            let lpjDetails: any = {};
            if (lpjItem?.rincian_json) {
                try {
                    lpjDetails = typeof lpjItem.rincian_json === 'string'
                        ? JSON.parse(lpjItem.rincian_json)
                        : lpjItem.rincian_json;
                } catch (e) {
                    lpjDetails = {};
                }
            }

            const rkaId = lpjDetails?.rka_id;
            if (rkaId) {
                const { data: rkaDoc } = await supabase
                    .from('dokumen_pengajuan')
                    .select('*, item_pengajuan(*)')
                    .eq('id', rkaId)
                    .maybeSingle();

                if (rkaDoc && rkaDoc.jenis === 'REVISI_RKA' && rkaDoc.parent_id) {
                    const { data: parentRkaDoc } = await supabase
                        .from('dokumen_pengajuan')
                        .select('*, item_pengajuan(*)')
                        .eq('id', rkaDoc.parent_id)
                        .maybeSingle();
                    rkaDoc.parentDoc = parentRkaDoc;
                }
                setDetailRkaDoc(rkaDoc);
            } else {
                setDetailRkaDoc(null);
            }
        } catch (err) {
            console.error("Error fetching detail:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Handle outside click for filter
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Completed LPJ items from Supabase
    useEffect(() => {
        const fetchRiwayat = async () => {
            setLoading(true);
            try {
                // 1. Get current user
                const { data: authData } = await supabase.auth.getUser();
                const user = authData?.user;
                if (!user) {
                    setLoading(false);
                    return;
                }

                // 2. Get active role & unit
                const role = localStorage.getItem(`activeRole_${user.id}`);
                setUserRole(role);
                const activeUnit = localStorage.getItem(`activeUnit_${user.id}`) || 'Pusat (Yayasan)';

                // 3. Query dokumen_pengajuan
                let query = supabase
                    .from('dokumen_pengajuan')
                    .select(`
                        *,
                        item_pengajuan(*)
                    `)
                    .eq('jenis', 'LPJ')
                    .eq('status', 'SELESAI')
                    .order('updated_at', { ascending: false });

                // If not Pusat/Admin/Pimpinan, filter by active unit
                if (role !== 'BENDAHARA_PUSAT' && role !== 'ADMINISTRATOR' && role !== 'PIMPINAN') {
                    query = query.eq('unit', activeUnit);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Error fetching LPJ riwayat:", error);
                } else if (data) {
                    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const mapped: RiwayatDokumen[] = [];
                    data.forEach(doc => {
                        const items = doc.item_pengajuan || [];
                        items.forEach((it: any) => {
                            mapped.push({
                                id: doc.id,
                                itemId: it.id,
                                tanggal: doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                                bulan: monthNames[Number(doc.periode_bulan)] || String(doc.periode_bulan),
                                tahun_ajaran: doc.tahun_ajaran || `${doc.periode_tahun}/${Number(doc.periode_tahun) + 1}`,
                                unit: doc.unit || 'SDIT 1',
                                bidang: doc.bidang || 'Tanpa Bidang',
                                pengaju: doc.pembuat_email || doc.unit || 'Staf Pengaju',
                                kegiatan: it.judul_kegiatan || it.kegiatan || 'Realisasi Anggaran',
                                sumber: (() => {
                                    const splits = it.rincian_json?.fundingSplits || [];
                                    const subSplits = it.rincian_json?.subsidiSources || [];
                                    const sources = [...splits, ...subSplits]
                                        .filter((s: any) => s.source && s.nominal > 0)
                                        .map((s: any) => s.source);
                                    const uniqueSources = Array.from(new Set(sources));
                                    return uniqueSources.length > 0 ? uniqueSources.join(' & ') : (it.sumber_dana || 'Dana Yayasan');
                                })(),
                                nominal: it.nominal || 0,
                                status: doc.status
                            });
                        });
                    });
                    setRiwayatItems(mapped);
                }
            } catch (err) {
                console.error("Error loading LPJ riwayat page data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRiwayat();
    }, []);

    // Export LPJ Document details to Excel (Comparison of RKA & LPJ with dynamic three-level signatures)
    const handleExportDocumentToExcel = async (docId: string, itemId: string) => {
        // Fetch full LPJ Document and its items
        const { data: lpjDoc, error: lpjError } = await supabase
            .from('dokumen_pengajuan')
            .select('*, item_pengajuan(*)')
            .eq('id', docId)
            .maybeSingle();

        if (lpjError || !lpjDoc) {
            alert("Gagal mengunduh data realisasi LPJ: " + (lpjError?.message || "Laporan tidak ditemukan"));
            return;
        }

        const lpjItem = lpjDoc.item_pengajuan?.find((it: any) => it.id === itemId) || lpjDoc.item_pengajuan?.[0];
        let lpjDetails: any = {};
        if (lpjItem?.rincian_json) {
            try {
                lpjDetails = typeof lpjItem.rincian_json === 'string'
                    ? JSON.parse(lpjItem.rincian_json)
                    : lpjItem.rincian_json;
            } catch (e) {
                lpjDetails = {};
            }
        }

        // Fetch original RKA Document
        const rkaId = lpjDetails?.rka_id;
        let rkaDoc: any = null;
        let rkaItem: any = null;
        let rkaDetails: any = {};

        if (rkaId) {
            const { data } = await supabase
                .from('dokumen_pengajuan')
                .select('*, item_pengajuan(*)')
                .eq('id', rkaId)
                .maybeSingle();
            if (data) {
                rkaDoc = data;
                rkaItem = rkaDoc.item_pengajuan?.[0];
                if (rkaItem?.rincian_json) {
                    try {
                        rkaDetails = typeof rkaItem.rincian_json === 'string'
                            ? JSON.parse(rkaItem.rincian_json)
                            : rkaItem.rincian_json;
                    } catch (e) {
                        rkaDetails = {};
                    }
                }
            }
        }

        const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const bulanName = monthNames[Number(lpjDoc.periode_bulan)] || String(lpjDoc.periode_bulan);
        const tahunAjaranStr = lpjDoc.tahun_ajaran || `${lpjDoc.periode_tahun}/${Number(lpjDoc.periode_tahun) + 1}`;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('LPJ Realisasi & Perbandingan RKA');

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

        // Column Config (parity with the Buat LPJ page)
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
        titleCell.value = 'Laporan Realisasi & Perbandingan Anggaran (LPJ vs RKA)';
        titleCell.font = { name: 'Times New Roman', bold: true, size: 14 };

        // 2. Metadata Row
        worksheet.getRow(2).values = ['Unit :', '', 'Bidang :', '', 'Bulan :', '', 'Tahun Ajaran :'];
        worksheet.getCell('B2').value = lpjDoc.unit || '-';
        worksheet.getCell('D2').value = lpjDoc.bidang || '-';
        worksheet.getCell('F2').value = bulanName;
        worksheet.getCell('H2').value = tahunAjaranStr;
        worksheet.getRow(2).font = { name: 'Times New Roman', bold: true, size: 10 };
        
        // Right align labels
        [1, 3, 5, 7].forEach(col => {
            worksheet.getCell(2, col).alignment = { horizontal: 'right' };
        });

        let currentRow = 4;

        // --- SECTION 1: RKA ---
        const rkaStartRow = currentRow;
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const rkaTitle = worksheet.getCell(`A${currentRow}`);
        rkaTitle.value = 'Tabel Rencana Kegiatan & Anggaran (RKA) - Target/Rencana';
        rkaTitle.font = { name: 'Times New Roman', bold: true };
        currentRow++;

        const rkaHeaderRow = worksheet.getRow(currentRow);
        rkaHeaderRow.values = ['No', 'Nama Program/ Kegiatan', 'Operasional', 'Jumlah Kegiatan', 'Waktu', 'Tempat', 'Penanggung Jawab', 'Sasaran', 'Rencana Anggaran'];
        currentRow++;

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
        worksheet.getCell(`I${currentRow}`).value = rkaDoc?.metode_pencairan || rkaDoc?.metode_pembayaran || 'CASH';
        worksheet.getCell(`I${currentRow}`).font = { italic: true };
        const rkaEndRow = currentRow;

        // Apply Borders & Bold Headers
        for (let r = rkaStartRow; r <= rkaEndRow; r++) {
            for (let c = 1; c <= 9; c++) {
                const cell = worksheet.getCell(r, c);
                cell.border = thinBorder;
                
                // Bold Headers
                if (r === rkaStartRow || r === rkaStartRow + 1 || r === rkaStartRow + 4) {
                    cell.font = { bold: true, size: r === rkaStartRow ? 10 : 9, name: 'Times New Roman' };
                }
                
                if (r === rkaStartRow || r === rkaStartRow + 1) cell.alignment = { horizontal: 'center' };
            }
        }
        // Bold RKA Summary Titles
        for (let r = rkaEndRow - rkaSplits.length - 1; r <= rkaEndRow; r++) {
            worksheet.getCell(r, 7).font = { bold: true, name: 'Times New Roman' };
        }

        currentRow += 2;

        // --- SECTION 2: LPJ ---
        const lpjStartRow = currentRow;
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const lpjTitle = worksheet.getCell(`A${currentRow}`);
        lpjTitle.value = 'Tabel Realisasi Anggaran (LPJ) - Aktual/Realisasi';
        lpjTitle.font = { name: 'Times New Roman', bold: true };
        currentRow++;

        const lpjHeaderRow = worksheet.getRow(currentRow);
        lpjHeaderRow.values = ['No', 'Nama Program/ Kegiatan', 'Operasional', 'Jumlah Kegiatan', 'Waktu', 'Tempat', 'Penanggung Jawab', 'Sasaran', 'Total Realisasi'];
        currentRow++;

        const lpjMainRow = worksheet.getRow(currentRow);
        lpjMainRow.values = [
            1, 
            lpjItem?.judul_kegiatan || 'Realisasi Anggaran', 
            lpjItem?.kategori_coa || 'Lainnya', 
            lpjDetails?.jumlah_kegiatan || '1x', 
            lpjItem?.waktu || '-', 
            lpjItem?.tempat || '-', 
            lpjItem?.pic || '-', 
            lpjItem?.sasaran || '-', 
            Number(lpjItem?.nominal || 0)
        ];
        lpjMainRow.getCell(9).numFmt = '"Rp "#,##0';
        currentRow++;

        const lpjRincianLabelRow = worksheet.getRow(currentRow);
        lpjRincianLabelRow.getCell(2).value = 'Rincian Detail Realisasi:';
        lpjRincianLabelRow.getCell(2).font = { italic: true, size: 9 };
        currentRow++;

        const lpjSubHeader = worksheet.getRow(currentRow);
        lpjSubHeader.values = ['No', 'Nama Item / Spesifikasi', 'Satuan', 'Harga Satuan', 'Qty', 'Total (Rp)'];
        currentRow++;

        const lpjSubItems = lpjDetails?.items || [{ name: lpjItem?.judul_kegiatan || '', unit: 'Pcs', price: Number(lpjItem?.nominal || 0), qty: 1, total: Number(lpjItem?.nominal || 0) }];
        lpjSubItems.forEach((item: any, i: number) => {
            const row = worksheet.getRow(currentRow);
            row.values = [i + 1, item.name, item.unit, Number(item.price || 0), Number(item.qty || 0), Number(item.total || 0)];
            [4, 6].forEach(c => row.getCell(c).numFmt = '"Rp "#,##0');
            currentRow++;
        });

        // LPJ Footer
        worksheet.mergeCells(`G${currentRow}:H${currentRow}`);
        worksheet.getCell(`G${currentRow}`).value = 'Total Realisasi';
        worksheet.getCell(`G${currentRow}`).font = { bold: true };
        worksheet.getCell(`I${currentRow}`).value = Number(lpjItem?.nominal || 0);
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
                    cell.font = { bold: true, size: r === lpjStartRow ? 10 : 9, name: 'Times New Roman' };
                }

                if (r === lpjStartRow || r === lpjStartRow + 1) cell.alignment = { horizontal: 'center' };
            }
        }
        worksheet.getCell(lpjEndRow, 7).font = { bold: true, name: 'Times New Roman' };

        // RIGHT SIDEBAR: Selisih, Subsidi Silang, & Catatan
        worksheet.mergeCells(`K${lpjStartRow}:L${lpjStartRow+1}`);
        const selisihBox = worksheet.getCell(`K${lpjStartRow}`);
        const rawSelisih = Number(rkaItem?.nominal || 0) - Number(lpjItem?.nominal || 0);
        const selisih = -rawSelisih;
        selisihBox.value = `Selisih\nRp ${rawSelisih.toLocaleString('id-ID')}`;
        selisihBox.font = { bold: true, name: 'Times New Roman' };
        selisihBox.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        selisihBox.border = thickBorder;

        let nextSidebarRow = lpjStartRow + 3;

        const subsidiSources = lpjDetails?.subsidiSources || [];
        if (selisih > 0) {
            worksheet.mergeCells(`K${nextSidebarRow}:L${nextSidebarRow+2}`);
            const subsidiBox = worksheet.getCell(`K${nextSidebarRow}`);
            const subsidiText = subsidiSources.map((s: any) => `- ${s.source}: Rp ${Number(s.amount).toLocaleString('id-ID')} (${Number(s.percent).toFixed(0)}%)`).join('\n');
            subsidiBox.value = `Subsidi Silang:\n${subsidiText || '-'}`;
            subsidiBox.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
            subsidiBox.border = thickBorder;
            nextSidebarRow += 4;
        }

        const catatanEndRow = Math.max(lpjEndRow, nextSidebarRow + 4);
        worksheet.mergeCells(`K${nextSidebarRow}:L${catatanEndRow}`);
        const catatanBox = worksheet.getCell(`K${nextSidebarRow}`);
        catatanBox.value = `Catatan:\n${lpjDetails?.narasi || '-'}`;
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
        const attachments = lpjDetails?.attachments || [];
        if (attachments.length > 0) {
            currentRow += 3;
            worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
            const buktiHeader = worksheet.getCell(`A${currentRow}`);
            buktiHeader.value = 'BUKTI NOTA / KUITANSI';
            buktiHeader.font = { bold: true, size: 12, name: 'Times New Roman' };
            buktiHeader.alignment = { horizontal: 'center' };
            buktiHeader.border = thickBorder;
            currentRow++;

            const buktiStartRow = currentRow;
            let imgCol = 1;
            let imgRow = currentRow;

            for (const att of attachments) {
                const { file, url, base64, customName } = att as any;
                
                let extension: 'png' | 'jpeg' | 'gif' = 'png';
                let imageInput: { buffer: ArrayBuffer } | { base64: string } | null = null;
                
                if (file) {
                    if (file.type?.startsWith('image/')) {
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
                    } else if (sourceString.startsWith('http')) {
                        try {
                            const res = await fetch(sourceString);
                            if (res.ok) {
                                const buffer = await res.arrayBuffer();
                                imageInput = { buffer };
                                extension = (sourceString.split('.').pop()?.split('?')[0] as any) || 'png';
                            }
                        } catch (e) {
                            console.error('Failed to fetch image attachment:', e);
                        }
                    }
                }
                
                if (imageInput) {
                    try {
                        const imageId = workbook.addImage({
                            ...imageInput,
                            extension: extension
                        } as any);
                        
                        worksheet.addImage(imageId, {
                            tl: { col: imgCol - 0.9, row: imgRow },
                            ext: { width: 250, height: 250 }
                        });

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
            const finalImgRow = imgCol === 1 ? imgRow : imgRow + 16;
            for(let r=buktiStartRow; r<=finalImgRow; r++) {
                worksheet.getRow(r).height = 20;
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
        worksheet.getCell(`B${signRow}`).value = 'Bendahara Unit/Jenjang,';
        worksheet.getCell(`B${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`B${signRow}`).alignment = { horizontal: 'center' };

        // Kepala Unit
        worksheet.mergeCells(`E${signRow}:F${signRow}`);
        worksheet.getCell(`E${signRow}`).value = 'Kepala Unit/Jenjang,';
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

        // Title Info
        currentRow += 1;
        const infoRow = currentRow;
        worksheet.mergeCells(`B${infoRow}:C${infoRow}`);
        worksheet.getCell(`B${infoRow}`).value = `Bendahara ${lpjDoc.unit || 'Unit/Jenjang'}`;
        worksheet.getCell(`B${infoRow}`).font = { name: 'Times New Roman', size: 9, italic: true };
        worksheet.getCell(`B${infoRow}`).alignment = { horizontal: 'center' };

        worksheet.mergeCells(`E${infoRow}:F${infoRow}`);
        worksheet.getCell(`E${infoRow}`).value = `Kepala ${lpjDoc.unit || 'Unit/Jenjang'}`;
        worksheet.getCell(`E${infoRow}`).font = { name: 'Times New Roman', size: 9, italic: true };
        worksheet.getCell(`E${infoRow}`).alignment = { horizontal: 'center' };

        worksheet.mergeCells(`H${infoRow}:I${infoRow}`);
        worksheet.getCell(`H${infoRow}`).value = 'Bendahara Pusat (Yayasan)';
        worksheet.getCell(`H${infoRow}`).font = { name: 'Times New Roman', size: 9, italic: true };
        worksheet.getCell(`H${infoRow}`).alignment = { horizontal: 'center' };

        // Force Times New Roman font on new signature rows
        for (let r = signRow; r <= infoRow; r++) {
            worksheet.getRow(r).eachCell((cell) => {
                if (!cell.font) cell.font = {};
                cell.font.name = 'Times New Roman';
            });
        }

        // Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LPJ_Formal_${lpjDoc.unit || 'SmartSantri'}_${Date.now()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Export all filtered table rows to a premium Excel sheet
    const handleExportFilteredToExcel = async () => {
        if (filteredRiwayat.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Riwayat LPJ');

        // Header Title
        worksheet.mergeCells('A1:J1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'REKAPITULASI RIWAYAT REALISASI ANGGARAN (LPJ)';
        titleCell.font = { name: 'Times New Roman', size: 14, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Subtitle Metadata (Export Date)
        worksheet.mergeCells('A2:J2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        dateCell.font = { name: 'Times New Roman', size: 10, italic: true };
        dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.addRow([]); // Blank spacer row

        // Table Headers
        const headers = [
            'No', 
            'Tanggal', 
            'Bulan / Periode', 
            'Tahun Ajaran', 
            'Unit', 
            'Bidang', 
            'Program / Kegiatan', 
            'Sumber Dana', 
            'Total Realisasi (Rp)', 
            'Status'
        ];
        
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, name: 'Times New Roman', size: 11 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF1F5F9' } // Light slate header background
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Add Data Rows
        filteredRiwayat.forEach((row, index) => {
            const dataRow = worksheet.addRow([
                index + 1,
                row.tanggal || '-',
                row.bulan || '-',
                row.tahun_ajaran || '-',
                row.unit || '-',
                row.bidang || '-',
                row.kegiatan || '-',
                row.sumber || '-',
                Number(row.nominal || 0),
                row.status || '-'
            ]);

            // Number formatting for Rp nominal
            dataRow.getCell(9).numFmt = '"Rp "#,##0';
            
            // Text styling & thin borders
            dataRow.eachCell((cell, colNum) => {
                cell.font = { name: 'Times New Roman', size: 10 };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                // Alignments
                if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 4 || colNum === 10) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                } else if (colNum === 9) {
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                } else {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }

                // Highlight status colours
                if (colNum === 10) {
                    if (row.status === 'SELESAI') {
                        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF059669' } };
                    } else if (row.status === 'DRAF' || row.status === 'DRAFT') {
                        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF64748B' } };
                    } else {
                        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFD97706' } };
                    }
                }
            });
        });

        // Set column widths dynamically for premium styling
        worksheet.columns.forEach(col => {
            if (!col || !col.values) return;
            const values = col.values as string[];
            let maxLen = 0;
            values.forEach(val => {
                if (val) {
                    const str = val.toString();
                    if (str.length > maxLen) maxLen = str.length;
                }
            });
            col.width = Math.max(maxLen + 4, 12);
        });

        // Generate and trigger download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Riwayat_LPJ_${Date.now()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Extract unique filter options
    const availableUnits = Array.from(new Set(riwayatItems.map((i: any) => i.unit).filter(Boolean)));
    const availableBidangs = Array.from(new Set(riwayatItems.map((i: any) => i.bidang).filter(Boolean)));
    const availableSumber = Array.from(new Set(
        riwayatItems.flatMap((i: any) => {
            if (!i.sumber) return [];
            return i.sumber.split(/\s*&\s*|\s*\/\s*/).map((s: string) => s.trim().replace(/Dana\s+/gi, ''));
        })
    )).filter(Boolean);
    const availableMonths = Array.from(new Set(riwayatItems.map((i: any) => i.bulan).filter(Boolean)));
    const availableTahunAjaran = Array.from(new Set(riwayatItems.map((i: any) => i.tahun_ajaran).filter(Boolean)));

    // Compute filtered items
    const filteredRiwayat = riwayatItems.filter(item => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
            item.kegiatan.toLowerCase().includes(q) || 
            item.pengaju.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            item.unit.toLowerCase().includes(q);
        
        const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(item.unit);
        const matchesBidang = selectedBidangs.length === 0 || (item.bidang ? selectedBidangs.includes(item.bidang) : false);
        
        const matchesSumber = selectedSumber.length === 0 || selectedSumber.some(selected => {
            const cleanSources = (item.sumber || '').split(/\s*&\s*|\s*\/\s*/).map((s: string) => s.trim().replace(/Dana\s+/gi, ''));
            return cleanSources.includes(selected);
        });
        
        const matchesMonth = selectedMonths.length === 0 || (item.bulan ? selectedMonths.includes(item.bulan) : false);
        const matchesTahun = selectedTahunAjaran.length === 0 || (item.tahun_ajaran ? selectedTahunAjaran.includes(item.tahun_ajaran) : false);
        
        return matchesSearch && matchesUnit && matchesBidang && matchesSumber && matchesMonth && matchesTahun;
    });

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2.5 rounded-xl text-white shadow-lg shadow-slate-100">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Riwayat Dokumen (LPJ)</h1>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
                    <div className="relative w-full lg:max-w-md group">
                        <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-bold transition-all" 
                            placeholder="Cari ID, kegiatan, unit, atau pengaju..."
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full lg:w-auto">
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center justify-center gap-2 border text-[10px] font-black px-4 py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-widest ${isFilterOpen || selectedUnits.length > 0 || selectedBidangs.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 || selectedTahunAjaran.length > 0 ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                            >
                                <Filter className="w-3.5 h-3.5" /> Filter
                                {(selectedUnits.length + selectedBidangs.length + selectedSumber.length + selectedMonths.length + selectedTahunAjaran.length) > 0 && (
                                    <span className="bg-emerald-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] ml-1">
                                        {selectedUnits.length + selectedBidangs.length + selectedSumber.length + selectedMonths.length + selectedTahunAjaran.length}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Filter Arsip</h4>
                                            {(selectedUnits.length > 0 || selectedBidangs.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 || selectedTahunAjaran.length > 0) && (
                                                <button 
                                                    onClick={() => { 
                                                        setSelectedUnits([]); 
                                                        setSelectedBidangs([]); 
                                                        setSelectedSumber([]); 
                                                        setSelectedMonths([]); 
                                                        setSelectedTahunAjaran([]); 
                                                    }}
                                                    className="text-[10px] text-rose-500 font-black hover:underline uppercase"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {/* Unit Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" /> Berdasarkan Unit
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableUnits.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableUnits.map(unit => (
                                                            <button 
                                                                key={unit}
                                                                onClick={() => {
                                                                    if (selectedUnits.includes(unit)) setSelectedUnits(selectedUnits.filter(u => u !== unit));
                                                                    else setSelectedUnits([...selectedUnits, unit]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedUnits.includes(unit) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {unit}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bidang Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Tag className="w-3 h-3" /> Berdasarkan Bidang
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableBidangs.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableBidangs.map(bidang => (
                                                            <button 
                                                                key={bidang}
                                                                onClick={() => {
                                                                    if (selectedBidangs.includes(bidang)) setSelectedBidangs(selectedBidangs.filter(b => b !== bidang));
                                                                    else setSelectedBidangs([...selectedBidangs, bidang]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedBidangs.includes(bidang) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {bidang}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sumber Dana Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Wallet className="w-3 h-3" /> Sumber Dana
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableSumber.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableSumber.map(sumber => (
                                                            <button 
                                                                key={sumber}
                                                                onClick={() => {
                                                                    if (selectedSumber.includes(sumber)) setSelectedSumber(selectedSumber.filter(s => s !== sumber));
                                                                    else setSelectedSumber([...selectedSumber, sumber]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedSumber.includes(sumber) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {sumber}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Month Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Bulan
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableMonths.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableMonths.map(mo => (
                                                            <button 
                                                                key={mo}
                                                                onClick={() => {
                                                                    if (selectedMonths.includes(mo)) setSelectedMonths(selectedMonths.filter(m => m !== mo));
                                                                    else setSelectedMonths([...selectedMonths, mo]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedMonths.includes(mo) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {mo}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tahun Ajaran Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <GraduationCap className="w-3 h-3" /> Tahun Ajaran
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableTahunAjaran.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableTahunAjaran.map(ta => (
                                                            <button 
                                                                key={ta}
                                                                onClick={() => {
                                                                    if (selectedTahunAjaran.includes(ta)) setSelectedTahunAjaran(selectedTahunAjaran.filter(t => t !== ta));
                                                                    else setSelectedTahunAjaran([...selectedTahunAjaran, ta]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedTahunAjaran.includes(ta) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {ta}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setIsFilterOpen(false)}
                                            className="w-full bg-slate-900 text-white text-[10px] font-black py-3 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest"
                                        >
                                            Terapkan Filter
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleExportFilteredToExcel}
                            className="flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black px-4 py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-widest"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Ekspor Excel
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[750px] lg:min-w-0 table-fixed lg:table-auto">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap lg:w-[15%]">Periode / Tgl</th>
                                <th className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap lg:w-[15%]">Unit / Bidang</th>
                                <th className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest lg:w-[45%]">Program / Kegiatan</th>
                                <th className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap lg:w-[15%]">Sumber Dana</th>
                                <th className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap lg:w-[10%]">Nominal</th>
                                <th className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap lg:w-[5%]">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Memuat Riwayat Laporan...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRiwayat.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-12 text-center space-y-3">
                                        <div className="flex justify-center">
                                            <div className="bg-slate-50 p-4 rounded-full">
                                                <History className="w-12 h-12 text-slate-200" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada dokumen LPJ yang ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRiwayat.map((item) => (
                                    <tr key={item.itemId} className="hover:bg-slate-50/50 transition-colors group">
                                        {/* 1. Periode & Tanggal */}
                                        <td className="px-3 py-2.5 align-middle">
                                            <div className="text-xs font-bold text-slate-800 whitespace-nowrap uppercase">
                                                {item.tanggal}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap leading-none mt-0.5">
                                                {item.bulan || '-'} ({item.tahun_ajaran || '-'})
                                            </div>
                                        </td>
                                        
                                        {/* 2. Unit / Bidang */}
                                        <td className="px-3 py-2.5 align-middle">
                                            <p className="text-xs font-bold text-emerald-700 whitespace-nowrap leading-none mb-1">{item.unit}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap leading-none">{item.bidang || '-'}</p>
                                        </td>
 
                                        {/* 3. Program / Kegiatan */}
                                        <td className="px-3 py-2.5 align-middle">
                                            <p className="text-xs font-extrabold text-slate-800 leading-tight mb-0.5">{item.kegiatan || item.program}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">{item.id}</p>
                                        </td>
 
                                        {/* 4. Sumber Dana */}
                                        <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                                            <span className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded border border-slate-200 uppercase tracking-tighter truncate max-w-[150px]" title={item.sumber}>
                                                {(item.sumber || '').replace(/Dana\s+/gi, '')}
                                            </span>
                                        </td>
 
                                        {/* 5. Nominal */}
                                        <td className="px-3 py-2.5 align-middle text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs font-black text-slate-900 tracking-tighter">Rp {Number(item.nominal || 0).toLocaleString('id-ID')}</p>
                                                <span className="flex items-center gap-0.5 text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mt-0.5">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> SELESAI
                                                </span>
                                            </div>
                                        </td>
 
                                        {/* 6. Aksi */}
                                        <td className="px-3 py-2.5 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <button 
                                                    onClick={() => handleExportDocumentToExcel(item.id, item.itemId)}
                                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                                    title="Ekspor Excel (LPJ)"
                                                >
                                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleViewDetail(item)}
                                                    className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer" 
                                                    title="Lihat Detail & Perbandingan RKA"
                                                >
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex justify-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {loading ? "Memproses..." : `Menampilkan ${filteredRiwayat.length} Dokumen LPJ Terverifikasi`}
                    </p>
                </div>
            </div>

            {/* DETAIL MODAL - DUAL COMPARISON & AUDIT TRAIL */}
            {selectedItemForDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        
                        {/* Header */}
                        <div className="px-6 py-4 text-white flex justify-between items-start shrink-0 bg-blue-600">
                            <div className="flex gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-sm font-black italic leading-tight uppercase tracking-tight">
                                            {selectedItemForDetail.kegiatan}
                                        </h3>
                                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-200">
                                            SELESAI
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold opacity-90 uppercase tracking-tighter">
                                        {selectedItemForDetail.unit} / {selectedItemForDetail.bidang} • ID: {selectedItemForDetail.id}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setSelectedItemForDetail(null);
                                    setDetailLpjDoc(null);
                                    setDetailRkaDoc(null);
                                    setSelectedRevisionSnapshot(null);
                                }} 
                                className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 gap-3">
                                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Detail Realisasi...</p>
                            </div>
                        ) : (
                            <Fragment>
                                {/* Funding Accumulation Summary */}
                                <div className="bg-slate-100/50 border-b border-slate-200 px-6 py-2 flex flex-wrap gap-3 items-center shrink-0">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Akumulasi Dana:</span>
                                    {(() => {
                                        const summary: Record<string, number> = {};
                                        const subsidiSummary: Record<string, number> = {};
                                        
                                        // LPJ: Alokasi dari RKA Rujukan
                                        if (detailRkaDoc) {
                                            const lpjItem = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                                ? selectedRevisionSnapshot.items?.[0]
                                                : detailLpjDoc?.item_pengajuan?.find((it: any) => it.id === selectedItemForDetail.itemId) || detailLpjDoc?.item_pengajuan?.[0];
                                            const lpjActivityName = (lpjItem?.judul_kegiatan || selectedItemForDetail.kegiatan || '').trim().toLowerCase();
                                            const matchingRkaItems = detailRkaDoc.item_pengajuan?.filter((it: any) => {
                                                const rkaActivityName = (it.judul_kegiatan || it.kegiatan || it.item || '').trim().toLowerCase();
                                                return rkaActivityName === lpjActivityName;
                                            }) || [];
                                            const rkaItems = matchingRkaItems.length > 0 ? matchingRkaItems : (detailRkaDoc.item_pengajuan || []);

                                            rkaItems.forEach((it: any) => {
                                                let rkaDetails: any = {};
                                                try { rkaDetails = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                
                                                const splits = rkaDetails.fundingSplits || [];
                                                if (Array.isArray(splits)) {
                                                    splits.forEach((s: any) => {
                                                        const source = s.source || s.sumber || 'Lainnya';
                                                        const amount = Number(s.nominal || s.amount || 0);
                                                        if (amount > 0) summary[source] = (summary[source] || 0) + amount;
                                                    });
                                                }
                                            });
                                        }

                                        // LPJ: Subsidi Silang
                                        const lpjItem = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                            ? selectedRevisionSnapshot.items?.[0]
                                            : detailLpjDoc?.item_pengajuan?.find((it: any) => it.id === selectedItemForDetail.itemId) || detailLpjDoc?.item_pengajuan?.[0];
                                        let lpjDetails: any = {};
                                        try { lpjDetails = typeof lpjItem?.rincian_json === 'string' ? JSON.parse(lpjItem.rincian_json) : (lpjItem?.rincian_json || {}); } catch(e) {}
                                        
                                        const subsidi = lpjDetails.subsidiSources || [];
                                        if (Array.isArray(subsidi)) {
                                            subsidi.forEach((s: any) => {
                                                const source = s.source || s.sumber || 'Lainnya';
                                                const amount = Number(s.nominal || s.amount || 0);
                                                if (amount > 0) subsidiSummary[source] = (subsidiSummary[source] || 0) + amount;
                                            });
                                        }

                                        return (
                                            <Fragment>
                                                {Object.entries(summary).map(([source, amount], idx) => (
                                                    <div key={`main-${idx}`} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">{source}:</span>
                                                        <span className="text-[9px] font-black text-slate-950 italic font-bold">Rp {amount.toLocaleString('id-ID')}</span>
                                                    </div>
                                                ))}
                                                {Object.entries(subsidiSummary).map(([source, amount], idx) => (
                                                    <div key={`subsidi-${idx}`} className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shadow-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-tighter">{source} (Subsidi):</span>
                                                        <span className="text-[9px] font-black text-emerald-950 italic font-bold">Rp {amount.toLocaleString('id-ID')}</span>
                                                    </div>
                                                ))}
                                            </Fragment>
                                        );
                                    })()}
                                </div>

                                {/* Banner for revision snapshot view */}
                                {selectedRevisionSnapshot && (
                                    <div className="bg-amber-500 text-white px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md border-b border-amber-600 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1 bg-white/20 rounded-lg">
                                                <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-wider leading-tight">
                                                    ⚠️ MENAMPILKAN ARSIP SEBELUM REVISI ({selectedRevisionSnapshot.type === 'LPJ' ? 'Laporan LPJ' : 'Perencanaan RKA'})
                                                </p>
                                                <p className="text-[9px] font-bold opacity-90 leading-normal">
                                                    Tanggal Revisi: {new Date(selectedRevisionSnapshot.tanggal_revisi).toLocaleString('id-ID')} • Catatan: "{selectedRevisionSnapshot.catatan_revisi}"
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedRevisionSnapshot(null)}
                                            className="px-3 py-1 bg-white text-amber-600 hover:bg-slate-50 active:scale-95 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                        >
                                            Kembali ke Versi Sekarang
                                        </button>
                                    </div>
                                )}

                                {/* Scrollable Body */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-50/30">
                                    {/* Status & Summary Bar */}
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                                        <div className="flex flex-col gap-2 w-full md:w-auto">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status LPJ:</span>
                                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    SELESAI & DIARSIPKAN
                                                </span>
                                            </div>

                                            {/* AI Audit Status & Button */}
                                            {(() => {
                                                const lpjItem = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                                    ? selectedRevisionSnapshot.items?.[0]
                                                    : detailLpjDoc?.item_pengajuan?.find((it: any) => it.id === selectedItemForDetail.itemId) || detailLpjDoc?.item_pengajuan?.[0];
                                                
                                                const aiStatus = auditResult?.status || lpjItem?.status_audit_ai || 'PENDING';
                                                
                                                return (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {userRole === 'PIMPINAN' && (
                                                            <button
                                                                onClick={handleAuditAI}
                                                                disabled={isAuditing}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isAuditing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:opacity-90 active:scale-95 cursor-pointer'}`}
                                                            >
                                                                {isAuditing ? (
                                                                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <Bot className="w-3.5 h-3.5 text-blue-100" />
                                                                )}
                                                                {isAuditing ? 'Menganalisis...' : 'Audit Smart AI'}
                                                            </button>
                                                        )}
                                                        
                                                        {aiStatus !== 'PENDING' && (
                                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                                                aiStatus === 'AMAN' 
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                                                    : aiStatus === 'GAGAL'
                                                                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                                                                        : 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                                                            }`}>
                                                                {aiStatus === 'AMAN' ? '✅ Lolos Audit AI' : (aiStatus === 'GAGAL' ? '⛔ Audit Gagal' : '⚠️ Anomali Ditemukan')}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        
                                        {detailRkaDoc && (() => {
                                            const lpjItem = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                                ? selectedRevisionSnapshot.items?.[0]
                                                : detailLpjDoc?.item_pengajuan?.find((it: any) => it.id === selectedItemForDetail.itemId) || detailLpjDoc?.item_pengajuan?.[0];
                                            const lpjActivityName = (lpjItem?.judul_kegiatan || selectedItemForDetail.kegiatan || '').trim().toLowerCase();
                                            const matchingRkaItems = detailRkaDoc.item_pengajuan?.filter((it: any) => {
                                                const rkaActivityName = (it.judul_kegiatan || it.kegiatan || it.item || '').trim().toLowerCase();
                                                return rkaActivityName === lpjActivityName;
                                            }) || [];
                                            const rkaItemsToRender = matchingRkaItems.length > 0 ? matchingRkaItems : (detailRkaDoc.item_pengajuan || []);

                                            const totalRka = rkaItemsToRender.reduce((sum: number, it: any) => sum + (it.nominal || 0), 0) || 0;
                                            const totalLpj = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                                ? selectedRevisionSnapshot.total_nominal || selectedRevisionSnapshot.items?.reduce((sum: number, it: any) => sum + (it.nominal || 0), 0) || 0
                                                : selectedItemForDetail.nominal || 0;
                                            const selisih = totalRka - totalLpj;
                                            const isOverBudget = selisih < 0;

                                            let lpjDetails: any = {};
                                            try { lpjDetails = typeof lpjItem?.rincian_json === 'string' ? JSON.parse(lpjItem.rincian_json) : (lpjItem?.rincian_json || {}); } catch(e) {}
                                            const subsidi = lpjDetails.subsidiSources || [];
                                            const isOverBudgetSolved = isOverBudget && subsidi.length > 0;
                                            
                                            return (
                                                <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-inner">
                                                    <div className="text-[9px] font-bold text-slate-500">
                                                        Total RKA: <span className="font-black text-slate-800">Rp {totalRka.toLocaleString('id-ID')}</span>
                                                    </div>
                                                    <div className="w-[1px] h-3 bg-slate-200"></div>
                                                    <div className="text-[9px] font-bold text-slate-500">
                                                        Total Realisasi: <span className="font-black text-slate-800">Rp {totalLpj.toLocaleString('id-ID')}</span>
                                                    </div>
                                                    <div className="w-[1px] h-3 bg-slate-200"></div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`text-[9px] font-black uppercase tracking-tight flex items-center gap-1 ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {isOverBudget ? '⚠️ Over-Budget:' : '✅ Sisa Anggaran:'}
                                                            <span className="italic font-extrabold">Rp {Math.abs(selisih).toLocaleString('id-ID')}</span>
                                                        </div>
                                                        {isOverBudgetSolved && (
                                                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                Subsidi Silang Aktif
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                    Total Realisasi:
                                                </span>
                                                <span className="text-sm font-black text-slate-800 italic">
                                                    Rp {(() => {
                                                        const totalVal = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                                            ? selectedRevisionSnapshot.total_nominal || selectedRevisionSnapshot.items?.reduce((sum: number, it: any) => sum + (it.nominal || 0), 0) || 0
                                                            : selectedItemForDetail.nominal || 0;
                                                        return totalVal.toLocaleString('id-ID');
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dual Pane Tables */}
                                    <div className="space-y-6">
                                        {/* SECTION 1: RKA (Target/Rencana) */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-4 bg-amber-500 rounded-full shadow-md"></div>
                                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">1. Rencana Kegiatan & Anggaran (RKA) - Target/Rencana</h4>
                                                </div>
                                                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    Rujukan Utama
                                                </span>
                                            </div>
                                            
                                            {!detailRkaDoc && !(selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'RKA') ? (
                                                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    ⚠️ Referensi RKA tidak terhubung / tidak ditemukan
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                    <table className="w-full text-left text-[9px] border-collapse">
                                                        <thead className="bg-amber-50/50 border-b border-amber-100">
                                                            <tr>
                                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">No</th>
                                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Program/Kegiatan</th>
                                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Operasional</th>
                                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest text-center">Jml Kegiatan</th>
                                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Waktu/Tempat</th>
                                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Penanggung Jawab / Sasaran</th>
                                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest text-right">Nominal</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {(() => {
                                                                let rkaItemsToRender = [];
                                                                if (selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'RKA') {
                                                                    rkaItemsToRender = selectedRevisionSnapshot.items || [];
                                                                } else if (detailRkaDoc) {
                                                                    const lpjItem = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                                                        ? selectedRevisionSnapshot.items?.[0]
                                                                        : detailLpjDoc?.item_pengajuan?.find((it: any) => it.id === selectedItemForDetail.itemId) || detailLpjDoc?.item_pengajuan?.[0];
                                                                    const lpjActivityName = (lpjItem?.judul_kegiatan || selectedItemForDetail.kegiatan || '').trim().toLowerCase();
                                                                    const matchingRkaItems = detailRkaDoc.item_pengajuan?.filter((it: any) => {
                                                                        const rkaActivityName = (it.judul_kegiatan || it.kegiatan || it.item || '').trim().toLowerCase();
                                                                        return rkaActivityName === lpjActivityName;
                                                                    }) || [];
                                                                    rkaItemsToRender = matchingRkaItems.length > 0 ? matchingRkaItems : (detailRkaDoc.item_pengajuan || []);
                                                                }
                                                                
                                                                return rkaItemsToRender.map((it: any, idx: number) => {
                                                                    let rkaDetails: any = {};
                                                                    try { rkaDetails = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                    const rkaItems = rkaDetails.items || [];
                                                                    
                                                                    return (
                                                                        <Fragment key={idx}>
                                                                            <tr className="bg-white">
                                                                                <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                                                                                <td className="px-3 py-2 font-black text-slate-900 italic">{it.judul_kegiatan || it.kegiatan || it.item}</td>
                                                                                <td className="px-3 py-2"><span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-black uppercase text-[8px]">{it.kategori_coa || it.operasional}</span></td>
                                                                                <td className="px-3 py-2 text-center font-black text-slate-800">{it.jumlah_kegiatan || 1}x</td>
                                                                                <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.waktu || '-'} / {it.tempat || '-'}</td>
                                                                                <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.pic || '-'} / {it.sasaran || '-'}</td>
                                                                                <td className="px-3 py-2 text-right font-black text-slate-950 text-xs">Rp {(it.nominal || 0).toLocaleString('id-ID')}</td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td colSpan={7} className="px-8 pb-4 bg-amber-50/10">
                                                                                    <div className="bg-white rounded-xl border border-amber-100 p-3 space-y-3 shadow-sm">
                                                                                        <div className="flex items-center gap-2 mb-1 px-1">
                                                                                            <div className="w-1 h-3 bg-amber-500 rounded-full"></div>
                                                                                            <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Rincian Anggaran RKA</p>
                                                                                        </div>
                                                                                        <table className="w-full text-[9px]">
                                                                                            <thead>
                                                                                                <tr className="text-slate-600 font-black uppercase tracking-tighter border-b border-slate-100">
                                                                                                    <th className="py-1.5 text-left">Nama Item / Spesifikasi</th>
                                                                                                    <th className="py-1.5 text-center">Satuan</th>
                                                                                                    <th className="py-1.5 text-right">Harga Satuan</th>
                                                                                                    <th className="py-1.5 text-center">Qty</th>
                                                                                                    <th className="py-1.5 text-right">Total (Rp)</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody className="divide-y divide-slate-100 text-slate-800">
                                                                                                {rkaItems.map((sub: any, sIdx: number) => (
                                                                                                    <tr key={sIdx}>
                                                                                                        <td className="py-1.5 font-bold italic">{sub.name}</td>
                                                                                                        <td className="py-1.5 text-center font-bold">{sub.unit}</td>
                                                                                                        <td className="py-1.5 text-right font-black">Rp {Number(sub.price || 0).toLocaleString('id-ID')}</td>
                                                                                                        <td className="py-1.5 text-center font-black">{sub.qty}</td>
                                                                                                        <td className="py-1.5 text-right font-black text-slate-950">Rp {Number(sub.total || 0).toLocaleString('id-ID')}</td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </Fragment>
                                                                    );
                                                                });
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        {/* SECTION 2: LPJ (Realisasi Aktual) */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-md"></div>
                                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">2. Laporan Realisasi Anggaran (LPJ) - Aktual/Realisasi</h4>
                                            </div>
                                            
                                            {(() => {
                                                const lpjItem = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                                    ? selectedRevisionSnapshot.items?.[0]
                                                    : detailLpjDoc?.item_pengajuan?.find((it: any) => it.id === selectedItemForDetail.itemId) || detailLpjDoc?.item_pengajuan?.[0];
                                                let lpjDetails: any = {};
                                                try { lpjDetails = typeof lpjItem?.rincian_json === 'string' ? JSON.parse(lpjItem.rincian_json) : (lpjItem?.rincian_json || {}); } catch(e) {}
                                                const lpjItems = lpjDetails.items || [];
                                                
                                                return (
                                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                        <table className="w-full text-left text-[9px] border-collapse">
                                                            <thead className="bg-blue-50/50 border-b border-blue-100">
                                                                <tr>
                                                                    <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">No</th>
                                                                    <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">Program/Kegiatan</th>
                                                                    <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">Operasional</th>
                                                                    <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest text-center">Jml Realisasi</th>
                                                                    <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">Waktu/Tempat</th>
                                                                    <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">Penanggung Jawab / Sasaran</th>
                                                                    <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest text-right">Total Realisasi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                <tr className="bg-white">
                                                                    <td className="px-3 py-2 text-slate-500 font-bold">1</td>
                                                                    <td className="px-3 py-2 font-black text-slate-900 italic">{lpjItem?.judul_kegiatan || 'Realisasi Anggaran'}</td>
                                                                    <td className="px-3 py-2"><span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md font-black uppercase text-[8px]">{lpjItem?.kategori_coa || 'Lainnya'}</span></td>
                                                                    <td className="px-3 py-2 text-center font-black text-slate-800">{lpjDetails?.jumlah_kegiatan || '1x'}</td>
                                                                    <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{lpjItem?.waktu || '-'} / {lpjItem?.tempat || '-'}</td>
                                                                    <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{lpjItem?.pic || '-'} / {lpjItem?.sasaran || '-'}</td>
                                                                    <td className="px-3 py-2 text-right font-black text-slate-950 text-xs">Rp {Number(lpjItem?.nominal || 0).toLocaleString('id-ID')}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td colSpan={7} className="px-8 pb-4 bg-blue-50/10">
                                                                        <div className="bg-white rounded-xl border border-blue-100 p-3 space-y-3 shadow-sm">
                                                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                                                <div className="w-1.5 h-3 bg-blue-600 rounded-full"></div>
                                                                                <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Rincian Realisasi Pengeluaran</p>
                                                                            </div>
                                                                            <table className="w-full text-[9px]">
                                                                                <thead>
                                                                                    <tr className="text-slate-600 font-black uppercase tracking-tighter border-b border-slate-100">
                                                                                        <th className="py-1.5 text-left">Nama Item / Spesifikasi</th>
                                                                                        <th className="py-1.5 text-center">Satuan</th>
                                                                                        <th className="py-1.5 text-right">Harga Satuan LPJ</th>
                                                                                        <th className="py-1.5 text-center">Qty Realisasi</th>
                                                                                        <th className="py-1.5 text-right">Total Realisasi (Rp)</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100 text-slate-800">
                                                                                    {lpjItems.map((sub: any, sIdx: number) => (
                                                                                        <tr key={sIdx}>
                                                                                            <td className="py-1.5 font-bold italic">{sub.name}</td>
                                                                                            <td className="py-1.5 text-center font-bold">{sub.unit}</td>
                                                                                            <td className="py-1.5 text-right font-black">Rp {Number(sub.price || 0).toLocaleString('id-ID')}</td>
                                                                                            <td className="py-1.5 text-center font-black">{sub.qty}</td>
                                                                                            <td className="py-1.5 text-right font-black text-slate-950">Rp {Number(sub.total || 0).toLocaleString('id-ID')}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* SECTION 3: Catatan & Narasi */}
                                    {(() => {
                                        const lpjItem = selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'LPJ'
                                            ? selectedRevisionSnapshot.items?.[0]
                                            : detailLpjDoc?.item_pengajuan?.find((it: any) => it.id === selectedItemForDetail.itemId) || detailLpjDoc?.item_pengajuan?.[0];
                                        let lpjDetails: any = {};
                                        try { lpjDetails = typeof lpjItem?.rincian_json === 'string' ? JSON.parse(lpjItem.rincian_json) : (lpjItem?.rincian_json || {}); } catch(e) {}
                                        
                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Left: Notes & AI Audit */}
                                                <div className="space-y-4">
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catatan & Penjelasan LPJ:</p>
                                                        <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold">
                                                            {lpjDetails.narasi || 'Tidak ada catatan khusus yang disertakan.'}
                                                        </p>
                                                    </div>

                                                    {(() => {
                                                        const aiNotes = auditResult || (() => {
                                                            if (!lpjItem?.catatan_ai) return null;
                                                            try {
                                                                const parsed = typeof lpjItem.catatan_ai === 'string' ? JSON.parse(lpjItem.catatan_ai) : lpjItem.catatan_ai;
                                                                return { ...parsed, status: lpjItem.status_audit_ai };
                                                            } catch(e) { return null; }
                                                        })();
                                                        
                                                        if (!aiNotes) return null;

                                                        const isAman = aiNotes.status === 'AMAN';
                                                        const isGagal = aiNotes.status === 'GAGAL';
                                                        return (
                                                            <div className={`bg-white p-4 rounded-2xl border space-y-3 shadow-sm ${isAman ? 'border-emerald-200' : (isGagal ? 'border-rose-200' : 'border-amber-200')}`}>
                                                                <div className="flex items-center gap-2">
                                                                    <Bot className={`w-4 h-4 ${isAman ? 'text-emerald-600' : (isGagal ? 'text-rose-600' : 'text-amber-600')}`} />
                                                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isAman ? 'text-emerald-600' : (isGagal ? 'text-rose-600' : 'text-amber-600')}`}>
                                                                        Hasil Analisis Smart AI: {isAman ? 'AMAN' : (isGagal ? 'GAGAL' : 'ANOMALI')}
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                                                    {aiNotes.alasan && (
                                                                        <div className={`text-[10px] font-bold p-2.5 rounded-lg border leading-relaxed ${isAman ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : (isGagal ? 'bg-rose-50 text-rose-800 border-rose-100' : 'bg-amber-50 text-amber-800 border-amber-100')}`}>
                                                                            • {aiNotes.alasan}
                                                                        </div>
                                                                    )}
                                                                    {aiNotes.rekomendasi && (
                                                                        <div className="text-[10px] font-bold p-2.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 mt-2 leading-relaxed">
                                                                            💡 Saran Tindakan: {aiNotes.rekomendasi}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Right: Bukti Lampiran Nota / Kuitansi */}
                                                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lampiran Bukti Kuitansi ({lpjDetails.attachments?.length || 0}):</p>
                                                    
                                                    {!lpjDetails.attachments || lpjDetails.attachments.length === 0 ? (
                                                        <p className="text-xs text-slate-400 font-bold italic py-4 text-center">Tidak ada berkas bukti kuitansi yang dilampirkan.</p>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {lpjDetails.attachments.map((att: any, attIdx: number) => (
                                                                <a 
                                                                    key={attIdx} 
                                                                    href={att.base64 || att.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="group relative flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl p-2 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden text-center cursor-pointer"
                                                                    title="Buka / Unduh Lampiran"
                                                                >
                                                                    {/* Image Preview or Icon */}
                                                                    {(att.base64 || att.url) && (att.base64?.startsWith('data:image/') || att.url?.match(/\.(jpeg|jpg|gif|png)/i) || !att.url?.includes('.')) ? (
                                                                        <img 
                                                                            src={att.base64 || att.url} 
                                                                            alt={att.customName || 'Lampiran'} 
                                                                            className="w-full h-20 object-cover rounded-lg mb-1 group-hover:scale-105 transition-transform" 
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-20 bg-slate-100 flex items-center justify-center rounded-lg mb-1 text-slate-400">
                                                                            <Paperclip className="w-6 h-6" />
                                                                        </div>
                                                                    )}
                                                                    <span className="text-[9px] font-black text-slate-600 truncate w-full px-1">{att.customName || 'Lampiran Bukti'}</span>
                                                                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <span className="bg-white/90 text-slate-800 text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">UNDUH BUKTI</span>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* NEW SECTION: RIWAYAT REVISI SNAPSHOT LOG */}
                                    {(() => {
                                        const lpjHistory = detailLpjDoc?.riwayat_revisi || [];
                                        const rkaHistory = detailRkaDoc?.riwayat_revisi || [];
                                        const hasHistory = lpjHistory.length > 0 || rkaHistory.length > 0;
                                        
                                        if (!hasHistory) return null;
                                        
                                        return (
                                            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <History className="w-4 h-4 text-amber-600 animate-pulse" />
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        Riwayat Log Penolakan & Berkas Sebelum Revisi ({lpjHistory.length + rkaHistory.length}):
                                                    </p>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* LPJ Revisions */}
                                                    {lpjHistory.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Revisi Realisasi (LPJ)</p>
                                                            <div className="divide-y divide-slate-100 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {lpjHistory.map((rev: any, rIdx: number) => (
                                                                    <div key={rIdx} className="py-2.5 flex flex-col gap-1 text-[10px] font-bold">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-500 font-semibold">{new Date(rev.tanggal_revisi).toLocaleString('id-ID')}</span>
                                                                            <button 
                                                                                onClick={() => setSelectedRevisionSnapshot({ ...rev, type: 'LPJ' })}
                                                                                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-600 rounded text-[8px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                                                                            >
                                                                                Lihat File & Tabel Lama
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-slate-800 italic leading-snug">"{rev.catatan_revisi || 'Tanpa catatan'}"</p>
                                                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Total Nominal: Rp {Number(rev.total_nominal || 0).toLocaleString('id-ID')}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* RKA Revisions */}
                                                    {rkaHistory.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Revisi Perencanaan (RKA)</p>
                                                            <div className="divide-y divide-slate-100 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {rkaHistory.map((rev: any, rIdx: number) => (
                                                                    <div key={rIdx} className="py-2.5 flex flex-col gap-1 text-[10px] font-bold">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-500 font-semibold">{new Date(rev.tanggal_revisi).toLocaleString('id-ID')}</span>
                                                                            <button 
                                                                                onClick={() => setSelectedRevisionSnapshot({ ...rev, type: 'RKA' })}
                                                                                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-600 rounded text-[8px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                                                                            >
                                                                                Lihat RKA Lama
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-slate-800 italic leading-snug">"{rev.catatan_revisi || 'Tanpa catatan'}"</p>
                                                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Total RKA: Rp {Number(rev.total_nominal || 0).toLocaleString('id-ID')}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* SECTION 4: Jejak Audit (Workflow History) */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Jejak Audit & Otorisasi Alur Dokumen:</p>
                                        </div>
                                        
                                        <div className="relative pl-6 space-y-5 font-bold">
                                            <div className="absolute left-[9px] top-1.5 bottom-1.5 w-[1px] bg-slate-200 font-bold"></div>
                                            
                                            {(() => {
                                                const formatFullDate = (dateStr: string) => {
                                                    if (!dateStr) return '';
                                                    return new Date(dateStr).toLocaleString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    }) + ' WIB';
                                                };

                                                const lpjHistory = detailLpjDoc?.riwayat_revisi || [];
                                                const finalUpdateDate = detailLpjDoc?.updated_at || detailLpjDoc?.created_at;
                                                const lpjCreateDate = detailLpjDoc?.created_at;

                                                const events: any[] = [];
                                                let lastTimestamp = 0;

                                                const addEvent = (rawDate: string | Date, title: string, color: string, isMain: boolean, isPulse: boolean = false, isFinal: boolean = false, desc: string = '') => {
                                                    let d = new Date(rawDate).getTime();
                                                    if (d <= lastTimestamp) {
                                                        d = lastTimestamp + 1000;
                                                    }
                                                    lastTimestamp = d;
                                                    events.push({
                                                        date: new Date(d),
                                                        title, color, isMain, isPulse, isFinal, desc,
                                                        dateStr: formatFullDate(new Date(d).toISOString())
                                                    });
                                                };

                                                const rkaDoc = detailRkaDoc?.parentDoc || detailRkaDoc;
                                                const isRevisiRka = detailRkaDoc?.jenis === 'REVISI_RKA';
                                                const activeRkaDoc = isRevisiRka ? detailRkaDoc : rkaDoc;
                                                
                                                const hasCctvRka = Array.isArray(rkaDoc?.audit_log) && rkaDoc.audit_log.length > 0;
                                                const hasCctvRevisiRka = isRevisiRka && Array.isArray(activeRkaDoc?.audit_log) && activeRkaDoc.audit_log.length > 0;
                                                const hasCctvLpj = Array.isArray(detailLpjDoc?.audit_log) && detailLpjDoc.audit_log.length > 0;
                                                const isRevisiLpj = detailLpjDoc?.jenis === 'REVISI_LPJ';

                                                if (hasCctvRka || hasCctvLpj) {
                                                    // CCTV Mode
                                                    let activeLpjLogs = (hasCctvLpj) ? [...detailLpjDoc.audit_log] : [];

                                                    // Jika dokumen ini adalah Revisi LPJ tetapi tidak memiliki log awal SUBMIT_LPJ_REVISI (karena disubmit sebelum CCTV diimplementasi),
                                                    // kita buat log sintetis agar alurnya masuk akal di UI.
                                                    if (isRevisiLpj && activeLpjLogs.length > 0) {
                                                        const hasSubmitLog = activeLpjLogs.some((l: any) => l.action === 'SUBMIT_LPJ_REVISI' || l.action === 'SUBMIT_LPJ' || l.action === 'SUBMIT');
                                                        if (!hasSubmitLog && detailLpjDoc.created_at) {
                                                            activeLpjLogs.unshift({
                                                                action: 'SUBMIT_LPJ_REVISI',
                                                                actor_name: 'Pembuat Pengajuan (Sistem Lama)',
                                                                actor_role: 'STAF',
                                                                timestamp: detailLpjDoc.created_at,
                                                                notes: 'Pengajuan Revisi LPJ dikirim.'
                                                            });
                                                        }
                                                    }

                                                    const allLogs = [
                                                        ...(hasCctvRka ? rkaDoc.audit_log : []),
                                                        ...(hasCctvRevisiRka ? activeRkaDoc.audit_log : []),
                                                        ...activeLpjLogs
                                                    ];

                                                    allLogs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                                                    allLogs.forEach((log: any) => {
                                                        let color = 'emerald';
                                                        let isPulse = false;
                                                        let isFinal = false;
                                                        let title = log.action;

                                                        if (log.action === 'SUBMIT') title = 'PENGAJUAN RKA';
                                                        else if (log.action === 'SUBMIT_LPJ') title = 'PENGAJUAN LAPORAN LPJ';
                                                        else if (log.action === 'SUBMIT_REVISI') title = 'PENGAJUAN REVISI RKA';
                                                        else if (log.action === 'SUBMIT_LPJ_REVISI') title = 'PENGAJUAN LAPORAN LPJ REVISI';
                                                        else if (log.action === 'APPROVE') title = `DOKUMEN DISETUJUI OLEH ${log.actor_role.replace('_', ' ')}`;
                                                        else if (log.action === 'REVISI') {
                                                            title = `DOKUMEN DIREVISI OLEH ${log.actor_role.replace('_', ' ')}`;
                                                            color = 'rose';
                                                            isPulse = true;
                                                        } else if (log.action === 'CAIR') title = 'PENCAIRAN DANA OLEH BENDAHARA PUSAT';
                                                        else if (log.action === 'DITERIMA') title = 'DANA TELAH DITERIMA OLEH BENDAHARA UNIT';

                                                        if (log.status_baru === 'SELESAI') {
                                                            isFinal = true;
                                                            title = 'SELESAI & DIARSIPKAN';
                                                        }

                                                        let desc = '';
                                                        if (log.notes) desc = log.notes;
                                                        if (log.actor_name) {
                                                            desc += ` (Aktor: ${log.actor_name})`;
                                                        }

                                                        addEvent(log.timestamp, title, color, true, isPulse, isFinal, desc);
                                                    });
                                                } else {
                                                    // Legacy Mode
                                                    const injectApprovalsBeforeRevisi = (rev: any, typePrefix: string) => {
                                                        const revTime = new Date(rev.tanggal_revisi).getTime();
                                                        const status = rev.status_sebelumnya || '';
                                                        const note = `Note: ${rev.catatan_revisi || '-'}`;

                                                        if (status === 'MENUNGGU_KEPALA') {
                                                            addEvent(new Date(revTime - 3000), `${typePrefix} DISETUJUI OLEH BENDAHARA UNIT`, "emerald", true);
                                                            addEvent(rev.tanggal_revisi, `${typePrefix} DIREVISI OLEH KEPALA UNIT`, "rose", true, true, false, note);
                                                        } else if (status === 'MENUNGGU_PUSAT' || status === 'MENUNGGU_VERIFIKASI_PUSAT') {
                                                            addEvent(new Date(revTime - 4000), `${typePrefix} DISETUJUI OLEH BENDAHARA UNIT`, "emerald", true);
                                                            addEvent(new Date(revTime - 3000), `${typePrefix} DISETUJUI OLEH KEPALA UNIT`, "emerald", true);
                                                            addEvent(rev.tanggal_revisi, `${typePrefix} DIREVISI OLEH BENDAHARA PUSAT`, "rose", true, true, false, note);
                                                        } else {
                                                            addEvent(rev.tanggal_revisi, `${typePrefix} DIREVISI OLEH BENDAHARA UNIT`, "rose", true, true, false, note);
                                                        }
                                                    };

                                                    // 1. RKA (If exists)
                                                    if (detailRkaDoc) {
                                                        const isRevisiRka = detailRkaDoc.jenis === 'REVISI_RKA';
                                                        const parentRka = detailRkaDoc.parentDoc || (isRevisiRka ? null : detailRkaDoc);

                                                        if (parentRka) {
                                                            addEvent(parentRka.created_at, `PENGAJUAN RKA`, "emerald", true);

                                                            const pHistory = [...(parentRka.riwayat_revisi || [])].sort((a: any, b: any) => new Date(a.tanggal_revisi).getTime() - new Date(b.tanggal_revisi).getTime());
                                                            pHistory.forEach((rev: any) => {
                                                                injectApprovalsBeforeRevisi(rev, "PENGAJUAN RKA");
                                                                addEvent(new Date(new Date(rev.tanggal_revisi).getTime() + 60000), "PENGAJUAN RKA", "emerald", true);
                                                            });

                                                            let pApproveDate = new Date(parentRka.updated_at);
                                                            if (pApproveDate.getTime() <= lastTimestamp) pApproveDate = new Date(lastTimestamp + 10000);
                                                            
                                                            addEvent(new Date(pApproveDate.getTime() - 4000), `PENGAJUAN RKA DISETUJUI OLEH BENDAHARA UNIT`, "emerald", true);
                                                            addEvent(new Date(pApproveDate.getTime() - 3000), `PENGAJUAN RKA DISETUJUI OLEH KEPALA UNIT`, "emerald", true);
                                                            addEvent(new Date(pApproveDate.getTime() - 2000), `PENGAJUAN RKA DISETUJUI OLEH BENDAHARA PUSAT`, "emerald", true);
                                                            addEvent(new Date(pApproveDate.getTime() - 1000), `PENCAIRAN DANA OLEH BENDAHARA PUSAT`, "emerald", true);
                                                            addEvent(pApproveDate, `DANA TELAH DITERIMA OLEH BENDAHARA UNIT`, "emerald", true);
                                                        }

                                                        if (isRevisiRka) {
                                                            addEvent(detailRkaDoc.created_at, `PENGAJUAN REVISI RKA`, "emerald", true);

                                                            const rHistory = [...(detailRkaDoc.riwayat_revisi || [])].sort((a: any, b: any) => new Date(a.tanggal_revisi).getTime() - new Date(b.tanggal_revisi).getTime());
                                                            rHistory.forEach((rev: any) => {
                                                                injectApprovalsBeforeRevisi(rev, "PENGAJUAN REVISI RKA");
                                                                addEvent(new Date(new Date(rev.tanggal_revisi).getTime() + 60000), "PENGAJUAN REVISI RKA", "emerald", true);
                                                            });

                                                            let rkaApproveDate = new Date(detailRkaDoc.updated_at);
                                                            if (rkaApproveDate.getTime() <= lastTimestamp) rkaApproveDate = new Date(lastTimestamp + 10000);
                                                            
                                                            addEvent(new Date(rkaApproveDate.getTime() - 2000), `PENGAJUAN REVISI RKA DISETUJUI OLEH BENDAHARA UNIT`, "emerald", true);
                                                            addEvent(new Date(rkaApproveDate.getTime() - 1000), `PENGAJUAN REVISI RKA DISETUJUI OLEH KEPALA UNIT`, "emerald", true);
                                                            addEvent(rkaApproveDate, `PENGAJUAN REVISI RKA DISETUJUI OLEH BENDAHARA PUSAT`, "emerald", true);
                                                        }
                                                    }

                                                    // 2. LPJ
                                                    if (lpjCreateDate) {
                                                        addEvent(lpjCreateDate, `PENGAJUAN LAPORAN LPJ`, "emerald", true);
                                                    }

                                                    const sortedLpjHistory = [...lpjHistory].sort((a: any, b: any) => new Date(a.tanggal_revisi).getTime() - new Date(b.tanggal_revisi).getTime());
                                                    sortedLpjHistory.forEach((rev: any) => {
                                                        injectApprovalsBeforeRevisi(rev, "PENGAJUAN LAPORAN LPJ");
                                                        addEvent(new Date(new Date(rev.tanggal_revisi).getTime() + 60000), "PENGAJUAN LAPORAN LPJ", "emerald", true);
                                                    });

                                                    if (finalUpdateDate) {
                                                        let finalDate = new Date(finalUpdateDate);
                                                        if (finalDate.getTime() <= lastTimestamp) finalDate = new Date(lastTimestamp + 10000);
                                                        
                                                        addEvent(new Date(finalDate.getTime() - 3000), `PENGAJUAN LAPORAN LPJ DISETUJUI OLEH BENDAHARA UNIT`, "emerald", true);
                                                        addEvent(new Date(finalDate.getTime() - 2000), `PENGAJUAN LAPORAN LPJ DISETUJUI OLEH KEPALA UNIT`, "emerald", true);
                                                        addEvent(new Date(finalDate.getTime() - 1000), `PENGAJUAN LAPORAN LPJ DISETUJUI OLEH BENDAHARA PUSAT`, "emerald", true);
                                                        addEvent(finalDate, `SELESAI & DIARSIPKAN`, "emerald", true, false, true);
                                                    }
                                                }

                                                // Do not sort arrays so they stay strictly sequential

                                                let displayCounter = 1;
                                                events.forEach(e => {
                                                    if (e.isMain) {
                                                        e.title = `${displayCounter}. ${e.title}`;
                                                        displayCounter++;
                                                    }
                                                });

                                                const getDotClass = (color: string, isPulse?: boolean) => {
                                                    let base = "absolute -left-[22px] w-3 h-3 rounded-full border-2 border-white shadow-sm font-bold";
                                                    if (color === 'emerald') base += " bg-emerald-500";
                                                    else if (color === 'rose') base += " bg-rose-500";
                                                    else if (color === 'amber') base += " bg-amber-500";
                                                    if (isPulse) base += " animate-pulse";
                                                    return base;
                                                };

                                                return (
                                                    <Fragment>
                                                        {events.map((ev, idx) => {
                                                            let titleColor = 'text-slate-800';
                                                            if (ev.color === 'emerald' && ev.isFinal) titleColor = 'text-emerald-700';
                                                            if (ev.color === 'rose') titleColor = 'text-rose-600';
                                                            if (ev.color === 'amber') titleColor = 'text-amber-600';

                                                            let badgeClass = 'bg-slate-100 text-slate-500';
                                                            if (ev.isFinal) badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                                                            else if (ev.color === 'rose') badgeClass = 'bg-rose-50 text-rose-600 border border-rose-100';
                                                            else if (ev.color === 'amber') badgeClass = 'bg-amber-50 text-amber-700 border border-amber-100';

                                                            let descColor = 'text-slate-400';
                                                            if (ev.color === 'rose' || ev.color === 'amber') descColor = 'text-slate-600 italic';
                                                            else if (ev.isFinal) descColor = 'text-emerald-600 uppercase tracking-wider';

                                                            return (
                                                                <div key={idx} className="relative flex items-start gap-3 font-bold">
                                                                    <div className={getDotClass(ev.color, ev.isPulse)}></div>
                                                                    <div className="space-y-0.5 mt-[-2px]">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <h5 className={`text-[10px] font-black uppercase tracking-tight ${titleColor}`}>
                                                                                {ev.title}
                                                                            </h5>
                                                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${badgeClass}`}>
                                                                                {ev.dateStr}
                                                                            </span>
                                                                        </div>
                                                                        <p className={`text-[9px] font-bold ${descColor}`}>
                                                                            {ev.desc}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </Fragment>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer - Fixed Height */}
                                <div className="bg-slate-50 px-6 py-4 flex justify-end shrink-0 border-t border-slate-100">
                                    <button 
                                        onClick={() => {
                                            setSelectedItemForDetail(null);
                                            setDetailLpjDoc(null);
                                            setDetailRkaDoc(null);
                                            setSelectedRevisionSnapshot(null);
                                        }}
                                        className="px-5 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-md cursor-pointer"
                                    >
                                        Tutup Detail
                                    </button>
                                </div>
                            </Fragment>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
