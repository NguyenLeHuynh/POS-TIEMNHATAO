import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { 
  ShoppingCart, FileText, Printer, Plus, Minus, Trash2, 
  Search, QrCode, Package, UserCheck, Users, LogOut, Edit3, 
  AlertTriangle, Eye, Download, Send, X, FolderPlus, Menu, RefreshCw, CheckCircle2, AlertCircle, UploadCloud
} from 'lucide-react';

// 🔴 DÁN TRỰC TIẾP URL VÀ ANON KEY CHUẨN CỦA SUPABASE VÀO 2 DÒNG NÀY:
const DIRECT_SUPABASE_URL = 'https://wnkybaylqkiimzrjmawv.supabase.co';
const DIRECT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3liYXlscWtpaW16cmptYXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MzEwMDIsImV4cCI6MjEwODIwNzAwMn0.4OMkGtTs2Z_z5Kz1Ba71ML23BpMlJsza0QYlYj2-rjs';

const supabaseUrl = (DIRECT_SUPABASE_URL && !DIRECT_SUPABASE_URL.includes('DÁN_')) ? DIRECT_SUPABASE_URL : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (DIRECT_SUPABASE_KEY && !DIRECT_SUPABASE_KEY.includes('DÁN_')) ? DIRECT_SUPABASE_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// THÔNG TIN TÀI KHOẢN MBBANK CỦA CHỦ QUÁN
const BANK_CONFIG = {
  BANK_ID: 'MB',
  ACCOUNT_NO: '16112266889999',
  ACCOUNT_NAME: 'NGUYEN LE HUYNH'
};

// 🟢 DỮ LIỆU MẶC ĐỊNH CHỐNG TRẮNG MÀN HÌNH
const DEFAULT_CATEGORIES = ['Tất cả', 'Matcha Series', 'Cà Phê Măng Đen', 'Trà & Latte', 'Bánh Sweet'];
const DEFAULT_PRODUCTS = [
  { name: 'Matcha Latte Premium', price: 45000, category: 'Matcha Series', image: '🍵', stock: 45, is_available: true },
  { name: 'Matcha Coco Espresso', price: 52000, category: 'Matcha Series', image: '🥥', stock: 28, is_available: true },
  { name: 'Matcha Foam Kem Trứng', price: 49000, category: 'Matcha Series', image: '🍦', stock: 15, is_available: true },
  { name: 'Cà Phê Sữa Đá Măng Đen', price: 29000, category: 'Cà Phê Măng Đen', image: '☕', stock: 99, is_available: true },
  { name: 'Bạc Xỉu Sữa Hạnh Nhân', price: 35000, category: 'Cà Phê Măng Đen', image: '🥤', stock: 60, is_available: true },
  { name: 'Trà Ô Long Sữa Nướng', price: 39000, category: 'Trà & Latte', image: '🧋', stock: 35, is_available: true }
];
const DEFAULT_INVENTORY = [
  { name: 'Bột Matcha Uji Grade A', quantity: 12.5, unit: 'kg', min_quantity: 3 },
  { name: 'Hạt Cà Phê Măng Đen', quantity: 25, unit: 'kg', min_quantity: 5 },
  { name: 'Sữa Tươi Thanh Trùng', quantity: 40, unit: 'hộp', min_quantity: 10 }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [cloudStatusMsg, setCloudStatusMsg] = useState('');

  const [activeTab, setActiveTab] = useState('pos');
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showQRModal, setShowQRModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
  const [staffList, setStaffList] = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);
  const [issueReports, setIssueReports] = useState([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [reprintOrder, setReprintOrder] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showInvModal, setShowInvModal] = useState(false);
  const [newInvItem, setNewInvItem] = useState({ name: '', quantity: 10, unit: 'kg', min_quantity: 3 });

  const [taxStartDate, setTaxStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [taxEndDate, setTaxEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxPreviewData, setTaxPreviewData] = useState([]);

  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueContent, setNewIssueContent] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUser, setNewStaffUser] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
    }
    testCloudConnection();
    loadAllData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      loadAllData();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser, activeTab]);

  useEffect(() => {
    generateTaxPreview();
  }, [taxStartDate, taxEndDate, todayOrders]);

  const testCloudConnection = async () => {
    if (!supabase) {
      setCloudStatusMsg('🔴 Chưa dán Key Supabase ở dòng 12, 13!');
      return;
    }
    try {
      const { data, error } = await supabase.from('staff').select('id').limit(1);
      if (error) {
        setCloudStatusMsg(`⚠️ Lỗi kết nối Supabase: ${error.message}`);
      } else {
        setCloudStatusMsg('🟢 Cloud Ready (Đã kết nối thành công!)');
      }
    } catch (e) {
      setCloudStatusMsg('🔴 Lỗi kết nối mạng Cloud!');
    }
  };

  const loadAllData = async () => {
    setIsSyncing(true);
    try {
      if (supabase) {
        const { data: cloudProducts } = await supabase.from('products').select('*');
        if (cloudProducts && cloudProducts.length > 0) setProducts(cloudProducts);

        const { data: cloudCat } = await supabase.from('categories').select('*');
        if (cloudCat && cloudCat.length > 0) {
          const names = cloudCat.map(c => c.name);
          setCategories(['Tất cả', ...new Set(names)]);
        }

        const { data: cloudStaff } = await supabase.from('staff').select('*');
        if (cloudStaff) setStaffList(cloudStaff);

        const { data: cloudOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (cloudOrders) {
          const todayStr = new Date().toLocaleDateString('vi-VN');
          const filtered = cloudOrders.filter(ord => new Date(ord.created_at).toLocaleDateString('vi-VN') === todayStr);
          setTodayOrders(filtered);
        }

        const { data: cloudInv } = await supabase.from('inventory').select('*');
        if (cloudInv && cloudInv.length > 0) setInventory(cloudInv);

        const { data: cloudIssues } = await supabase.from('issue_reports').select('*').order('created_at', { ascending: false });
        if (cloudIssues) setIssueReports(cloudIssues);
      }
    } catch (err) {
      console.warn('Sử dụng dữ liệu dự phòng:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 📤 ÉP ĐẨY DỮ LIỆU CÓ LỌC ID SỐ (CHỐNG LỖI UUID)
  const pushLocalToCloud = async () => {
    if (!supabase) return alert('Chưa kết nối Supabase!');
    setIsSyncing(true);
    try {
      for (const cat of DEFAULT_CATEGORIES.filter(c => c !== 'Tất cả')) {
        await supabase.from('categories').upsert([{ name: cat }], { onConflict: 'name' });
      }
      for (const p of DEFAULT_PRODUCTS) {
        await supabase.from('products').insert([{
          name: p.name,
          price: p.price,
          category: p.category,
          image: p.image,
          stock: p.stock,
          is_available: true
        }]);
      }
      for (const inv of DEFAULT_INVENTORY) {
        await supabase.from('inventory').insert([{
          name: inv.name,
          quantity: inv.quantity,
          unit: inv.unit,
          min_quantity: inv.min_quantity
        }]);
      }
      alert('✅ Đã khởi tạo thành công dữ liệu mẫu lên Cloud Supabase!');
      await loadAllData();
    } catch (err) {
      alert(`⚠️ Lỗi đẩy dữ liệu: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // ĐĂNG NHẬP
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginUser === 'admin' && loginPass === '123456') {
      const user = { full_name: 'Chủ Quán (Admin)', username: 'admin', role: 'OWNER' };
      setCurrentUser(user);
      localStorage.setItem('pos_current_user', JSON.stringify(user));
      return;
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from('staff').select('*').eq('username', loginUser).eq('password', loginPass).single();
        if (data && !error) {
          const user = { full_name: data.full_name, username: data.username, role: data.role };
          setCurrentUser(user);
          localStorage.setItem('pos_current_user', JSON.stringify(user));
          return;
        }
      } catch (err) {}
    }

    setLoginError('Tài khoản hoặc mật khẩu không chính xác!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setCart([]);
  };

  // 🟢 CẤP TÀI KHOẢN NHÂN VIÊN (ĐÃ BỎ ID SỐ ĐỂ TRÁNH LỖI UUID)
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffUser || !newStaffPass) return alert('Nhập đủ thông tin!');

    if (!supabase) return alert('Chưa kết nối Cloud Supabase!');

    // LÀM SẠCH PAYLOAD: BẢO ĐẢM KHÔNG TRUYỀN ID CỤC BỘ DẠNG SỐ "1"
    const cleanStaffPayload = {
      full_name: newStaffName,
      username: newStaffUser.trim(),
      password: newStaffPass.trim(),
      role: 'STAFF'
    };

    const { error } = await supabase.from('staff').insert([cleanStaffPayload]);

    if (error) {
      alert(`⚠️ Lỗi Cloud Supabase: ${error.message}`);
    } else {
      alert(`✅ Đã cấp thành công tài khoản "${newStaffName}" lên Cloud!`);
      setNewStaffName(''); setNewStaffUser(''); setNewStaffPass('');
      loadAllData();
    }
  };

  const handleDeleteStaff = async (username) => {
    if (!window.confirm('Xóa nhân viên này?')) return;
    if (supabase) {
      await supabase.from('staff').delete().eq('username', username);
      loadAllData();
    }
  };

  // QUẢN LÝ MÓN NƯỚC (LOẠI BỎ ID SỐ CHỐNG LỖI UUID)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) return;

    if (supabase) {
      const cleanProduct = {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        category: editingProduct.category,
        image: editingProduct.image,
        stock: Number(editingProduct.stock) || 50,
        is_available: true
      };

      // Chỉ dùng UPDATE nếu ID đúng định dạng UUID (độ dài > 20)
      if (editingProduct.id && typeof editingProduct.id === 'string' && editingProduct.id.length > 20) {
        await supabase.from('products').update(cleanProduct).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert([cleanProduct]);
      }
    }

    setShowProductModal(false);
    setEditingProduct(null);
    loadAllData();
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Xóa món này khỏi menu?')) return;
    if (supabase) {
      await supabase.from('products').delete().eq('id', id);
      loadAllData();
    }
  };

  // DANH MỤC MÓN
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (supabase) {
      await supabase.from('categories').insert([{ name: newCatName.trim() }]);
      setNewCatName('');
      loadAllData();
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (catName === 'Tất cả') return alert('Không thể xóa danh mục này!');
    if (!window.confirm(`Xóa danh mục "${catName}"?`)) return;
    if (supabase) {
      await supabase.from('categories').delete().eq('name', catName);
      if (selectedCategory === catName) setSelectedCategory('Tất cả');
      loadAllData();
    }
  };

  // POS CART & CHECKOUT
  const filteredProducts = products.filter(item => {
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    if (!product.is_available || product.stock <= 0) return alert('Món này hết hàng!');
    const exist = cart.find(x => x.name === product.name);
    if (exist) {
      setCart(cart.map(x => x.name === product.name ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...product, qty: 1, note: '' }]);
    }
  };

  const updateQty = (name, delta) => {
    setCart(cart.map(item => {
      if (item.name === name) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = (subTotal * discountPercent) / 100;
  const finalTotal = Math.max(0, subTotal - discountAmount);

  const dynamicQrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.BANK_ID}-${BANK_CONFIG.ACCOUNT_NO}-compact2.png?amount=${finalTotal}&addInfo=TiemNhaTao%20HD&accountName=${encodeURIComponent(BANK_CONFIG.ACCOUNT_NAME)}`;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Chưa chọn món nào!');
    if (paymentMethod === 'TRANSFER' && !showQRModal) {
      setShowQRModal(true);
      return;
    }

    const orderCode = `HD${Date.now().toString().slice(-6)}`;
    const orderPayload = {
      code: orderCode,
      created_at: new Date().toISOString(),
      total_amount: finalTotal,
      sub_total: subTotal,
      discount_amount: discountAmount,
      cash_amount: paymentMethod === 'CASH' ? finalTotal : 0,
      transfer_amount: paymentMethod === 'TRANSFER' ? finalTotal : 0,
      payment_method: paymentMethod,
      staff_name: currentUser.full_name,
      items_json: JSON.stringify(cart)
    };

    if (supabase) {
      await supabase.from('orders').insert([orderPayload]);
    }

    setReprintOrder(null);
    setTimeout(() => { window.print(); }, 100);

    setCart([]);
    setShowQRModal(false);
    setShowCartModal(false);
    setDiscountPercent(0);
    loadAllData();
  };

  const generateTaxPreview = () => {
    const dailyMap = {};
    todayOrders.forEach(ord => {
      const displayDate = new Date(ord.created_at).toLocaleDateString('vi-VN');
      if (!dailyMap[displayDate]) dailyMap[displayDate] = { cash: 0, transfer: 0, total: 0 };
      dailyMap[displayDate].cash += Number(ord.cash_amount || 0);
      dailyMap[displayDate].transfer += Number(ord.transfer_amount || 0);
      dailyMap[displayDate].total += Number(ord.total_amount || 0);
    });

    const list = Object.keys(dailyMap).sort().map((date, idx) => ({
      stt: idx + 1,
      date,
      cash: dailyMap[date].cash,
      transfer: dailyMap[date].transfer,
      total: dailyMap[date].total
    }));

    setTaxPreviewData(list);
  };

  const todayCash = todayOrders.reduce((sum, ord) => sum + Number(ord.cash_amount || 0), 0);
  const todayTransfer = todayOrders.reduce((sum, ord) => sum + Number(ord.transfer_amount || 0), 0);
  const todayTotal = todayCash + todayTransfer;

  // 🔴 MÀN HÌNH ĐĂNG NHẬP
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">🍵</div>
            <h1 className="text-2xl font-extrabold text-gray-900">TIỆM NHÀ TÁO POS</h1>
            <p className="text-xs text-gray-500 font-medium">Đăng nhập tài khoản Quản lý / Nhân viên</p>

            <div className="pt-1">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${cloudStatusMsg.includes('🟢') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <span>{cloudStatusMsg || 'Đang kiểm tra kết nối...'}</span>
              </div>
            </div>
          </div>

          {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center border border-red-200">⚠️ {loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Tên đăng nhập:</label>
              <input type="text" required placeholder="Nhập tài khoản..." value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-600 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Mật khẩu:</label>
              <input type="password" required placeholder="Nhập mật khẩu..." value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-600 outline-none" />
            </div>
            <button type="submit" className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-lg transition-all">ĐĂNG NHẬP POS</button>
          </form>
          <div className="text-center text-[11px] text-gray-400">Tài khoản Chủ Quán mặc định: <span className="font-bold text-gray-600">admin / 123456</span></div>
        </div>
      </div>
    );
  }

  // 🟢 MÀN HÌNH CHÍNH
  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden relative">
      
      {showLeftMenu && (
        <div onClick={() => setShowLeftMenu(false)} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
      )}

      {/* SIDEBAR MENU */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300 ${showLeftMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-lg shadow-lg">🍵</div>
              <div>
                <h1 className="font-extrabold text-sm text-white">TIỆM NHÀ TÁO</h1>
                <span className="text-[9px] text-emerald-400 font-semibold uppercase">Matcha & Coffee POS</span>
              </div>
            </div>
            <button onClick={() => setShowLeftMenu(false)} className="p-1.5 text-gray-400 hover:text-white"><X size={20} /></button>
          </div>

          <nav className="p-3 space-y-1.5">
            <button onClick={() => { setActiveTab('pos'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${activeTab === 'pos' ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:bg-slate-800'}`}><ShoppingCart size={16} /> <span>1. POS Gọi Món</span></button>
            <button onClick={() => { setActiveTab('daily_report'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${activeTab === 'daily_report' ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:bg-slate-800'}`}><FileText size={16} /> <span>2. Doanh Thu Ngày</span></button>
            <button onClick={() => { setActiveTab('staff_issue'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${activeTab === 'staff_issue' ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:bg-slate-800'}`}><AlertTriangle size={16} /> <span>3. Hòm Thư Sự Cố</span></button>
            {currentUser.role === 'OWNER' && (
              <>
                <button onClick={() => { setActiveTab('inventory'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${activeTab === 'inventory' ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:bg-slate-800'}`}><Package size={16} /> <span>4. Quản Lý Tồn Kho</span></button>
                <button onClick={() => { setActiveTab('staff_mgr'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${activeTab === 'staff_mgr' ? 'bg-emerald-700 text-white' : 'text-gray-400 hover:bg-slate-800'}`}><Users size={16} /> <span>5. Cấp Quyền Nhân Viên</span></button>
              </>
            )}
          </nav>
        </div>

        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">{currentUser.full_name}</div>
            <div className="text-[10px] text-emerald-400 uppercase font-semibold">{currentUser.role === 'OWNER' ? '👑 Chủ Quán' : '👤 Nhân Viên'}</div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        
        <header className="h-14 md:h-16 bg-white border-b px-3 md:px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLeftMenu(true)} className="p-2 rounded-xl bg-slate-900 text-white flex items-center gap-1.5"><Menu size={18} /><span className="text-xs font-bold hidden sm:inline">Menu</span></button>
            <h2 className="text-sm md:text-base font-bold text-gray-800">
              {activeTab === 'pos' && '🛒 POS Gọi Món'}
              {activeTab === 'daily_report' && '📊 Doanh Thu'}
              {activeTab === 'inventory' && '📦 Tồn Kho'}
              {activeTab === 'staff_mgr' && '👥 Nhân Viên'}
              {activeTab === 'staff_issue' && '💬 Sự Cố'}
            </h2>

            {currentUser.role === 'OWNER' && (
              <button onClick={pushLocalToCloud} className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-600 text-white flex items-center gap-1 shadow">
                <UploadCloud size={13} /> <span className="hidden sm:inline">Khởi Tạo Cloud</span>
              </button>
            )}

            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 flex items-center gap-1">
              <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Syncing</span>
            </div>
          </div>

          {activeTab === 'pos' && (
            <div className="flex items-center gap-2">
              {currentUser.role === 'OWNER' && (
                <button onClick={() => { setEditingProduct({ name: '', price: 35000, category: categories[1] || 'Matcha Series', image: '🍵', stock: 50 }); setShowProductModal(true); }} className="bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Plus size={14} /> <span className="hidden sm:inline">Thêm Món</span>
                </button>
              )}
              <div className="relative w-36 sm:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Tìm món..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-7 pr-3 py-1 bg-gray-100 rounded-full text-xs font-medium outline-none" />
              </div>
            </div>
          )}
        </header>

        {/* 1. MÀN HÌNH POS */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 p-3 md:p-6 overflow-y-auto flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1 items-center">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${selectedCategory === cat ? 'bg-amber-800 text-white' : 'bg-white text-gray-600 border'}`}>
                    {cat}
                  </button>
                ))}
                {currentUser.role === 'OWNER' && (
                  <button onClick={() => setShowCategoryModal(true)} className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border flex items-center gap-1"><FolderPlus size={13} /> Danh mục</button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-24">
                {filteredProducts.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white rounded-2xl p-3 border shadow-sm flex flex-col justify-between relative hover:border-emerald-500">
                    {currentUser.role === 'OWNER' && (
                      <div className="absolute top-1.5 right-1.5 flex gap-1 z-10 bg-white/80 rounded-lg p-1">
                        <button onClick={() => { setEditingProduct(item); setShowProductModal(true); }} className="p-1 text-blue-600"><Edit3 size={11} /></button>
                        <button onClick={() => handleDeleteProduct(item.id)} className="p-1 text-red-600"><Trash2 size={11} /></button>
                      </div>
                    )}
                    <div onClick={() => addToCart(item)} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl md:text-3xl p-1 bg-emerald-50 rounded-xl">{item.image}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700">Kho: {item.stock}</span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-1">{item.name}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.category}</p>
                    </div>
                    <div onClick={() => addToCart(item)} className="mt-2.5 pt-2 border-t flex items-center justify-between cursor-pointer">
                      <span className="font-extrabold text-emerald-800 text-xs md:text-sm">{item.price.toLocaleString()} đ</span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><Plus size={14} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* THANH GIỎ HÀNG */}
            <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-2xl z-30 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="relative bg-emerald-600 p-2.5 rounded-xl">
                  <ShoppingCart size={20} />
                  {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((s, x) => s + x.qty, 0)}</span>}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-emerald-400">{finalTotal.toLocaleString()} VNĐ</div>
                  <div className="text-[10px] text-gray-400">{cart.length === 0 ? 'Chưa chọn món' : `Đã chọn ${cart.length} món`}</div>
                </div>
              </div>
              <button onClick={() => { if (cart.length === 0) return alert('Chưa chọn món!'); setShowCartModal(true); }} className="px-5 py-2.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-2">
                <Printer size={16} /> THANH TOÁN
              </button>
            </div>
          </div>
        )}

        {/* 2. DOANH THU */}
        {activeTab === 'daily_report' && (
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
            <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-gray-800">Doanh Thu Hôm Nay</h3>
                <button onClick={() => window.print()} className="bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"><Printer size={14} /> In Báo Cáo</button>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-emerald-50 p-3 rounded-xl border"><div className="text-[11px] text-emerald-800 font-bold">💵 Tiền Mặt</div><div className="text-base font-extrabold text-emerald-700">{todayCash.toLocaleString()} đ</div></div>
                <div className="bg-blue-50 p-3 rounded-xl border"><div className="text-[11px] text-blue-800 font-bold">💳 Chuyển Khoản</div><div className="text-base font-extrabold text-blue-700">{todayTransfer.toLocaleString()} đ</div></div>
                <div className="bg-amber-50 p-3 rounded-xl border"><div className="text-[11px] text-amber-800 font-bold">🔥 TỔNG CỘNG</div><div className="text-base font-extrabold text-amber-800">{todayTotal.toLocaleString()} đ</div></div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NHÂN VIÊN */}
        {activeTab === 'staff_mgr' && currentUser.role === 'OWNER' && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto space-y-4">
            <div className="bg-white rounded-2xl p-4 border shadow-xl space-y-3">
              <h3 className="font-bold text-gray-800 text-xs md:text-sm">Cấp Tài Khoản Nhân Viên</h3>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input type="text" required placeholder="Họ tên" value={newStaffName} onChange={(e)=>setNewStaffName(e.target.value)} className="border rounded-xl p-2 text-xs font-semibold outline-none" />
                <input type="text" required placeholder="Tên đăng nhập" value={newStaffUser} onChange={(e)=>setNewStaffUser(e.target.value)} className="border rounded-xl p-2 text-xs font-semibold outline-none" />
                <input type="password" required placeholder="Mật khẩu" value={newStaffPass} onChange={(e)=>setNewStaffPass(e.target.value)} className="border rounded-xl p-2 text-xs font-semibold outline-none" />
                <div className="sm:col-span-3"><button type="submit" className="bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs">+ Cấp Tài Khoản</button></div>
              </form>
            </div>
            <div className="bg-white rounded-2xl p-4 border shadow-xl space-y-3">
              <h3 className="font-bold text-gray-800 text-xs">Danh Sách Nhân Viên</h3>
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 font-bold border-b"><tr><th className="p-2.5">Họ Tên</th><th className="p-2.5">Tài Khoản</th><th className="p-2.5">Thao tác</th></tr></thead>
                <tbody className="divide-y">{staffList.map((s, idx) => (<tr key={idx}><td className="p-2.5 font-bold">{s.full_name}</td><td className="p-2.5 text-emerald-700">{s.username}</td><td className="p-2.5"><button onClick={() => handleDeleteStaff(s.username)} className="text-red-500 font-bold">Xóa</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* POPUP THANH TOÁN */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-gray-800">Xác Nhận Đơn Hàng</h3>
              <button onClick={() => setShowCartModal(false)}><X size={20} /></button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 border-b pb-3">
              {cart.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-gray-50 rounded-2xl border flex justify-between items-center text-xs font-bold">
                  <div><div>{item.name}</div><div className="text-[10px] text-emerald-700">{item.price.toLocaleString()} đ</div></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.name, -1)} className="w-6 h-6 border bg-white rounded">-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.name, 1)} className="w-6 h-6 border bg-white rounded">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-base font-extrabold"><span>Tổng thanh toán:</span><span className="text-emerald-700">{finalTotal.toLocaleString()} VNĐ</span></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentMethod('CASH')} className={`py-2 rounded-xl text-xs font-bold border ${paymentMethod === 'CASH' ? 'bg-emerald-700 text-white' : 'bg-white'}`}>💵 Tiền Mặt</button>
              <button onClick={() => setPaymentMethod('TRANSFER')} className={`py-2 rounded-xl text-xs font-bold border ${paymentMethod === 'TRANSFER' ? 'bg-emerald-700 text-white' : 'bg-white'}`}>💳 Chuyển Khoản</button>
            </div>
            <button onClick={handleCheckout} className="w-full py-3 bg-amber-800 text-white font-extrabold rounded-xl text-xs">HOÀN TẤT & IN BILL</button>
          </div>
        </div>
      )}

      {/* POPUP VIETQR */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full text-center space-y-3">
            <h3 className="font-bold text-sm">Quét Mã VietQR MBBank</h3>
            <img src={dynamicQrUrl} alt="VietQR" className="w-44 h-44 mx-auto rounded-xl border" />
            <div className="font-extrabold text-emerald-700 text-sm">{finalTotal.toLocaleString()} VNĐ</div>
            <button onClick={handleCheckout} className="w-full py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs">Đã Nhận Tiền</button>
          </div>
        </div>
      )}

      {/* POPUP THÊM MÓN */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-3">
            <h3 className="font-bold text-sm text-gray-800">{editingProduct.id ? 'Sửa Món' : 'Thêm Món Mới'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-2 text-xs">
              <input type="text" required placeholder="Tên món" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full border rounded-xl p-2 font-semibold" />
              <input type="number" required placeholder="Giá" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} className="w-full border rounded-xl p-2 font-semibold" />
              <select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full border rounded-xl p-2 font-semibold">
                {categories.filter(c => c !== 'Tất cả').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-2 border rounded-xl font-bold">Hủy</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-700 text-white rounded-xl font-bold">Lưu Món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KHU VỰC IN BILL */}
      <div id="print-area" className="hidden print:block p-2 text-[11px] font-mono">
        <div className="text-center font-extrabold uppercase">TIỆM NHÀ TÁO POS</div>
        <div className="border-b border-black my-1 border-dashed"></div>
        <div className="flex justify-between font-bold"><span>TỔNG TIỀN:</span><span>{finalTotal.toLocaleString()} đ</span></div>
      </div>

    </div>
  );
}
