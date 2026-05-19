'use client';

import { useState, useEffect, useRef } from 'react';
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
    Wallet
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
    const [selectedSumber, setSelectedSumber] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

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
                                    return uniqueSources.length > 0 ? uniqueSources.join(' / ') : (it.sumber_dana || 'Dana Yayasan');
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

    // Extract unique filter options
    const availableUnits = Array.from(new Set(riwayatItems.map(i => i.unit)));
    const availableSumber = Array.from(new Set(riwayatItems.map(i => i.sumber)));
    const availableMonths = Array.from(new Set(riwayatItems.map(i => {
        return i.bulan ? `${i.bulan} ${i.tahun_ajaran}` : i.tanggal;
    })));

    // Compute filtered items
    const filteredRiwayat = riwayatItems.filter(item => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
            item.kegiatan.toLowerCase().includes(q) || 
            item.pengaju.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            item.unit.toLowerCase().includes(q);
        
        const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(item.unit);
        const matchesSumber = selectedSumber.length === 0 || selectedSumber.includes(item.sumber);
        
        let matchesMonth = true;
        if (selectedMonths.length > 0) {
            const tMonth = item.bulan ? `${item.bulan} ${item.tahun_ajaran}` : item.tanggal;
            matchesMonth = selectedMonths.includes(tMonth);
        }
        
        return matchesSearch && matchesUnit && matchesSumber && matchesMonth;
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
                                className={`flex items-center justify-center gap-2 border text-[10px] font-black px-4 py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-widest ${isFilterOpen || selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                            >
                                <Filter className="w-3.5 h-3.5" /> Filter
                                {(selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0) && (
                                    <span className="bg-emerald-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] ml-1">
                                        {selectedUnits.length + selectedSumber.length + selectedMonths.length}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Filter Arsip</h4>
                                            {(selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0) && (
                                                <button 
                                                    onClick={() => { setSelectedUnits([]); setSelectedSumber([]); setSelectedMonths([]); }}
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
                                                    <Calendar className="w-3 h-3" /> Periode Bulan
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
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tgl Laporan Diterima</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Bulan / T.A</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Unit / Bidang</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Program / Kegiatan</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sumber Dana</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Memuat Riwayat Laporan...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRiwayat.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center space-y-3">
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
                                        {/* 1. Tanggal Laporan Diterima */}
                                        <td className="px-6 py-4 align-middle text-[11px] font-black text-slate-500 whitespace-nowrap tracking-tighter uppercase">
                                            {item.tanggal}
                                        </td>
                                        
                                        {/* 2. Bulan / T.A */}
                                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                                            <p className="text-xs font-black text-slate-800 leading-none mb-1">{item.bulan || '-'}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{item.tahun_ajaran || '-'}</p>
                                        </td>

                                        {/* 3. Unit / Bidang */}
                                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                                            <p className="text-xs font-black text-emerald-700 leading-none mb-1">{item.unit}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{item.bidang || '-'}</p>
                                        </td>

                                        {/* 4. Program / Kegiatan */}
                                        <td className="px-4 py-4 align-middle">
                                            <p className="text-xs font-black text-slate-700 leading-tight mb-1">{item.kegiatan || item.program}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.id}</p>
                                        </td>

                                        {/* 5. Sumber Dana */}
                                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                                            <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg border border-slate-200 uppercase tracking-tighter">
                                                {item.sumber}
                                            </span>
                                        </td>

                                        {/* 6. Nominal */}
                                        <td className="px-4 py-4 align-middle text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs font-black text-slate-800 italic tracking-tighter">Rp {Number(item.nominal || 0).toLocaleString('id-ID')}</p>
                                                <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> SELESAI
                                                </span>
                                            </div>
                                        </td>

                                        {/* 7. Aksi */}
                                        <td className="px-4 py-4 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button 
                                                    onClick={() => handleExportDocumentToExcel(item.id, item.itemId)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                                                    title="Ekspor Excel (LPJ)"
                                                >
                                                    <FileSpreadsheet className="w-4.5 h-4.5" />
                                                </button>
                                                <button className="p-2 text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all" title="Detail Audit">
                                                    <ArrowUpRight className="w-4.5 h-4.5" />
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
        </div>
    );
}
