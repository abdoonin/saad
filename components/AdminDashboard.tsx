import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  BarChart3, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  MapPin, 
  Phone, 
  Mail,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Database,
  Plus,
  X,
  Building2,
  PhoneCall,
  MapPinned,
  UserCircle,
  KeyRound,
  AtSign
} from 'lucide-react';
import { getAllPharmacies, deletePharmacy, togglePharmacyAdmin, getGlobalStats, getAllMedicines, deleteMedicine, createPharmacy } from '../services/adminService';
import { Pharmacy, Medicine, User } from '../types';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'pharmacies' | 'medicines'>('stats');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    address: '',
    email: '',
    password: '',
    phone: '',
    is_admin: false,
    is_open: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'stats') {
        const s = await getGlobalStats();
        setStats(s);
      } else if (activeTab === 'pharmacies') {
        const p = await getAllPharmacies();
        setPharmacies(p);
      } else if (activeTab === 'medicines') {
        const m = await getAllMedicines();
        setMedicines(m);
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePharmacy = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصيدلية؟ سيتم حذف جميع بياناتها ومخزونها.')) return;
    try {
      await deletePharmacy(id);
      setPharmacies(pharmacies.filter(p => p.id !== id));
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  const handleToggleAdmin = async (id: string, currentStatus: boolean) => {
    try {
      await togglePharmacyAdmin(id, !currentStatus);
      setPharmacies(pharmacies.map(p => p.id === id ? { ...p, is_admin: !currentStatus } : p));
    } catch (err) {
      alert('فشل تغيير الصلاحية');
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدواء؟ سيتم حذفه من جميع الصيدليات.')) return;
    try {
      await deleteMedicine(id);
      setMedicines(medicines.filter(m => m.id !== id));
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  const filteredPharmacies = pharmacies.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMedicines = medicines.filter(m => 
    m.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.scientific_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await createPharmacy(newPharmacy);
      setPharmacies([created, ...pharmacies]);
      setShowAddModal(false);
      setNewPharmacy({
        name: '',
        address: '',
        email: '',
        password: '',
        phone: '',
        is_admin: false,
        is_open: true
      });
      alert('تمت إضافة الصيدلية بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل إضافة الصيدلية. تأكد من أن البريد الإلكتروني غير مستخدم مسبقاً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
<<<<<<< HEAD
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">لوحة التحكم الإدارية</h1>
          <p className="text-gray-500 text-sm sm:text-base">مرحباً {user.name}، يمكنك إدارة النظام بالكامل من هنا.</p>
        </div>
        <div className="flex flex-wrap bg-white p-1 rounded-2xl shadow-sm border border-gray-100 gap-1">
          {activeTab === 'pharmacies' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="ml-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-green-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-green-700 transition-all flex items-center gap-1.5 sm:gap-2 shadow-md shadow-green-600/20"
            >
              <Plus size={16} />
              <span className="hidden xs:inline">إضافة صيدلية</span>
              <span className="xs:hidden">إضافة</span>
=======
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">لوحة التحكم الإدارية</h1>
          <p className="text-gray-500">مرحباً {user.name}، يمكنك إدارة النظام بالكامل من هنا.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          {activeTab === 'pharmacies' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="ml-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2 shadow-md shadow-green-600/20"
            >
              <Plus size={18} />
              إضافة صيدلية
>>>>>>> b75c855c49f0bf120451948a9c5fc2083f2a4ddd
            </button>
          )}
          <button 
            onClick={() => setActiveTab('stats')}
<<<<<<< HEAD
            className={`px-3 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 ${activeTab === 'stats' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BarChart3 size={16} />
            <span>الإحصائيات</span>
          </button>
          <button 
            onClick={() => setActiveTab('pharmacies')}
            className={`px-3 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 ${activeTab === 'pharmacies' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users size={16} />
            <span>الصيدليات</span>
          </button>
          <button 
            onClick={() => setActiveTab('medicines')}
            className={`px-3 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 ${activeTab === 'medicines' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Package size={16} />
            <span>الأدوية</span>
=======
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'stats' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BarChart3 size={18} />
            الإحصائيات
          </button>
          <button 
            onClick={() => setActiveTab('pharmacies')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'pharmacies' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users size={18} />
            الصيدليات
          </button>
          <button 
            onClick={() => setActiveTab('medicines')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'medicines' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Package size={18} />
            الأدوية
>>>>>>> b75c855c49f0bf120451948a9c5fc2083f2a4ddd
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 mb-6">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <h3 className="text-xl font-black text-gray-800">إضافة صيدلية / مدير جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePharmacy} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-grow">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 mr-1">اسم الصيدلية</label>
                      <div className="relative">
                        <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          required
                          autoFocus
                          type="text"
                          placeholder="مثال: صيدلية السعادة"
                          className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent outline-none transition-all"
                          value={newPharmacy.name}
                          onChange={(e) => setNewPharmacy({...newPharmacy, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 mr-1">رقم الهاتف</label>
                      <div className="relative">
                        <PhoneCall className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          required
                          type="tel"
                          placeholder="05xxxxxxxx"
                          className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent outline-none transition-all"
                          value={newPharmacy.phone}
                          onChange={(e) => setNewPharmacy({...newPharmacy, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 mr-1">العنوان بالتفصيل</label>
                    <div className="relative">
                      <MapPinned className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        type="text"
                        placeholder="المدينة، الحي، الشارع..."
                        className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent outline-none transition-all"
                        value={newPharmacy.address}
                        onChange={(e) => setNewPharmacy({...newPharmacy, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 mr-1">اسم المستخدم (البريد)</label>
                      <div className="flex items-center group">
                        <div className="relative flex-1">
                          <AtSign className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            required
                            type="text"
                            className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-r-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent outline-none text-left transition-all"
                            dir="ltr"
                            placeholder="username"
                            value={newPharmacy.email.replace('@saad.com', '')}
                            onChange={(e) => setNewPharmacy({...newPharmacy, email: `${e.target.value.trim()}@saad.com`})}
                          />
                        </div>
                        <span className="px-4 py-3 bg-gray-100 border border-gray-200 border-r-0 rounded-l-2xl text-gray-500 font-bold text-sm" dir="ltr">
                          @saad.com
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 mr-1">كلمة المرور</label>
                      <div className="relative">
                        <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          required
                          type="password"
                          placeholder="••••••••"
                          className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-transparent outline-none transition-all"
                          value={newPharmacy.password}
                          onChange={(e) => setNewPharmacy({...newPharmacy, password: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-primary-50/50 border border-primary-100 rounded-2xl transition-colors hover:bg-primary-50">
                  <div className="flex items-center gap-3 cursor-pointer select-none w-full" onClick={() => setNewPharmacy({...newPharmacy, is_admin: !newPharmacy.is_admin})}>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${newPharmacy.is_admin ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`}>
                      {newPharmacy.is_admin && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">منح صلاحيات مدير نظام</p>
                      <p className="text-[10px] text-gray-500">سيتمكن هذا المستخدم من إدارة الصيدليات والأدوية</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/30 shrink-0">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 active:scale-[0.98] transition-all shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'تأكيد الإضافة'
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-8 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <>
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 mb-4">
                  <Users size={32} />
                </div>
                <p className="text-sm text-gray-500 font-bold mb-1">إجمالي الصيدليات</p>
                <p className="text-4xl font-black text-gray-800">{stats.pharmaciesCount}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="bg-green-50 p-4 rounded-2xl text-green-600 mb-4">
                  <Package size={32} />
                </div>
                <p className="text-sm text-gray-500 font-bold mb-1">إجمالي الأدوية</p>
                <p className="text-4xl font-black text-gray-800">{stats.medicinesCount}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="bg-purple-50 p-4 rounded-2xl text-purple-600 mb-4">
                  <Database size={32} />
                </div>
                <p className="text-sm text-gray-500 font-bold mb-1">عناصر المخزون</p>
                <p className="text-4xl font-black text-gray-800">{stats.inventoryCount}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="bg-orange-50 p-4 rounded-2xl text-orange-600 mb-4">
                  <TrendingUp size={32} />
                </div>
                <p className="text-sm text-gray-500 font-bold mb-1">إجمالي عمليات البحث</p>
                <p className="text-4xl font-black text-gray-800">{stats.searchesCount}</p>
              </div>
            </div>
          )}

          {(activeTab === 'pharmacies' || activeTab === 'medicines') && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text"
                    placeholder={`البحث في ${activeTab === 'pharmacies' ? 'الصيدليات' : 'الأدوية'}...`}
                    className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

<<<<<<< HEAD
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-right min-w-[600px]">
=======
              <div className="overflow-x-auto">
                <table className="w-full text-right">
>>>>>>> b75c855c49f0bf120451948a9c5fc2083f2a4ddd
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                      {activeTab === 'pharmacies' ? (
                        <>
                          <th className="px-6 py-4 font-bold">الصيدلية</th>
                          <th className="px-6 py-4 font-bold">الموقع</th>
                          <th className="px-6 py-4 font-bold">التواصل</th>
                          <th className="px-6 py-4 font-bold">الحالة</th>
                          <th className="px-6 py-4 font-bold">الإجراءات</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 font-bold">اسم الدواء</th>
                          <th className="px-6 py-4 font-bold">الاسم العلمي</th>
                          <th className="px-6 py-4 font-bold">تاريخ الإضافة</th>
                          <th className="px-6 py-4 font-bold">الإجراءات</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeTab === 'pharmacies' ? (
                      filteredPharmacies.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-bold">
                                {p.name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{p.name}</p>
                                <p className="text-xs text-gray-400">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin size={14} className="text-gray-400" />
                              <span className="truncate max-w-[200px]">{p.address}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone size={12} /> {p.phone}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Mail size={12} /> {p.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {p.is_admin ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 uppercase">
                                <ShieldCheck size={10} /> مدير نظام
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-100 text-gray-600 uppercase">
                                صيدلية
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleAdmin(p.id, !!p.is_admin)}
                                className={`p-2 rounded-lg transition-colors ${p.is_admin ? 'text-amber-600 hover:bg-amber-50' : 'text-purple-600 hover:bg-purple-50'}`}
                                title={p.is_admin ? 'سحب صلاحيات المدير' : 'منح صلاحيات المدير'}
                              >
                                {p.is_admin ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                              </button>
                              <button 
                                onClick={() => handleDeletePharmacy(p.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف الصيدلية"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredMedicines.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800">{m.trade_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500 italic">{m.scientific_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-400">{(m as any).created_at ? new Date((m as any).created_at).toLocaleDateString('ar-SA') : '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleDeleteMedicine(m.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف الدواء"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {(activeTab === 'pharmacies' ? filteredPharmacies : filteredMedicines).length === 0 && (
                  <div className="py-20 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="text-gray-300" size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">لم يتم العثور على نتائج</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
<<<<<<< HEAD

export default AdminDashboard;
=======
>>>>>>> b75c855c49f0bf120451948a9c5fc2083f2a4ddd
