'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, Download, MoreVertical, Edit, Trash2, ShieldAlert, Key, CheckSquare, Info, AlertTriangle, ShieldCheck, X } from 'lucide-react';

type RoleData = {
  id: number;
  name: string;
  description: string;
  level: string;
  permissions: string[];
};

// --- INITIAL DUMMY DATA ---
const INITIAL_ROLES: RoleData[] = [
  { 
    id: 1, 
    name: 'Administrator', 
    description: 'Akses penuh ke seluruh sistem, pengaturan pengguna, dan konfigurasi master data pesantren.', 
    level: 'Sistem', 
    permissions: ['Kelola Pengguna', 'Kelola Role', 'Konfigurasi Sistem', 'Akses Semua Laporan'] 
  },
  { 
    id: 2, 
    name: 'Pimpinan Pesantren', 
    description: 'Akses pengawasan (*read-only*) untuk memantau status RKA, melihat laporan realisasi, dan evaluasi dompet dana.', 
    level: 'Eksekutif', 
    permissions: ['View Rincian Pengeluaran', 'Pantau Status RKA', 'View Saldo', 'View Bukti Nota'] 
  },
  { 
    id: 3, 
    name: 'Bendahara Pesantren (Pusat)', 
    description: 'Pusat kendali keuangan yayasan. Menyetujui RKA, mencairkan dana, dan memantau mutasi seluruh unit.', 
    level: 'Kritis', 
    permissions: ['Approve/Reject RKA', 'Cairkan Dana Bertahap', 'Buka/Tutup Periode RKA', 'Ubah Status Kegiatan'] 
  },
  { 
    id: 4, 
    name: 'Kepala Jenjang / Unit', 
    description: 'Otorisasi tingkat pertama. Bertanggung jawab memverifikasi RKA dari staf/bendahara unit sebelum ke Pusat.', 
    level: 'Menengah', 
    permissions: ['Verifikasi Internal', 'Approve RKA Unit', 'Tolak RKA Unit'] 
  },
  { 
    id: 5, 
    name: 'Bendahara Jenjang / Unit', 
    description: 'Pelaksana harian akuntansi unit. Bertugas membuat RKA tahunan/bulanan dan melaporkan realisasi belanja.', 
    level: 'Menengah', 
    permissions: ['Create RKA', 'Import RKA/RKT', 'Lapor Realisasi', 'Multi-Upload Nota', 'Cetak Invoice'] 
  },
  { 
    id: 6, 
    name: 'Staf Dapur / Bidang', 
    description: 'Pelaksana lapangan yang menginput laporan harian (reimbursement) dan pengajuan operasional rutin.', 
    level: 'Dasar', 
    permissions: ['Input Realisasi Harian', 'Upload Nota', 'Ajukan Reimbursement'] 
  },
];

const INITIAL_PERMISSIONS_MASTER = [
  'Kelola Pengguna', 'Kelola Role', 'Konfigurasi Sistem', 'Akses Semua Laporan',
  'View Rincian Pengeluaran', 'Pantau Status RKA', 'View Saldo', 'View Bukti Nota',
  'Approve/Reject RKA', 'Cairkan Dana Bertahap', 'Buka/Tutup Periode RKA', 'Ubah Status Kegiatan',
  'Verifikasi Internal', 'Approve RKA Unit', 'Tolak RKA Unit',
  'Create RKA', 'Import RKA/RKT', 'Lapor Realisasi', 'Multi-Upload Nota', 'Cetak Invoice',
  'Input Realisasi Harian', 'Upload Nota', 'Ajukan Reimbursement'
];

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<RoleData[]>(INITIAL_ROLES);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Master List for custom creatable dropdown
  const [availablePermissions, setAvailablePermissions] = useState<string[]>(INITIAL_PERMISSIONS_MASTER);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<{name: string, description: string, level: string, permissions: string[]}>({ name: '', description: '', level: 'Dasar', permissions: [] });
  
  // Multi-select dropdown states
  const [isPermDropdownOpen, setIsPermDropdownOpen] = useState(false);
  const [permSearchTerm, setPermSearchTerm] = useState('');
  const permDropdownRef = useRef<HTMLDivElement>(null);
  
  // Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleData | null>(null);
  
  // Dropdown options state
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const optionsDropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
      if (permDropdownRef.current && !permDropdownRef.current.contains(event.target as Node)) {
        setIsPermDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filters
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailablePermissions = availablePermissions.filter(perm => 
    perm.toLowerCase().includes(permSearchTerm.toLowerCase())
  );

  // Handlers
  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', description: '', level: 'Dasar', permissions: [] });
    setSelectedRoleId(null);
    setPermSearchTerm('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: RoleData) => {
    setModalMode('edit');
    setFormData({ 
      name: role.name, 
      description: role.description, 
      level: role.level, 
      permissions: [...role.permissions] 
    });
    setSelectedRoleId(role.id);
    setPermSearchTerm('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (role: RoleData) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      setRoles(roles.filter(r => r.id !== roleToDelete.id));
    }
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newRole: RoleData = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        level: formData.level,
        permissions: formData.permissions.length > 0 ? formData.permissions : ['Akses Standar']
      };
      setRoles([newRole, ...roles]);
      alert(`Berhasil: Role baru "${formData.name}" berhasil dibuat! (Simulasi Dummy)`);
    } else {
      setRoles(roles.map(r => r.id === selectedRoleId ? { 
        ...r, 
        name: formData.name, 
        description: formData.description, 
        level: formData.level, 
        permissions: formData.permissions 
      } : r));
      alert(`Berhasil: Hak akses untuk "${formData.name}" berhasil diperbarui! (Simulasi Dummy)`);
    }
    setIsModalOpen(false);
  };

  const handleOptionsDropdownAction = (action: string, roleName: string) => {
    alert(`Aksi "${action}" dieksekusi untuk role: ${roleName} (Simulasi Dummy)`);
    setActiveDropdownId(null);
  };

  const handleTogglePermission = (perm: string) => {
    if (formData.permissions.includes(perm)) {
      setFormData({...formData, permissions: formData.permissions.filter(p => p !== perm)});
    } else {
      setFormData({...formData, permissions: [...formData.permissions, perm]});
    }
    // Set focus back to input (optional, simple logic here keeps it open)
  };

  const handleAddNewPermission = () => {
    const newPerm = permSearchTerm.trim();
    if (newPerm && !availablePermissions.some(p => p.toLowerCase() === newPerm.toLowerCase())) {
      setAvailablePermissions([...availablePermissions, newPerm]);
      setFormData({...formData, permissions: [...formData.permissions, newPerm]});
      setPermSearchTerm('');
    }
  };

  // UI Helpers
  const renderPermissionBadge = (perm: string, index: number, onRemove?: () => void) => {
    const colorClasses = [
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-teal-50 text-teal-700 border-teal-200',
    ];
    const badgeColor = colorClasses[index % colorClasses.length];
    
    return (
      <span key={index} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${badgeColor} whitespace-nowrap`}>
        {perm}
        {onRemove && (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'Sistem': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Kritis': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'Eksekutif': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Menengah': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6" onClick={() => activeDropdownId && setActiveDropdownId(null)}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Role & Akses</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Atur wewenang dan batasan akses (RBAC) untuk setiap peran di sistem.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all text-sm shrink-0">
          <Plus className="w-4 h-4" /> Tambah Role Baru
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
              placeholder="Cari nama role atau hak akses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs transition-colors">
              <Filter className="w-4 h-4" /> Filter Level
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap w-1/4">Nama Role</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-1/3">Keterangan</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Hak Akses (Permissions)</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-slate-500 font-medium text-sm">Tidak ada role yang cocok dengan pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{role.name}</p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1 border ${getLevelColor(role.level)}`}>
                            Level: {role.level}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {role.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {role.permissions.map((perm, idx) => renderPermissionBadge(perm, idx))}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(role); }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" 
                          title="Edit Role"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(role); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" 
                          title="Hapus Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="relative" ref={activeDropdownId === role.id ? optionsDropdownRef : null}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === role.id ? null : role.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${activeDropdownId === role.id ? 'text-slate-800 bg-slate-100 opacity-100' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100 opacity-0 group-hover:opacity-100'}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {activeDropdownId === role.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right text-left">
                              <button onClick={() => handleOptionsDropdownAction('Lihat Detail Akses', role.name)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                                <Info className="w-4 h-4" /> Lihat Detail Akses
                              </button>
                              <button onClick={() => handleOptionsDropdownAction('Duplikat Role', role.name)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                                <CheckSquare className="w-4 h-4" /> Duplikat Role
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
      </div>

      {/* -------------------- ADD / EDIT ROLE MODAL -------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                  {modalMode === 'add' ? <ShieldAlert className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{modalMode === 'add' ? 'Tambah Role Baru' : 'Edit Hak Akses Role'}</h3>
                  <p className="text-xs text-slate-500 font-medium">Atur kewenangan fungsi untuk peran manajerial ini.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <form className="space-y-5" onSubmit={handleFormSubmit} id="roleForm">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Role</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Contoh: Auditor Internal" 
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tingkat Bahaya / Level Akses</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <AlertTriangle className="w-4 h-4 text-slate-400" />
                      </div>
                      <select 
                        required 
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none cursor-pointer bg-white"
                      >
                        <option value="Sistem">Sistem (Admin Database)</option>
                        <option value="Kritis">Kritis (Bendahara Pusat)</option>
                        <option value="Eksekutif">Eksekutif (Pengawas/Pimpinan)</option>
                        <option value="Menengah">Menengah (Kepala/Bendahara Unit)</option>
                        <option value="Dasar">Dasar (Staf/Inputter)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Deskripsi Pekerjaan</label>
                  <textarea 
                    required 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Tuliskan secara singkat tugas dan fungsi dari role ini..." 
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none" 
                  />
                </div>

                {/* Creatable Multi-Select Dropdown for Permissions */}
                <div className="space-y-1.5 relative" ref={permDropdownRef}>
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Label Hak Akses (Permissions)</span>
                    <span className="text-[10px] text-slate-400 font-medium">{formData.permissions.length} terpilih</span>
                  </label>
                  
                  <div 
                    className={`min-h-[42px] w-full p-1.5 text-sm border ${isPermDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'} rounded-xl transition-all bg-white cursor-text flex flex-wrap gap-1.5 items-center relative z-20`}
                    onClick={() => setIsPermDropdownOpen(true)}
                  >
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <div className="flex flex-wrap gap-1.5 pl-8 w-full items-center">
                      {formData.permissions.map((perm, idx) => 
                        renderPermissionBadge(perm, idx, () => handleTogglePermission(perm))
                      )}
                      <input 
                        type="text" 
                        value={permSearchTerm}
                        onChange={(e) => { setPermSearchTerm(e.target.value); setIsPermDropdownOpen(true); }}
                        onFocus={() => setIsPermDropdownOpen(true)}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 py-1"
                        placeholder={formData.permissions.length === 0 ? "Pilih atau cari hak akses..." : ""}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && permSearchTerm && !availablePermissions.some(p => p.toLowerCase() === permSearchTerm.toLowerCase())) {
                            e.preventDefault();
                            handleAddNewPermission();
                          } else if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent form submission
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Dropdown Menu Overlay */}
                  {isPermDropdownOpen && (
                    <div className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-2 z-30 animate-in fade-in slide-in-from-top-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2 mb-1 border-b border-slate-100">Daftar Otoritas</p>
                      
                      <div className="space-y-1">
                        {filteredAvailablePermissions.map(perm => (
                          <label key={perm} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                            <div className="relative flex items-center justify-center w-5 h-5 border border-slate-300 rounded bg-white group-hover:border-emerald-500 transition-colors shrink-0">
                              <input 
                                type="checkbox" 
                                className="peer sr-only"
                                checked={formData.permissions.includes(perm)}
                                onChange={() => handleTogglePermission(perm)}
                              />
                              {formData.permissions.includes(perm) && (
                                <div className="absolute inset-0 bg-emerald-500 rounded flex items-center justify-center">
                                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{perm}</span>
                          </label>
                        ))}
                      </div>
                      
                      {/* Creatable option */}
                      {permSearchTerm && !availablePermissions.some(p => p.toLowerCase() === permSearchTerm.toLowerCase()) && (
                        <button 
                          type="button"
                          onClick={handleAddNewPermission}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-dashed border-emerald-200 mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          Tambah Akses "{permSearchTerm}"
                        </button>
                      )}
                      
                      {filteredAvailablePermissions.length === 0 && !permSearchTerm && (
                        <p className="text-xs text-slate-500 text-center py-4">Mulai mengetik untuk mencari atau menambah akses baru.</p>
                      )}
                    </div>
                  )}
                  
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex gap-2 mt-2">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-[10px] text-emerald-700 font-medium leading-tight">Jika hak akses yang Anda butuhkan tidak ada dalam daftar, cukup ketikkan namanya di kolom atas dan klik "Tambah Akses" atau tekan tombol Enter.</p>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="roleForm"
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 rounded-xl transition-all"
              >
                {modalMode === 'add' ? 'Simpan Role Baru' : 'Simpan Perubahan Hak Akses'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- DELETE CONFIRMATION MODAL -------------------- */}
      {isDeleteModalOpen && roleToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl border border-rose-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Hapus Akses Role?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus role <strong>{roleToDelete.name}</strong>? Pengguna yang saat ini memiliki role ini mungkin akan kehilangan aksesnya.
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
