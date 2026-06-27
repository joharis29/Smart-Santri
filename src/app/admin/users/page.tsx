'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, Download, MoreVertical, Edit, Trash2, Mail, Building, Shield, Eye, EyeOff, User, Lock, X, AlertTriangle, KeyRound, Ban, Info, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { registerUserByAdmin, deleteUserByAdmin, resetUserPasswordByAdmin, toggleUserStatusByAdmin, updateUserByAdmin } from './actions';
import ExcelJS from 'exceljs';

type UserData = {
  id: number | string;
  name: string;
  email: string;
  role: string;
  unit: string;
  status: string;
  joinedAt: string;
  concurrentRoles?: { role: string; unit: string }[];
};

// --- INITIAL DATA ---
const INITIAL_USERS: UserData[] = [];

// Enum mapping utilities
const mapDropdownToEnum = (roleStr: string) => {
  switch (roleStr) {
    case 'Administrator': return 'ADMINISTRATOR';
    case 'Bendahara Yayasan/Pesantren (Pusat)': return 'BENDAHARA_PUSAT';
    case 'Pimpinan Pesantren': return 'PIMPINAN';
    case 'Bendahara Jenjang': return 'BENDAHARA_JENJANG';
    case 'Kepala Jenjang': return 'KEPALA_JENJANG';
    case 'Kepala Unit': return 'KEPALA_UNIT';
    case 'Bendahara Unit': return 'BENDAHARA_UNIT';
    case 'Staf Bidang': return 'STAFF_BIDANG';
    case 'Staf Unit': return 'STAFF';
    default: return 'STAFF';
  }
};

const mapEnumToDropdown = (roleEnum: string) => {
  switch (roleEnum) {
    case 'ADMINISTRATOR': return 'Administrator';
    case 'BENDAHARA_PUSAT': return 'Bendahara Yayasan/Pesantren (Pusat)';
    case 'PIMPINAN': return 'Pimpinan Pesantren';
    case 'BENDAHARA_JENJANG': return 'Bendahara Jenjang';
    case 'KEPALA_JENJANG': return 'Kepala Jenjang';
    case 'KEPALA_UNIT': return 'Kepala Unit';
    case 'BENDAHARA_UNIT': return 'Bendahara Unit';
    case 'STAFF_BIDANG': return 'Staf Bidang';
    case 'STAFF': return 'Staf Unit';
    default: return 'Staf Unit';
  }
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | string | null>(null);
  const [availableKaryawan, setAvailableKaryawan] = useState<any[]>([]);
  
  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: string;
    unit: string;
    password?: string;
    concurrentRoles: { role: string; unit: string }[];
  }>({ name: '', email: '', role: 'Staf Unit', unit: 'Pusat (Yayasan)', password: '', concurrentRoles: [{ role: 'Staf Unit', unit: 'Pusat (Yayasan)' }] });
  
  // Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  
  // Dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<number | string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [showFilterPopover, setShowFilterPopover] = useState<boolean>(false);

  // Load profiles from Supabase
  const loadProfiles = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // 1. Fetch main active profiles
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*, unit:unit_id(name)');
      
      if (error) throw error;
      
      // 2. Fetch all multi-role assignments
      const { data: multiRolesData } = await supabase
        .from('profiles_multi_role')
        .select('*, unit:unit_id(name)');

      // 3. Fetch karyawan for dropdown
      const { data: karyawanData } = await supabase
        .from('karyawan')
        .select('nama, email');
        
      if (karyawanData) {
        setAvailableKaryawan(karyawanData);
      }
      
      if (profilesData) {
        const mappedUsers = profilesData.map((p: any) => {
          const userRoles = multiRolesData 
            ? multiRolesData.filter((mr: any) => mr.user_id === p.id)
            : [];
          
          const concurrentRoles = userRoles.map((mr: any) => ({
            role: mapEnumToDropdown(mr.role),
            unit: mr.unit?.name || 'Pusat (Yayasan)'
          }));

          return {
            id: p.id,
            name: p.full_name,
            email: p.email || `${p.full_name.toLowerCase().replace(/\s+/g, '.')}@smartsantri.com`,
            role: mapEnumToDropdown(p.role),
            unit: p.unit?.name || 'Pusat (Yayasan)',
            status: p.is_active !== false ? 'Aktif' : 'Nonaktif',
            joinedAt: new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            concurrentRoles: concurrentRoles.length > 0 ? concurrentRoles : [{ role: mapEnumToDropdown(p.role), unit: p.unit?.name || 'Pusat (Yayasan)' }]
          };
        });
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserData; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: keyof UserData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter users
  const unregisteredKaryawan = availableKaryawan.filter(
    k => !users.some(u => u.name.toLowerCase() === k.nama.toLowerCase())
  );

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.unit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;
    const matchesUnit = filterUnit === 'ALL' || user.unit === filterUnit;

    return matchesSearch && matchesRole && matchesStatus && matchesUnit;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue = a[key] || '';
    let bValue = b[key] || '';
    
    if (typeof aValue === 'string') aValue = (aValue as string).toLowerCase();
    if (typeof bValue === 'string') bValue = (bValue as string).toLowerCase();

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Export users to Excel (.xlsx) with premium styling matching the user's reference
  const handleExportExcel = async () => {
    if (sortedUsers.length === 0) {
      alert('Tidak ada data pengguna untuk diekspor!');
      return;
    }

    try {
      // 1. Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Staf');

      // 2. Define headers and columns config
      worksheet.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Nama Lengkap', key: 'name', width: 28 },
        { header: 'Email Address', key: 'email', width: 32 },
        { header: 'Peran Aktif', key: 'role', width: 22 },
        { header: 'Unit Kerja', key: 'unit', width: 22 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Tanggal Terdaftar', key: 'joinedAt', width: 18 }
      ];

      // 3. Add rows from sortedUsers
      sortedUsers.forEach((user, idx) => {
        worksheet.addRow({
          no: idx + 1,
          name: user.name,
          email: user.email,
          role: user.role,
          unit: user.unit,
          status: user.status,
          joinedAt: user.joinedAt
        });
      });

      // 4. Style cells (Header & Body) exactly matching user's image request
      // Style the header row (Row 1)
      const headerRow = worksheet.getRow(1);
      headerRow.height = 24;
      
      headerRow.eachCell((cell) => {
        // Bold, Rata Tengah, Font Times New Roman 11pt
        cell.font = {
          name: 'Times New Roman',
          size: 11,
          bold: true,
          color: { argb: 'FF000000' } // Black text
        };
        // Soft green background matching screenshot (#70C160 -> argb: 'FF70C160')
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF70C160' }
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        // Thin solid black borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // Style data rows (Rows 2 onwards)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        row.height = 20;
        row.eachCell((cell, colNumber) => {
          // Font Times New Roman 11pt, Regular
          cell.font = {
            name: 'Times New Roman',
            size: 11,
            bold: false,
            color: { argb: 'FF000000' }
          };
          
          // Alignment
          if (colNumber === 1 || colNumber === 6) {
            // Column 1 (No) & Column 6 (Status): Rata Tengah
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
          } else {
            // Other columns: Rata Kiri
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'left'
            };
          }

          // Thin solid black borders for all cells
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });
      });

      // 5. Generate Excel buffer and trigger file download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Daftar_Staf_Smart_Santri_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Gagal mengekspor data ke Excel.');
    }
  };

  // Handlers
  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', email: '', role: 'Staf Unit', unit: 'Pusat (Yayasan)', password: '', concurrentRoles: [{ role: 'Staf Unit', unit: 'Pusat (Yayasan)' }] });
    setSelectedUserId(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserData) => {
    setModalMode('edit');
    setFormData({ 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      unit: user.unit, 
      password: '',
      concurrentRoles: user.concurrentRoles && user.concurrentRoles.length > 0 ? user.concurrentRoles : [{ role: user.role, unit: user.unit }]
    });
    setSelectedUserId(user.id);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        const res = await deleteUserByAdmin(userToDelete.id as string, userToDelete.role, userToDelete.unit);
        if (!res.success) throw new Error(res.error);
        
        if (res.isPartialDelete) {
          // Update local state to reflect the new main role and remove the deleted role
          setUsers(users.map(u => {
            if (u.id === userToDelete.id) {
              const updatedConcurrentRoles = u.concurrentRoles?.filter(cr => !(cr.role === userToDelete.role && cr.unit === userToDelete.unit)) || [];
              return {
                ...u,
                role: res.newMainRole || u.role,
                unit: res.newMainUnit || u.unit,
                concurrentRoles: updatedConcurrentRoles
              };
            }
            return u;
          }));
          alert(`Berhasil: Peran ${userToDelete.role} dihapus, namun akun tetap aktif sebagai ${res.newMainRole}.`);
        } else {
          setUsers(users.filter(u => u.id !== userToDelete.id));
          alert('Pengguna berhasil dihapus sepenuhnya dari sistem!');
        }
      } catch (err: any) {
        console.error('Error deleting profile:', err);
        alert(`Gagal menghapus pengguna: ${err.message || err}`);
      }
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const addRole = () => {
    setFormData(prev => ({
      ...prev,
      concurrentRoles: [...prev.concurrentRoles, { role: 'Staf Unit', unit: 'Pusat (Yayasan)' }]
    }));
  };

  const removeRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      concurrentRoles: prev.concurrentRoles.filter((_, idx) => idx !== index)
    }));
  };

  const updateConcurrentRole = (index: number, field: 'role' | 'unit', value: string) => {
    setFormData(prev => {
      const newRoles = [...prev.concurrentRoles];
      newRoles[index] = { ...newRoles[index], [field]: value };
      return { ...prev, concurrentRoles: newRoles };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabase = createClient();
      
      let selectedUnitId: string | null = null;
      if (formData.unit) {
        const { data: unitData } = await supabase
          .from('unit')
          .select('id')
          .eq('name', formData.unit)
          .single();
        if (unitData) selectedUnitId = unitData.id;
      }

      if (modalMode === 'add') {
        const res = await registerUserByAdmin({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          unit: formData.unit,
          password: formData.password
        });

        if (!res.success) throw new Error(res.error);
        const newId = res.userId!;

        const emailExists = users.some(u => u.email.toLowerCase() === formData.email.toLowerCase());
        
        if (emailExists) {
          setUsers(users.map(u => u.email.toLowerCase() === formData.email.toLowerCase() ? {
            ...u,
            name: formData.name,
            role: formData.role,
            unit: formData.unit
          } : u));
          alert(`Berhasil: Akun ${formData.email} sudah ada. Peran & unit aktifnya telah sukses dialihkan/diperbarui!`);
        } else {
          const newUser: UserData = {
            id: newId,
            name: formData.name,
            email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@smartsantri.com`,
            role: formData.role,
            unit: formData.unit,
            status: 'Aktif',
            joinedAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          };
          setUsers([newUser, ...users]);
          alert(`Berhasil: Akun login & profil untuk ${formData.name} berhasil dibuat!`);
        }
      } else {
        const res = await updateUserByAdmin(selectedUserId as string, {
          name: formData.name,
          email: formData.email,
          concurrentRoles: formData.concurrentRoles
        });

        if (!res.success) throw new Error(res.error);

        setUsers(users.map(u => {
          if (u.id === selectedUserId) {
            const firstRole = formData.concurrentRoles[0];
            return {
              ...u,
              name: formData.name,
              email: formData.email,
              role: firstRole.role,
              unit: firstRole.unit,
              concurrentRoles: formData.concurrentRoles
            };
          }
          return u;
        }));
        alert(`Berhasil: Data ${formData.name} beserta seluruh perannya berhasil diperbarui!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert(`Gagal menyimpan: ${err.message || err}`);
    }
  };

  const handleDropdownAction = async (action: string, user: UserData) => {
    setActiveDropdownId(null);
    
    if (action === 'Lihat Detail') {
      alert(`Detail Pengguna:\n\nNama: ${user.name}\nEmail: ${user.email}\nPeran: ${user.role}\nUnit: ${user.unit}\nStatus: ${user.status}\nBergabung: ${user.joinedAt}`);
    } else if (action === 'Reset Password') {
      const newPassword = prompt(`Masukkan kata sandi baru untuk ${user.name}:`, 'SmartSantri123!');
      if (newPassword === null) return; // Batal
      if (newPassword.trim().length < 6) {
        alert('Kata sandi minimal harus 6 karakter demi keamanan!');
        return;
      }
      
      try {
        const res = await resetUserPasswordByAdmin(user.id as string, newPassword);
        if (!res.success) throw new Error(res.error);
        alert(`Berhasil: Kata sandi untuk ${user.name} berhasil diperbarui!`);
      } catch (err: any) {
        console.error('Error resetting password:', err);
        alert(`Gagal mereset kata sandi: ${err.message || err}`);
      }
    } else if (action === 'Nonaktifkan Akun' || action === 'Aktifkan Akun') {
      const isActivating = action === 'Aktifkan Akun';
      const confirmMsg = isActivating 
        ? `Apakah Anda yakin ingin mengaktifkan kembali akun ${user.name}?` 
        : `Apakah Anda yakin ingin menonaktifkan akun ${user.name}? Nonaktifkan akun akan mencegah pengguna ini untuk login ke sistem.`;
      
      if (!confirm(confirmMsg)) return;

      try {
        const currentIsActive = user.status === 'Aktif';
        const res = await toggleUserStatusByAdmin(user.id as string, currentIsActive);
        if (!res.success) throw new Error(res.error);
        
        // Update local state
        setUsers(users.map(u => u.id === user.id ? { ...u, status: res.newIsActive ? 'Aktif' : 'Nonaktif' } : u));
        alert(`Berhasil: Status akun ${user.name} sekarang adalah ${res.newIsActive ? 'Aktif' : 'Nonaktif'}!`);
      } catch (err: any) {
        console.error('Error toggling user status:', err);
        alert(`Gagal mengubah status akun: ${err.message || err}`);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6" onClick={() => activeDropdownId && setActiveDropdownId(null)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (activeDropdownId) setActiveDropdownId(null); } }} role="presentation">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Kelola akses, peran, dan unit kerja untuk staf Smart Santri.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all text-sm shrink-0">
          <Plus className="w-4 h-4" /> Tambah Pengguna Baru
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Cari nama, email, peran, atau unit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border rounded-xl font-bold text-xs transition-all ${
                filterRole !== 'ALL' || filterStatus !== 'ALL' || filterUnit !== 'ALL'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span>Filter</span>
              {(filterRole !== 'ALL' || filterStatus !== 'ALL' || filterUnit !== 'ALL') && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
            </button>

            {/* Premium Floating Filter Popover */}
            {showFilterPopover && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-40 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Opsi Filter</span>
                  {(filterRole !== 'ALL' || filterStatus !== 'ALL' || filterUnit !== 'ALL') && (
                    <button 
                      onClick={() => {
                        setFilterRole('ALL');
                        setFilterStatus('ALL');
                        setFilterUnit('ALL');
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                {/* Filter Peran */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Saring Berdasarkan Peran</label>
                  <select 
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Peran</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Bendahara Yayasan/Pesantren (Pusat)">Bendahara Pusat</option>
                    <option value="Bendahara Unit">Bendahara Unit</option>
                    <option value="Kepala Unit">Kepala Unit</option>
                    <option value="Staf Unit">Staf Unit</option>
                    <option value="Staf Bidang">Staf Bidang</option>
                    <option value="Pimpinan Pesantren">Pimpinan</option>
                  </select>
                </div>

                {/* Filter Unit */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Saring Berdasarkan Unit</label>
                  <select 
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Unit</option>
                    <option value="Pusat (Yayasan)">Pusat (Yayasan)</option>
                    <option value="SDIT 1">SDIT 1</option>
                    <option value="SDIT 2">SDIT 2</option>
                    <option value="SMPIT">SMPIT</option>
                    <option value="SMAIT">SMAIT</option>
                    <option value="MADIN">MADIN</option>
                    <option value="PONDOK">PONDOK</option>
                    <option value="Dapur Umum">Dapur Umum</option>
                  </select>
                </div>

                {/* Filter Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Saring Berdasarkan Status</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs transition-colors"
              title="Ekspor daftar ke format Excel (.xlsx)"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-1">Pengguna {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('role')}>
                  <div className="flex items-center gap-1">Peran (Role) {sortConfig?.key === 'role' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('unit')}>
                  <div className="flex items-center gap-1">Unit Aktif {sortConfig?.key === 'unit' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => requestSort('status')}>
                  <div className="flex items-center justify-center gap-1">Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-slate-500 font-medium text-sm">Tidak ada pengguna yang cocok dengan pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-slate-500">
                            <Mail className="w-3 h-3 shrink-0" />
                            <p className="text-[11px] truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{user.role}</span>
                        </div>
                        {user.concurrentRoles && user.concurrentRoles.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-0.5 max-w-[200px]">
                            {user.concurrentRoles.map((cr: any, idx: number) => {
                              if (cr.role === user.role && cr.unit === user.unit) return null;
                              const labelShort = cr.role === 'Bendahara Yayasan/Pesantren (Pusat)' ? 'B. Pusat' : cr.role === 'Bendahara Unit' ? 'B. Unit' : cr.role === 'Kepala Unit' ? 'K. Unit' : cr.role === 'Staf Unit' ? 'Staf' : cr.role;
                              return (
                                <span key={idx} className="inline-flex items-center px-1 py-0.5 rounded text-[8px] bg-slate-50 text-slate-500 font-bold border border-slate-100 whitespace-nowrap">
                                  {labelShort} ({cr.unit})
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{user.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.status === 'Aktif' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(user); }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" 
                          title="Edit Pengguna"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(user); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" 
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="relative" ref={activeDropdownId === user.id ? dropdownRef : null}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === user.id ? null : user.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${activeDropdownId === user.id ? 'text-slate-800 bg-slate-100 opacity-100' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100 opacity-0 group-hover:opacity-100'}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {activeDropdownId === user.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right text-left">
                              <button onClick={() => handleDropdownAction('Reset Password', user)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                                <KeyRound className="w-4 h-4" /> Reset Password
                              </button>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button onClick={() => handleDropdownAction(user.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun', user)} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold hover:bg-rose-50 transition-colors ${user.status === 'Aktif' ? 'text-rose-600' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                {user.status === 'Aktif' ? <Ban className="w-4 h-4" /> : <Shield className="w-4 h-4" />} 
                                {user.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 font-medium">Menampilkan <span className="font-bold text-slate-800">{sortedUsers.length}</span> dari <span className="font-bold text-slate-800">{users.length}</span> pengguna</p>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-400 bg-white cursor-not-allowed">Sebelumnya</button>
            <button className="px-3 py-1.5 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50">1</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">2</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">Selanjutnya</button>
          </div>
        </div>
      </div>

      {/* -------------------- ADD / EDIT USER MODAL -------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsModalOpen(false); }}
            role="button"
            tabIndex={0}
            aria-label="Tutup modal"
          ></div>
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                  {modalMode === 'add' ? <User className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Data Pengguna'}</h3>
                  <p className="text-xs text-slate-500 font-medium">{modalMode === 'add' ? 'Buat akun akses untuk staf atau pengelola.' : 'Perbarui data diri dan hak akses pengguna ini.'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleFormSubmit}>
                
                {/* Kiri: Data Diri */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-2">Informasi Akun</h4>
                  
                  {modalMode === 'add' && (
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex gap-2.5 items-start">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-emerald-800">Petunjuk Registrasi</p>
                        <p className="text-[10px] text-emerald-700/90 leading-relaxed font-medium">
                          Staf harus melakukan <strong>registrasi/signup mandiri</strong> terlebih dahulu di halaman depan menggunakan email mereka. Setelah itu, masukkan email tersebut di sini untuk menetapkan peran dan unit kerja mereka secara resmi.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      {modalMode === 'add' ? (
                        <select 
                          required 
                          value={formData.name}
                          onChange={(e) => {
                            const selectedName = e.target.value;
                            const k = unregisteredKaryawan.find(x => x.nama === selectedName);
                            setFormData({
                              ...formData, 
                              name: selectedName, 
                              email: k?.email || formData.email 
                            });
                          }}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-white" 
                        >
                          <option value="">Pilih karyawan yang belum terdaftar...</option>
                          {unregisteredKaryawan.map((k, idx) => (
                            <option key={idx} value={k.nama}>{k.nama}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          required 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Masukkan nama lengkap" 
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Alamat Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="email" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="nama@smartsantri.com" 
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                      />
                    </div>
                  </div>

                </div>

                {/* Kanan: Akses */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-2">Otoritas & Akses</h4>
                  
                  {modalMode === 'add' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Peran (Role)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield className="w-4 h-4 text-slate-400" />
                          </div>
                          <select 
                            required 
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-white"
                          >
                            <option value="">Pilih peran akses...</option>
                            <option value="Administrator">Administrator</option>
                            <option value="Bendahara Yayasan/Pesantren (Pusat)">Bendahara Yayasan/Pesantren (Pusat)</option>
                            <option value="Pimpinan Pesantren">Pimpinan Pesantren</option>
                            <option value="Bendahara Jenjang">Bendahara Jenjang</option>
                            <option value="Kepala Jenjang">Kepala Jenjang</option>
                            <option value="Kepala Unit">Kepala Unit</option>
                            <option value="Bendahara Unit">Bendahara Unit</option>
                            <option value="Staf Bidang">Staf Bidang</option>
                            <option value="Staf Unit">Staf Unit</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Unit Aktif</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="w-4 h-4 text-slate-400" />
                          </div>
                          <select 
                            required 
                            value={formData.unit}
                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-white"
                          >
                            <option value="">Pilih unit kerja...</option>
                            <option value="Pusat (Yayasan)">Pusat (Yayasan)</option>
                            <option value="TK">TK</option>
                            <option value="Diniyah">Diniyah</option>
                            <option value="SDIT 1">SDIT 1</option>
                            <option value="SDIT 2">SDIT 2</option>
                            <option value="MTs">MTs</option>
                            <option value="MA">MA</option>
                            <option value="THQ">THQ</option>
                            <option value="Asrama Putra">Asrama Putra</option>
                            <option value="Asrama Putri">Asrama Putri</option>
                            <option value="Dapur Asrama Putra">Dapur Asrama Putra</option>
                            <option value="Dapur Asrama Putri">Dapur Asrama Putri</option>
                            <option value="Dapur Umum">Dapur Umum</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {formData.concurrentRoles.map((r, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group transition-all hover:border-emerald-200">
                          {formData.concurrentRoles.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeRole(idx)} 
                              className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border border-rose-200 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                              title="Hapus Peran"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Peran {idx === 0 ? '(Utama)' : `(Tambahan ${idx})`}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Shield className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <select 
                                required 
                                value={r.role}
                                onChange={(e) => updateConcurrentRole(idx, 'role', e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-white font-medium"
                              >
                                <option value="">Pilih peran akses...</option>
                                <option value="Administrator">Administrator</option>
                                <option value="Bendahara Yayasan/Pesantren (Pusat)">Bendahara Yayasan/Pesantren (Pusat)</option>
                                <option value="Pimpinan Pesantren">Pimpinan Pesantren</option>
                                <option value="Bendahara Jenjang">Bendahara Jenjang</option>
                                <option value="Kepala Jenjang">Kepala Jenjang</option>
                                <option value="Kepala Unit">Kepala Unit</option>
                                <option value="Bendahara Unit">Bendahara Unit</option>
                                <option value="Staf Bidang">Staf Bidang</option>
                                <option value="Staf Unit">Staf Unit</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unit Kerja</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                              <select 
                                required 
                                value={r.unit}
                                onChange={(e) => updateConcurrentRole(idx, 'unit', e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-white font-medium"
                              >
                                <option value="">Pilih unit kerja...</option>
                                <option value="Pusat (Yayasan)">Pusat (Yayasan)</option>
                                <option value="TK">TK</option>
                                <option value="Diniyah">Diniyah</option>
                                <option value="SDIT 1">SDIT 1</option>
                                <option value="SDIT 2">SDIT 2</option>
                                <option value="MTs">MTs</option>
                                <option value="MA">MA</option>
                                <option value="THQ">THQ</option>
                                <option value="Asrama Putra">Asrama Putra</option>
                                <option value="Asrama Putri">Asrama Putri</option>
                                <option value="Dapur Asrama Putra">Dapur Asrama Putra</option>
                                <option value="Dapur Asrama Putri">Dapur Asrama Putri</option>
                                <option value="Dapur Umum">Dapur Umum</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        type="button" 
                        onClick={addRole} 
                        className="w-full py-2 border border-dashed border-emerald-300 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Peran Lainnya
                      </button>
                    </div>
                  )}
                  
                  <div className="pt-2">
                     <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 items-start">
                       <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                       <div className="space-y-1">
                         <p className="text-xs font-bold text-amber-800">Perhatian Otorisasi</p>
                         <p className="text-[10px] text-amber-700/80 leading-relaxed font-medium">Pastikan memilih Unit dan Peran yang tepat. Kesalahan penempatan dapat menyebabkan staf mengakses laporan keuangan unit lain yang bukan haknya.</p>
                       </div>
                     </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 rounded-xl transition-all"
                  >
                    {modalMode === 'add' ? 'Simpan Pengguna Baru' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- DELETE CONFIRMATION MODAL -------------------- */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsDeleteModalOpen(false); }}
            role="button"
            tabIndex={0}
            aria-label="Tutup modal"
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl border border-rose-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Hapus Pengguna?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus <strong>{userToDelete.name}</strong> secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 rounded-xl transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
