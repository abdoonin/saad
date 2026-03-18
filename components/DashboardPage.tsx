import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Package, AlertTriangle, MapPin, Settings, CheckCircle, Power, XCircle, Upload, Clock, TrendingUp, BarChart3, Search, ShoppingCart, Minus, Loader2, History, List } from 'lucide-react';
import { User, DashboardInventoryItem, Pharmacy } from '../types';
import { getPharmacyInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getPharmacyDetails, updatePharmacyProfile, bulkAddInventory, recordSale, getSalesLogs } from '../services/pharmacyService';
import { getTopSearchesInArea, TopSearch } from '../services/analyticsService';
import { InventoryModal } from './InventoryModal';
import { ProfileModal } from './ProfileModal';
import Papa from 'papaparse';
import { saveMedicineBarcode } from '../utils/barcodeDb';

interface DashboardPageProps {
  user: User;
}

// Enhanced Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; show: boolean; onClose: () => void }> = ({ message, type, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
      type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle size={20} className="text-green-400" /> : <XCircle size={20} className="text-white" />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  // Data State
  const [inventory, setInventory] = useState<DashboardInventoryItem[]>([]);
  const [pharmacyDetails, setPharmacyDetails] = useState<Pharmacy | null>(null);
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [salesLogs, setSalesLogs] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [sellingItem, setSellingItem] = useState<DashboardInventoryItem | null>(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleLoading, setSaleLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<DashboardInventoryItem | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user.pharmacyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoryData, profileData] = await Promise.all([
        getPharmacyInventory(user.pharmacyId),
        getPharmacyDetails(user.pharmacyId)
      ]);
      setInventory(inventoryData);
      setPharmacyDetails(profileData);
      
      if (profileData?.latitude && profileData?.longitude) {
        fetchAnalytics(profileData.latitude, profileData.longitude);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToastMessage('حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const fetchAnalytics = async (lat: number, lng: number) => {
    try {
      setAnalyticsLoading(true);
      const data = await getTopSearchesInArea(lat, lng);
      setTopSearches(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSalesLogs = async () => {
    try {
      setSalesLoading(true);
      const logs = await getSalesLogs(user.pharmacyId);
      setSalesLogs(logs);
    } catch (error) {
      console.error('Error fetching sales logs:', error);
      showToastMessage('حدث خطأ أثناء تحميل سجل المبيعات', 'error');
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSalesLogs();
    }
  }, [activeTab]);

  // --- Profile Actions ---

  const handleProfileUpdate = async (data: Partial<Pharmacy>) => {
    if (!pharmacyDetails) return;
    try {
      await updatePharmacyProfile(pharmacyDetails.id, data);
      setPharmacyDetails(prev => prev ? { ...prev, ...data } : null);
      showToastMessage('تم تحديث بيانات الصيدلية بنجاح');
    } catch (error) {
      console.error(error);
      showToastMessage('فشل تحديث البيانات. تأكد من صلاحيات قاعدة البيانات', 'error');
      throw error;
    }
  };

  const toggleStatus = async () => {
    if (!pharmacyDetails) return;
    
    if (autoOpenStatus === false) {
      // It's outside hours. They want to open.
      if (!window.confirm('أنت الآن خارج ساعات العمل الرسمية. لفتح الصيدلية الآن، سيتم مسح ساعات العمل التلقائية. هل تريد الاستمرار؟')) {
        return;
      }
      try {
        await updatePharmacyProfile(pharmacyDetails.id, { is_open: true, opening_time: null, closing_time: null });
        setPharmacyDetails(prev => prev ? { ...prev, is_open: true, opening_time: null, closing_time: null } : null);
        showToastMessage('تم فتح الصيدلية ومسح ساعات العمل');
      } catch (error: any) {
        console.error(error);
        showToastMessage('حدث خطأ أثناء تغيير حالة الصيدلية', 'error');
      }
      return;
    }

    // Inside hours or no hours set (Normal toggle for prayer/emergency)
    const newStatus = !pharmacyDetails.is_open;
    try {
      await updatePharmacyProfile(pharmacyDetails.id, { is_open: newStatus });
      setPharmacyDetails(prev => prev ? { ...prev, is_open: newStatus } : null);
      showToastMessage(newStatus ? 'تم فتح الصيدلية' : 'تم إغلاق الصيدلية مؤقتاً (صلاة/طوارئ)');
    } catch (error: any) {
      console.error(error);
      const msg = error.message?.includes('UPDATE Policy') 
        ? 'فشل التحديث: يرجى إضافة صلاحية UPDATE في قاعدة البيانات' 
        : 'حدث خطأ أثناء تغيير حالة الصيدلية';
      showToastMessage(msg, 'error');
    }
  };

  // --- Inventory Actions ---

  const handleAddClick = () => {
    setEditingItem(undefined);
    setIsInventoryModalOpen(true);
  };

  const handleEditClick = (item: DashboardInventoryItem) => {
    setEditingItem(item);
    setIsInventoryModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء من المخزون؟')) {
      try {
        await deleteInventoryItem(id);
        setInventory(prev => prev.filter(item => item.id !== id));
        showToastMessage('تم حذف الدواء بنجاح');
      } catch (error) {
        console.error('Error deleting item:', error);
        showToastMessage('فشل حذف الدواء', 'error');
      }
    }
  };

  const handleSaleClick = (item: DashboardInventoryItem) => {
    setSellingItem(item);
    setSaleQuantity(1);
    setIsSaleModalOpen(true);
  };

  const handleRecordSale = async () => {
    if (!sellingItem) return;
    if (saleQuantity <= 0) {
      showToastMessage('يرجى إدخال كمية صحيحة', 'error');
      return;
    }
    if (saleQuantity > sellingItem.quantity) {
      showToastMessage('الكمية المطلوبة أكبر من المتوفر في المخزون', 'error');
      return;
    }

    try {
      setSaleLoading(true);
      await recordSale(user.pharmacyId, sellingItem.id, saleQuantity, sellingItem.price);
      
      // Update local state
      setInventory(prev => prev.map(item => 
        item.id === sellingItem.id 
          ? { ...item, quantity: item.quantity - saleQuantity }
          : item
      ));

      // Refresh sales logs if they were already loaded
      if (salesLogs.length > 0) {
        fetchSalesLogs();
      }
      
      showToastMessage(`تم تسجيل بيع ${saleQuantity} وحدة من ${sellingItem.trade_name} بنجاح`);
      setIsSaleModalOpen(false);
      setSellingItem(null);
    } catch (error: any) {
      console.error(error);
      showToastMessage(error.message || 'فشل تسجيل عملية البيع', 'error');
    } finally {
      setSaleLoading(false);
    }
  };

  const handleInventorySave = async (data: Omit<DashboardInventoryItem, 'id' | 'medicine_id'>) => {
    try {
      // Save barcode to our "Build-as-you-go" database if it's a new barcode
      if (data.barcode) {
        await saveMedicineBarcode(data.barcode, {
          trade_name: data.trade_name,
          scientific_name: data.scientific_name,
          price: data.price
        });
      }

      if (editingItem) {
        await updateInventoryItem(editingItem.id, data);
        setInventory(prev => prev.map(item => 
          item.id === editingItem.id ? { ...item, ...data } : item
        ));
        showToastMessage('تم تحديث بيانات الدواء');
      } else {
        const newItem = await addInventoryItem(user.pharmacyId, data);
        setInventory(prev => [newItem as DashboardInventoryItem, ...prev]);
        showToastMessage('تم إضافة الدواء للمخزون');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      showToastMessage('حدث خطأ أثناء حفظ الدواء', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const itemsToAdd = results.data.map((row: any) => ({
            trade_name: row.trade_name || row['الاسم التجاري'] || '',
            scientific_name: row.scientific_name || row['الاسم العلمي'] || '',
            price: parseFloat(row.price || row['السعر'] || '0'),
            quantity: parseInt(row.quantity || row['الكمية'] || '0', 10),
            barcode: row.barcode || row['الباركود'] || ''
          })).filter(item => item.trade_name && !isNaN(item.price) && !isNaN(item.quantity));

          if (itemsToAdd.length === 0) {
            showToastMessage('الملف غير صالح. يجب أن يحتوي على الأعمدة: trade_name (الاسم التجاري), scientific_name (الاسم العلمي), price (السعر), quantity (الكمية)', 'error');
            return;
          }

          // Save any barcodes found in the Excel sheet to our database
          for (const item of itemsToAdd) {
            if (item.barcode) {
              await saveMedicineBarcode(item.barcode, {
                trade_name: item.trade_name,
                scientific_name: item.scientific_name,
                price: item.price
              });
            }
          }

          const addedItems = await bulkAddInventory(user.pharmacyId, itemsToAdd);
          setInventory(prev => [...addedItems, ...prev]);
          showToastMessage(`تم استيراد ${addedItems.length} دواء بنجاح`);
        } catch (error) {
          console.error('Bulk import error:', error);
          showToastMessage('حدث خطأ أثناء استيراد البيانات', 'error');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
        showToastMessage('خطأ في قراءة الملف', 'error');
        setIsUploading(false);
      }
    });
  };

  const lowStockItems = inventory.filter(i => i.quantity > 0 && i.quantity < 5);
  const outOfStockItems = inventory.filter(i => i.quantity === 0);

  // Check automatic hours
  const isAutomaticallyOpen = () => {
    if (!pharmacyDetails?.opening_time || !pharmacyDetails?.closing_time) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + currentMinute / 60;

    const [openHour, openMinute] = pharmacyDetails.opening_time.split(':').map(Number);
    const [closeHour, closeMinute] = pharmacyDetails.closing_time.split(':').map(Number);
    
    const openTime = openHour + openMinute / 60;
    const closeTime = closeHour + closeMinute / 60;

    if (closeTime < openTime) {
      // Crosses midnight
      return currentTime >= openTime || currentTime <= closeTime;
    }
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const autoOpenStatus = isAutomaticallyOpen();
  const isManuallyClosed = pharmacyDetails?.is_open === false;
  const displayStatus = isManuallyClosed ? false : (autoOpenStatus === false ? false : true);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <Toast message={toastMessage} type={toastType} show={showToast} onClose={() => setShowToast(false)} />

      {/* Low Stock Alert Banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="font-bold text-orange-800">تنبيهات المخزون</h3>
            <p className="text-sm text-orange-700 mt-1">
              {outOfStockItems.length > 0 && <span>يوجد {outOfStockItems.length} أدوية نفذت كميتها. </span>}
              {lowStockItems.length > 0 && <span>يوجد {lowStockItems.length} أدوية توشك على النفاد (الكمية أقل من 5).</span>}
            </p>
          </div>
        </div>
      )}

      {/* Pharmacy Header Card */}
      <div className="bg-gradient-to-l from-primary-800 to-primary-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{pharmacyDetails?.name || user.name}</h1>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm text-sm font-medium"
                  title="تعديل بيانات الصيدلية"
                >
                    <Edit2 size={16} className="text-white" />
                    <span>تعديل</span>
                </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-primary-100 font-medium">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>{pharmacyDetails?.address || user.address}</span>
              </div>
              {pharmacyDetails?.phone && (
                <div className="flex items-center gap-2 opacity-90">
                    <span>📞 {pharmacyDetails.phone}</span>
                </div>
              )}
              {pharmacyDetails?.opening_time && pharmacyDetails?.closing_time && (
                <div className="flex items-center gap-2 opacity-90 bg-white/10 px-2 py-1 rounded-md">
                    <Clock size={16} />
                    <span>ساعات العمل: {pharmacyDetails.opening_time} - {pharmacyDetails.closing_time}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Status Toggle Card */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <Power size={20} />
                <h3 className="font-bold">حالة المتجر</h3>
              </div>
              {autoOpenStatus !== null && !isManuallyClosed && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">تلقائي</span>}
              {isManuallyClosed && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">مغلق يدوياً</span>}
            </div>
            <button 
              onClick={toggleStatus}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-all
                ${displayStatus 
                  ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                  : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              title="تغيير حالة الصيدلية يدوياً"
            >
              <Power size={18} className="shrink-0" />
              <span>{displayStatus ? 'مفتوح الآن' : 'مغلق مؤقتاً'}</span>
            </button>
            {isManuallyClosed && autoOpenStatus === true && (
              <p className="text-xs text-red-500 text-center font-medium">
                المتجر مغلق يدوياً (صلاة/طوارئ). تذكر إعادة فتحه!
              </p>
            )}
         </div>

         {/* Inventory Count Card */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-primary-50 p-4 rounded-2xl text-primary-600">
              <Package size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">إجمالي الأدوية</p>
              <p className="text-3xl font-black text-gray-800">{inventory.length}</p>
            </div>
         </div>

         {/* Low Stock Card */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-orange-50 p-4 rounded-2xl text-orange-500">
              <AlertTriangle size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">نواقص المخزون</p>
              <p className="text-3xl font-black text-gray-800">{lowStockItems.length + outOfStockItems.length}</p>
            </div>
         </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
         <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
               <BarChart3 size={24} />
            </div>
            <div>
               <h2 className="text-xl font-bold text-gray-800">تحليلات المنطقة</h2>
               <p className="text-sm text-gray-500">أكثر الأدوية بحثاً من قبل المرضى في محيطك (آخر 30 يوم)</p>
            </div>
         </div>

         {analyticsLoading ? (
           <div className="flex justify-center py-10">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
         ) : topSearches.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {topSearches.map((item, idx) => {
               const isInInventory = inventory.some(i => 
                 i.trade_name.toLowerCase().includes(item.query.toLowerCase()) || 
                 i.scientific_name.toLowerCase().includes(item.query.toLowerCase())
               );
               
               return (
                 <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-xs font-bold text-indigo-600 border border-gray-100">
                       #{idx + 1}
                     </div>
                     <div>
                       <p className="font-bold text-gray-800 capitalize">{item.query}</p>
                       <div className="flex items-center gap-2 mt-0.5">
                         <TrendingUp size={12} className="text-green-500" />
                         <span className="text-[10px] text-gray-500">{item.count} عملية بحث</span>
                       </div>
                     </div>
                   </div>
                   {isInInventory ? (
                     <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">متوفر لديك</span>
                   ) : (
                     <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">غير متوفر</span>
                   )}
                 </div>
               );
             })}
           </div>
         ) : (
           <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <Search size={32} className="mx-auto text-gray-300 mb-3" />
             <p className="text-gray-500 text-sm">لا توجد بيانات بحث كافية في منطقتك حالياً</p>
           </div>
         )}
      </div>

      {/* Management Section with Tabs */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col gap-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="bg-primary-50 p-3 rounded-xl text-primary-600">
                  {activeTab === 'inventory' ? <Package size={24} /> : <History size={24} />}
               </div>
               <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {activeTab === 'inventory' ? 'إدارة المخزون' : 'سجل المبيعات'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {activeTab === 'inventory' 
                      ? 'قم بإضافة وتعديل الأدوية المتاحة لديك' 
                      : 'تتبع عمليات البيع التي تمت في صيدليتك'}
                  </p>
               </div>
            </div>
            
            {activeTab === 'inventory' && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    title="استيراد من ملف CSV"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                    ) : (
                      <Upload size={20} />
                    )}
                    <span className="hidden sm:inline">استيراد CSV</span>
                  </button>
                  <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md shadow-primary-600/20"
                  >
                    <Plus size={20} />
                    إضافة دواء
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">الأعمدة المطلوبة: trade_name, scientific_name, price, quantity (اختياري: barcode)</p>
              </div>
            )}
          </div>

          {/* Navigation Tabs and Search */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex bg-gray-50 p-1 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  activeTab === 'inventory' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={18} />
                <span>المخزون</span>
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  activeTab === 'sales' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <History size={18} />
                <span>سجل المبيعات</span>
              </button>
            </div>

            {activeTab === 'inventory' && (
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="ابحث عن دواء بالاسم التجاري أو العلمي..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-11 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {activeTab === 'inventory' ? (
          <>
            {loading ? (
              <div className="p-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary-600 mb-4"></div>
                <p className="text-gray-400 font-medium">جاري تحميل البيانات...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50/50 text-gray-500 text-sm border-y border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold">اسم الدواء</th>
                      <th className="px-6 py-4 font-bold">الاسم العلمي</th>
                      <th className="px-6 py-4 font-bold">السعر</th>
                      <th className="px-6 py-4 font-bold">الكمية</th>
                      <th className="px-6 py-4 font-bold">الحالة</th>
                      <th className="px-6 py-4 font-bold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inventory.filter(item => 
                      item.trade_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.scientific_name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                       <tr>
                         <td colSpan={6} className="px-6 py-16 text-center">
                           <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                             <Package size={48} className="opacity-20" />
                             <p>{searchQuery ? 'لا توجد نتائج تطابق بحثك' : 'لا توجد أدوية في المخزون حالياً'}</p>
                             {!searchQuery && (
                               <button onClick={handleAddClick} className="text-primary-600 font-bold text-sm hover:underline">
                                  أضف أول دواء
                               </button>
                             )}
                           </div>
                         </td>
                       </tr>
                    ) : (
                      inventory
                        .filter(item => 
                          item.trade_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.scientific_name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => {
                        const isLowStock = item.quantity > 0 && item.quantity < 5;
                        const isOutOfStock = item.quantity === 0;
                        
                        return (
                          <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors group ${isLowStock ? 'bg-orange-50/30' : ''} ${isOutOfStock ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-4 font-bold text-gray-800">{item.trade_name}</td>
                            <td className="px-6 py-4 text-gray-500">{item.scientific_name}</td>
                            <td className="px-6 py-4 font-medium text-primary-700">{item.price} د.ع</td>
                            <td className={`px-6 py-4 font-medium ${isLowStock ? 'text-orange-600 font-bold' : ''} ${isOutOfStock ? 'text-red-600 font-bold' : ''}`}>
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                  نفذت الكمية
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                  كمية قليلة
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                  متوفر
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleSaleClick(item)}
                                  disabled={item.quantity === 0}
                                  className={`p-2 rounded-lg transition-colors ${item.quantity === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50 text-green-600'}`}
                                  title="تسجيل بيع"
                                >
                                  <ShoppingCart size={16} />
                                </button>
                                <button 
                                  onClick={() => handleEditClick(item)}
                                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                  title="تعديل"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteClick(item.id)}
                                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {salesLoading ? (
              <div className="p-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary-600 mb-4"></div>
                <p className="text-gray-400 font-medium">جاري تحميل سجل المبيعات...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50/50 text-gray-500 text-sm border-y border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold">التاريخ</th>
                      <th className="px-6 py-4 font-bold">الدواء</th>
                      <th className="px-6 py-4 font-bold">الكمية</th>
                      <th className="px-6 py-4 font-bold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {salesLogs.length === 0 ? (
                       <tr>
                         <td colSpan={4} className="px-6 py-16 text-center">
                           <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                             <ShoppingCart size={48} className="opacity-20" />
                             <p>لا توجد عمليات بيع مسجلة حالياً</p>
                           </div>
                         </td>
                       </tr>
                    ) : (
                      salesLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {new Date(log.created_at).toLocaleString('ar-SA')}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800">{log.trade_name}</p>
                            <p className="text-xs text-gray-400">{log.scientific_name}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">
                            {log.quantity} وحدات
                          </td>
                          <td className="px-6 py-4 font-bold text-primary-700">
                            {log.total_price} د.ع
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        onSave={handleInventorySave}
        initialData={editingItem}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleProfileUpdate}
        initialData={pharmacyDetails}
      />

      {/* Sale Modal */}
      {isSaleModalOpen && sellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-primary-600 p-2 rounded-xl text-white">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">تسجيل عملية بيع</h3>
                  <p className="text-xs text-gray-500">{sellingItem.trade_name}</p>
                </div>
              </div>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">السعر للوحدة:</span>
                  <span className="font-bold text-primary-700">{sellingItem.price} د.ع</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">المتوفر حالياً:</span>
                  <span className="font-bold text-gray-800">{sellingItem.quantity} وحدة</span>
                </div>
              </div>

              <label className="block text-sm font-bold text-gray-700 mb-3">الكمية المباعة:</label>
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setSaleQuantity(prev => Math.max(1, prev - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
                >
                  <Minus size={20} />
                </button>
                <input 
                  type="number" 
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(Math.min(sellingItem.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-grow h-12 text-center text-xl font-bold bg-white border-2 border-gray-100 rounded-xl focus:border-primary-500 outline-none transition-all"
                />
                <button 
                  onClick={() => setSaleQuantity(prev => Math.min(sellingItem.quantity, prev + 1))}
                  className="w-12 h-12 flex items-center justify-center bg-primary-100 hover:bg-primary-200 rounded-xl text-primary-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex justify-between items-center p-4 bg-primary-600 rounded-2xl text-white mb-8">
                <span className="font-medium">الإجمالي:</span>
                <span className="text-2xl font-black">{(saleQuantity * sellingItem.price).toFixed(2)} د.ع</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsSaleModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleRecordSale}
                  disabled={saleLoading}
                  className="flex-[2] py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saleLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  تأكيد البيع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
