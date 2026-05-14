'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, Download, MoreVertical, Edit, Trash2, Mail, Building, Shield, Eye, EyeOff, User, Lock, X, AlertTriangle, KeyRound, Ban, Info } from 'lucide-react';

type UserData = {
  id: number;
  name: string;
  email: string;
  role: string;
  unit: string;
  status: string;
  joinedAt: string;
};

// --- INITIAL DUMMY DATA ---
const INITIAL_USERS: UserData[] = [
  { id: 1, name: 'Ahmad Fauzi', email: 'ahmad.fauzi@smartsantri.com', role: 'Administrator', unit: 'Pusat (Yayasan)', status: 'Aktif', joinedAt: '01 Jan 2026' },
  { id: 2, name: 'Siti Aminah', email: 'siti.aminah@smartsantri.com', role: 'Bendahara Yayasan/Pesantren (Pusat)', unit: 'Pusat (Yayasan)', status: 'Aktif', joinedAt: '15 Jan 2026' },
  { id: 3, name: 'K.H. Abdullah', email: 'pimpinan@smartsantri.com', role: 'Pimpinan Pesantren', unit: 'Pusat (Yayasan)', status: 'Aktif', joinedAt: '10 Jan 2026' },
  { id: 4, name: 'Budi Santoso', email: 'budi.s@smartsantri.com', role: 'Bendahara Jenjang', unit: 'Pendidikan', status: 'Aktif', joinedAt: '20 Jan 2026' },
  { id: 5, name: 'Ust. Rahman', email: 'rahman.kepala@smartsantri.com', role: 'Kepala Jenjang', unit: 'Pendidikan', status: 'Aktif', joinedAt: '22 Jan 2026' },
  { id: 6, name: 'Ustadzah Halimah', email: 'halimah@smartsantri.com', role: 'Kepala Unit', unit: 'SDIT 1', status: 'Aktif', joinedAt: '05 Feb 2026' },
  { id: 7, name: 'Dian Sastro', email: 'dian.sastro@smartsantri.com', role: 'Bendahara Unit', unit: 'SDIT 1', status: 'Aktif', joinedAt: '05 Feb 2026' },
  { id: 8, name: 'Hasan Basri', email: 'hasan.b@smartsantri.com', role: 'Staf Bidang', unit: 'Asrama Putra', status: 'Nonaktif', joinedAt: '12 Feb 2026' },
  { id: 9, name: 'Nurul Hidayah', email: 'nurul.h@smartsantri.com', role: 'Staf Unit', unit: 'Dapur Asrama Putri', status: 'Aktif', joinedAt: '18 Feb 2026' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', role: '', unit: '' });
  
  // Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  
  // Dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', email: '', role: '', unit: '' });
    setSelectedUserId(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserData) => {
    setModalMode('edit');
    setFormData({ name: user.name, email: user.email, role: user.role, unit: user.unit });
    setSelectedUserId(user.id);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newUser: UserData = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        unit: formData.unit,
        status: 'Aktif',
        joinedAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      setUsers([newUser, ...users]);
      alert(`Berhasil: Pengguna baru ${formData.name} berhasil ditambahkan! (Simulasi Dummy)`);
    } else {
      setUsers(users.map(u => u.id === selectedUserId ? { ...u, ...formData } : u));
      alert(`Berhasil: Data ${formData.name} berhasil diperbarui! (Simulasi Dummy)`);
    }
    setIsModalOpen(false);
  };

  const handleDropdownAction = (action: string, userName: string) => {
    alert(`Aksi "${action}" dieksekusi untuk pengguna: ${userName} (Simulasi Dummy)`);
    setActiveDropdownId(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6" onClick={() => activeDropdownId && setActiveDropdownId(null)}>
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
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs transition-colors">
              <Download className="w-4 h-4" /> Ekspor
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Pengguna</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Peran (Role)</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Unit Aktif</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-slate-500 font-medium text-sm">Tidak ada pengguna yang cocok dengan pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
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
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{user.role}</span>
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
                              <button onClick={() => handleDropdownAction('Lihat Detail', user.name)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                                <Info className="w-4 h-4" /> Lihat Detail
                              </button>
                              <button onClick={() => handleDropdownAction('Reset Password', user.name)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                                <KeyRound className="w-4 h-4" /> Reset Password
                              </button>
                              <div className="h-px bg-slate-100 my-1"></div>
                              <button onClick={() => handleDropdownAction(user.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun', user.name)} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold hover:bg-rose-50 transition-colors ${user.status === 'Aktif' ? 'text-rose-600' : 'text-emerald-600 hover:bg-emerald-50'}`}>
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
          <p className="text-xs text-slate-500 font-medium">Menampilkan <span className="font-bold text-slate-800">{filteredUsers.length}</span> dari <span className="font-bold text-slate-800">{users.length}</span> pengguna</p>
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
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Masukkan nama lengkap" 
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                      />
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

                  {modalMode === 'add' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Kata Sandi (Default)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="w-4 h-4 text-slate-400" />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required 
                          placeholder="Masukkan kata sandi awal" 
                          className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Berikan password sementara yang mudah diingat, contoh: <span className="font-bold text-emerald-600">SmartSantri123!</span></p>
                    </div>
                  )}
                </div>

                {/* Kanan: Akses */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-b border-emerald-100 pb-2">Otoritas & Akses</h4>
                  
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
                      </select>
                    </div>
                  </div>
                  
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
