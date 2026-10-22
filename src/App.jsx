import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { localDb } from './db';
import * as XLSX from 'xlsx';
import { 
  ShoppingCart, FileText, Printer, Plus, Minus, Trash2, 
  Search, QrCode, Package, UserCheck, Users, LogOut, Edit3, 
  AlertTriangle, Calendar, Eye, Download, Send, Settings, Check, X, FolderPlus
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// THÔNG TIN TÀI KHOẢN MBBANK CỦA CHỦ QUÁN
const BANK_CONFIG = {
  BANK_ID: 'MB',
  ACCOUNT_NO: '16112266889999',
  ACCOUNT_NAME: 'NGUYEN LE HUYNH'
};

export default function App() {
  // 🟢 TRẠNG THÁI TÀI KHOẢN & ĐĂNG NHẬP
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // 🟢 TRẠNG THÁI POS & GIỎ HÀNG
  const [activeTab, setActiveTab] = useState('pos');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showQRModal, setShowQRModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  // 🟢 QUẢN LÝ DANH MỤC ĐỘNG
  const [categories, setCategories] = useState(['Tất cả']);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // 🟢 LỊCH SỬ BILL & XEM CHI TIẾT
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [reprintOrder, setReprintOrder] = useState(null);

  // 🟢 DANH SÁCH MÓN NƯỚC & KHO
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // 🟢 QUẢN LÝ KHO NGUYÊN LIỆU
  const [inventory, setInventory] = useState([]);
  const [showInvModal, setShowInvModal] = useState(false);
  const [newInvItem, setNewInvItem] = useState({ name: '', quantity: 10, unit: 'kg', min_quantity: 3 });

  // 🟢 KÊ KHAI THUẾ TT88
  const [taxStartDate, setTaxStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [taxEndDate, setTaxEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxPreviewData, setTaxPreviewData] = useState([]);

  // 🟢 BÁO CÁO TÌNH TRẠNG QUÁN & NHÂN VIÊN
  const [issueReports, setIssueReports] = useState([]);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueContent, setNewIssueContent] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUser, setNewStaffUser] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [todayOrders, setTodayOrders] = useState([]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    initData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  useEffect(() => {
    generateTaxPreview();
  }, [taxStartDate, taxEndDate]);

  const initData = async () => {
    // Khởi tạo danh mục mặc định nếu trống
    const existingCat = await localDb.categories.toArray();
    if (existingCat.length === 0) {
      const defaultCat = [
        { name: 'Matcha Series' },
        { name: 'Cà Phê Măng Đen' },
        { name: 'Trà & Latte' },
        { name: 'Bánh Sweet' }
      ];
      await localDb.categories.bulkAdd(defaultCat);
    }

    const existingProducts = await localDb.products.toArray();
    if (existingProducts.length === 0) {
      const defaultProducts = [
        { id: '1', name: 'Matcha Latte Premium', price: 45000, category: 'Matcha Series', image: '🍵', stock: 45, is_available: true },
        { id: '2', name: 'Matcha Coco Espresso', price: 52000, category: 'Matcha Series', image: '🥥', stock: 28, is_available: true },
        { id: '3', name: 'Matcha Foam Kem Trứng', price: 49000, category: 'Matcha Series', image: '🍦', stock: 15, is_available: true },
        { id: '4', name: 'Cà Phê Sữa Đá Măng Đen', price: 29000, category: 'Cà Phê Măng Đen', image: '☕', stock: 99, is_available: true },
        { id: '5', name: 'Bạc Xỉu Sữa Hạnh Nhân', price: 35000, category: 'Cà Phê Măng Đen', image: '🥤', stock: 60, is_available: true },
        { id: '6', name: 'Trà Ô Long Sữa Nướng', price: 39000, category: 'Trà & Latte', image: '🧋', stock: 35, is_available: true }
      ];
      await localDb.products.bulkAdd(defaultProducts);
    }

    const existingInv = await localDb.inventory.toArray();
    if (existingInv.length === 0) {
      const defaultInv = [
        { name: 'Bột Matcha Uji Grade A', quantity: 12.5, unit: 'kg', min_quantity: 3 },
        { name: 'Hạt Cà Phê Măng Đen', quantity: 25, unit: 'kg', min_quantity: 5 },
        { name: 'Sữa Tươi Thanh Trùng', quantity: 40, unit: 'hộp', min_quantity: 10 }
      ];
      await localDb.inventory.bulkAdd(defaultInv);
    }
  };

  const loadAllData = async () => {
    const catList = await localDb.categories.toArray();
    setCategories(['Tất cả', ...catList.map(c => c.name)]);

    setProducts(await localDb.products.toArray());
    setInventory(await localDb.inventory.toArray());
    setStaffList(await localDb.staff.toArray());
    const issueList = await localDb.issue_reports.toArray();
    setIssueReports(issueList.reverse());
    fetchTodayOrders();
  };

  // 📂 QUẢN LÝ THÊM & XÓA DANH MỤC MON
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    if (categories.includes(name)) return alert('Danh mục này đã tồn tại!');

    await localDb.categories.add({ name });
    setNewCatName('');
    loadAllData();
  };

  const handleDeleteCategory = async (catName) => {
    if (catName === 'Tất cả') return alert('Không thể xóa danh mục này!');
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${catName}"?`)) return;

    const catObj = await localDb.categories.where('name').equals(catName).first();
    if (catObj) {
      await localDb.categories.delete(catObj.id);
      if (selectedCategory === catName) setSelectedCategory('Tất cả');
      loadAllData();
    }
  };

  // Đăng Nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginUser === 'admin' && loginPass === '123456') {
      const user = { full_name: 'Chủ Quán (Admin)', username: 'admin', role: 'OWNER' };
      setCurrentUser(user);
      localStorage.setItem('pos_current_user', JSON.stringify(user));
      return;
    }

    const localStaff = await localDb.staff.where('username').equals(loginUser).first();
    if (localStaff && localStaff.password === loginPass) {
      const user = { full_name: localStaff.full_name, username: localStaff.username, role: localStaff.role };
      setCurrentUser(user);
      localStorage.setItem('pos_current_user', JSON.stringify(user));
      return;
    }

    try {
      const { data } = await supabase.from('staff').select('*').eq('username', loginUser).eq('password', loginPass).single();
      if (data) {
        const user = { full_name: data.full_name, username: data.username, role: data.role };
        setCurrentUser(user);
        localStorage.setItem('pos_current_user', JSON.stringify(user));
        return;
      }
    } catch (err) {}

    setLoginError('Tài khoản hoặc mật khẩu không chính xác!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setCart([]);
  };

  // Cấp Tài Khoản
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffUser || !newStaffPass) return alert('Vui lòng nhập đủ thông tin!');

    const newStaffObj = {
      full_name: newStaffName,
      username: newStaffUser.trim(),
      password: newStaffPass.trim(),
      role: 'STAFF'
    };

    await localDb.staff.add(newStaffObj);
    try { await supabase.from('staff').insert([newStaffObj]); } catch (err) {}

    alert(`Đã cấp tài khoản thành công cho nhân viên: ${newStaffName}!`);
    setNewStaffName(''); setNewStaffUser(''); setNewStaffPass('');
    loadAllData();
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    await localDb.staff.delete(id);
    loadAllData();
  };

  // Món Nước CRUD
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) return;

    if (editingProduct.id) {
      await localDb.products.put(editingProduct);
    } else {
      const newP = { ...editingProduct, id: Date.now().toString(), stock: Number(editingProduct.stock) || 50, is_available: true };
      await localDb.products.add(newP);
    }

    setShowProductModal(false);
    setEditingProduct(null);
    loadAllData();
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa món nước này khỏi menu?')) return;
    await localDb.products.delete(id);
    loadAllData();
  };

  // Kho Nguyên Liệu
  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!newInvItem.name) return;
    const item = { ...newInvItem, quantity: Number(newInvItem.quantity), min_quantity: Number(newInvItem.min_quantity) };
    await localDb.inventory.add(item);
    setNewInvItem({ name: '', quantity: 10, unit: 'kg', min_quantity: 3 });
    setShowInvModal(false);
    loadAllData();
  };

  const updateInventoryQty = async (id, delta) => {
    const item = await localDb.inventory.get(id);
    if (item) {
      const newQty = Math.max(0, Number(item.quantity) + delta);
      await localDb.inventory.update(id, { quantity: newQty });
      loadAllData();
    }
  };

  const exportInventoryExcel = () => {
    const rows = [
      ["BÁO CÁO TỒN KHO NGUYÊN LIỆU - TIỆM NHÀ TẠO"],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
      ["STT", "Tên Nguyên Liệu", "Số Lượng Tồn Kho", "Đơn Vị Tính", "Cảnh Báo Tồn Tối Thiểu", "Trạng Thái Kho"]
    ];

    inventory.forEach((item, idx) => {
      const status = item.quantity <= item.min_quantity ? "SẮP HẾT HÀNG" : "An Toàn";
      rows.push([idx + 1, item.name, item.quantity, item.unit, item.min_quantity, status]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TonKho");
    XLSX.writeFile(wb, `BaoCaoTonKho_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Kê khai Thuế TT88
  const generateTaxPreview = async () => {
    const orders = await localDb.orders.toArray();
    const dailyMap = {};

    const start = new Date(taxStartDate);
    const end = new Date(taxEndDate);
    end.setHours(23, 59, 59, 999);

    orders.forEach(ord => {
      const ordDate = new Date(ord.created_at);
      if (ordDate >= start && ordDate <= end) {
        const dateStr = ordDate.toLocaleDateString('vi-VN');
        if (!dailyMap[dateStr]) dailyMap[dateStr] = { cash: 0, transfer: 0, total: 0 };
        dailyMap[dateStr].cash += Number(ord.cash_amount || 0);
        dailyMap[dateStr].transfer += Number(ord.transfer_amount || 0);
        dailyMap[dateStr].total += Number(ord.total_amount || 0);
      }
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

  const exportTaxExcel = () => {
    if (taxPreviewData.length === 0) return alert('Không có dữ liệu trong khoảng thời gian này!');

    const rows = [
      ["BẢNG KÊ KHAI DOANH THU BÁN HÀNG THEO NGÀY (THÔNG TƯ 88/2021/TT-BTC)"],
      [`Tên hộ kinh doanh: TIỆM NHÀ TẠO POS`],
      [`Thời gian kê khai: Từ ngày ${taxStartDate} đến ngày ${taxEndDate}`],
      [],
      ["STT", "Ngày / Tháng / Năm", "Doanh Thu Tiền Mặt (VNĐ)", "Doanh Thu Chuyển Khoản (VNĐ)", "TỔNG DOANH THU NGÀY (VNĐ)"]
    ];

    let sumCash = 0, sumTransfer = 0, sumTotal = 0;
    taxPreviewData.forEach(item => {
      rows.push([item.stt, item.date, item.cash, item.transfer, item.total]);
      sumCash += item.cash;
      sumTransfer += item.transfer;
      sumTotal += item.total;
    });

    rows.push([], ["", "TỔNG CỘNG KHÓA KỲ", sumCash, sumTransfer, sumTotal]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KeKhaiThueTT88");
    XLSX.writeFile(wb, `SoKeKhaiThue_TT88_${taxStartDate}_To_${taxEndDate}.xlsx`);
  };

  // Báo cáo sự cố
  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!newIssueTitle || !newIssueContent) return;
    const report = {
      staff_name: currentUser.full_name,
      title: newIssueTitle,
      content: newIssueContent,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    await localDb.issue_reports.add(report);
    setNewIssueTitle(''); setNewIssueContent('');
    alert('Đã gửi báo cáo lên Chủ Quán!');
    loadAllData();
  };

  const resolveIssue = async (id) => {
    await localDb.issue_reports.update(id, { status: 'RESOLVED' });
    loadAllData();
  };

  // POS Order & Thanh Toán
  const fetchTodayOrders = async () => {
    const allOrders = await localDb.orders.toArray();
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const filtered = allOrders.filter(ord => new Date(ord.created_at).toLocaleDateString('vi-VN') === todayStr);
    setTodayOrders(filtered.reverse());
  };

  const filteredProducts = products.filter(item => {
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    if (!product.is_available) return alert('Món này tạm thời báo hết!');
    const exist = cart.find(x => x.id === product.id);
    if (exist) {
      setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...product, qty: 1, note: '' }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
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

    const orderData = {
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

    await localDb.orders.add(orderData);
    setReprintOrder(null);
    window.print();

    setCart([]);
    setShowQRModal(false);
    setDiscountPercent(0);
    fetchTodayOrders();
    alert('Thanh toán & in hóa đơn thành công!');
  };

  const handleReprintHistoryOrder = (ord) => {
    setReprintOrder(ord);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const todayCash = todayOrders.reduce((sum, ord) => sum + Number(ord.cash_amount || 0), 0);
  const todayTransfer = todayOrders.reduce((sum, ord) => sum + Number(ord.transfer_amount || 0), 0);
  const todayTotal = todayCash + todayTransfer;

  // 🔴 MÀN HÌNH ĐĂNG NHẬP
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-matcha-900 to-black flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">🍵</div>
            <h1 className="text-2xl font-extrabold text-gray-900">TIỆM NHÀ TẠO POS</h1>
            <p className="text-xs text-gray-500 font-medium">Đăng nhập tài khoản Quản lý / Nhân viên</p>
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
    <div className="flex h-screen bg-matcha-50 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-matcha-900 text-white flex flex-col justify-between shadow-2xl z-20">
        <div>
          <div className="p-5 border-b border-matcha-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-matcha-500 flex items-center justify-center text-xl shadow-lg">🍵</div>
            <div>
              <h1 className="font-extrabold text-base tracking-wide text-white leading-none">TIỆM NHÀ TẠO</h1>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Matcha & Coffee POS</span>
            </div>
          </div>

          <nav className="p-3 space-y-1.5">
            <button onClick={() => setActiveTab('pos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'pos' ? 'bg-gradient-to-r from-emerald-600 to-matcha-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-matcha-800'}`}>
              <ShoppingCart size={18} /> POS Gọi Món
            </button>

            <button onClick={() => setActiveTab('daily_report')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'daily_report' ? 'bg-gradient-to-r from-emerald-600 to-matcha-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-matcha-800'}`}>
              <FileText size={18} /> Doanh Thu Hàng Ngày
            </button>

            <button onClick={() => setActiveTab('staff_issue')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'staff_issue' ? 'bg-gradient-to-r from-emerald-600 to-matcha-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-matcha-800'}`}>
              <AlertTriangle size={18} /> {currentUser.role === 'OWNER' ? 'Hòm Thư Sự Cố' : 'Báo Hết / Báo Sự Cố'}
            </button>

            {currentUser.role === 'OWNER' && (
              <>
                <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'bg-gradient-to-r from-emerald-600 to-matcha-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-matcha-800'}`}>
                  <Package size={18} /> Quản Lý Tồn Kho
                </button>

                <button onClick={() => setActiveTab('tax')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'tax' ? 'bg-gradient-to-r from-emerald-600 to-matcha-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-matcha-800'}`}>
                  <FileText size={18} /> Kê Khai Thuế TT88
                </button>

                <button onClick={() => setActiveTab('staff_mgr')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'staff_mgr' ? 'bg-gradient-to-r from-emerald-600 to-matcha-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-matcha-800'}`}>
                  <Users size={18} /> Cấp Quyền Nhân Viên
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-matcha-800 bg-matcha-950/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">{currentUser.full_name}</div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">{currentUser.role === 'OWNER' ? '👑 Chủ Quán' : '👤 Nhân Viên Ca'}</div>
            </div>
            <button onClick={handleLogout} title="Đăng xuất" className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-lg font-bold text-gray-800">
            {activeTab === 'pos' && '🛒 POS Order Bán Hàng'}
            {activeTab === 'daily_report' && '📊 Doanh Thu & Lịch Sử In Bill Ngày'}
            {activeTab === 'inventory' && '📦 Quản Lý Tồn Kho Nguyên Liệu'}
            {activeTab === 'tax' && '📄 Kê Khai Thuế TT88 (.xlsx)'}
            {activeTab === 'staff_mgr' && '👥 Cấp Tài Khoản Nhân Viên'}
            {activeTab === 'staff_issue' && '💬 Hòm Thư Báo Cáo Tình Trạng Quán'}
          </h2>

          {activeTab === 'pos' && (
            <div className="flex items-center gap-3">
              {currentUser.role === 'OWNER' && (
                <button 
                  onClick={() => { 
                    setEditingProduct({ name: '', price: 35000, category: categories[1] || 'Matcha Series', image: '🍵', stock: 50, is_available: true }); 
                    setShowProductModal(true); 
                  }}
                  className="bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow hover:bg-emerald-800"
                >
                  <Plus size={14} /> Thêm Món Mới
                </button>
              )}
              <div className="relative w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Tìm món nhanh..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-xs font-medium focus:bg-white outline-none" />
              </div>
            </div>
          )}
        </header>

        {/* 🛒 1. MÀN HÌNH POS */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
              
              {/* THANH DANH MỤC LỌC (CÓ NÚT Quản Lý Danh Mục DÀNH CHO CHỦ QUÁN) */}
              <div className="flex gap-2 overflow-x-auto pb-1 items-center scrollbar-none">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap ${selectedCategory === cat ? 'bg-coffee-700 text-white' : 'bg-white text-gray-600 border'}`}>
                    {cat}
                  </button>
                ))}

                {currentUser.role === 'OWNER' && (
                  <button 
                    onClick={() => setShowCategoryModal(true)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                  >
                    <FolderPlus size={14} /> Quản lý danh mục
                  </button>
                )}
              </div>

              {/* GRID DANH SÁCH MÓN NƯỚC */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((item) => (
                  <div key={item.id} className={`group bg-white rounded-2xl p-4 border shadow-sm transition-all flex flex-col justify-between relative overflow-hidden ${!item.is_available ? 'opacity-50 grayscale' : 'hover:shadow-xl hover:border-emerald-500'}`}>
                    
                    {currentUser.role === 'OWNER' && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10 bg-white/80 backdrop-blur rounded-lg p-1 shadow">
                        <button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); setShowProductModal(true); }} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                          <Edit3 size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item.id); }} className="p-1 text-red-600 hover:bg-red-100 rounded">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}

                    <div onClick={() => addToCart(item)} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-3xl p-2 bg-matcha-50 rounded-xl">{item.image}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${item.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {item.is_available ? `Kho: ${item.stock}` : 'HẾT MÓN'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                      </div>
                    </div>

                    <div onClick={() => addToCart(item)} className="mt-4 pt-3 border-t flex items-center justify-between cursor-pointer">
                      <span className="font-extrabold text-emerald-800 text-sm">{item.price.toLocaleString()} đ</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
                        <Plus size={16} />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Giỏ hàng */}
            <div className="w-96 bg-white border-l flex flex-col justify-between shadow-xl">
              <div className="p-5 border-b flex items-center justify-between bg-matcha-50/50">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-emerald-700" />
                  <h3 className="font-extrabold text-gray-800 text-sm">Đơn Hàng Hiện Tại</h3>
                </div>
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 font-semibold flex items-center gap-1"><Trash2 size={12} /> Xóa</button>}
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <span className="text-4xl">🍵</span>
                    <p className="text-xs font-medium">Chưa chọn món nào</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-xl border flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-gray-800">{item.name}</h4>
                          <span className="text-[11px] font-semibold text-emerald-700">{item.price.toLocaleString()} đ</span>
                        </div>
                        <span className="font-bold text-xs text-gray-800">{(item.price * item.qty).toLocaleString()} đ</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <input type="text" placeholder="Ghi chú pha chế..." value={item.note || ''} onChange={(e) => setCart(cart.map(x => x.id === item.id ? { ...x, note: e.target.value } : x))} className="text-[10px] bg-white border rounded px-2 py-1 w-36 outline-none" />
                        <div className="flex items-center gap-1 bg-white border rounded-lg p-0.5">
                          <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center rounded"><Minus size={12} /></button>
                          <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center rounded"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-5 border-t bg-gray-50 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500"><span>Tạm tính:</span><span className="font-semibold text-gray-800">{subTotal.toLocaleString()} đ</span></div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Giảm giá (%):</span>
                    <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="w-14 text-right border rounded px-1.5 py-0.5 font-bold text-emerald-700" />
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t"><span>Tổng thanh toán:</span><span className="text-emerald-700">{finalTotal.toLocaleString()} đ</span></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPaymentMethod('CASH')} className={`py-2.5 rounded-xl text-xs font-bold border ${paymentMethod === 'CASH' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-600'}`}>💵 Tiền Mặt</button>
                  <button onClick={() => setPaymentMethod('TRANSFER')} className={`py-2.5 rounded-xl text-xs font-bold border ${paymentMethod === 'TRANSFER' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-600'}`}><QrCode size={14} className="inline mr-1" /> Chuyển Khoản</button>
                </div>

                <button onClick={handleCheckout} className="w-full py-3.5 bg-gradient-to-r from-coffee-700 to-coffee-800 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2">
                  <Printer size={18} /> THANH TOÁN & IN BILL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📦 2. QUẢN LÝ KHO NGUYÊN LIỆU */}
        {activeTab === 'inventory' && currentUser.role === 'OWNER' && (
          <div className="p-8 max-w-6xl mx-auto w-full overflow-y-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Quản Lý Tồn Kho Nguyên Liệu</h3>
                <p className="text-xs text-gray-500">Thêm mặt hàng mới, điều chỉnh số lượng tồn và xuất file Excel.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={exportInventoryExcel} className="bg-coffee-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow hover:bg-coffee-800">
                  <Download size={16} /> Xuất File Tồn Kho Excel
                </button>
                <button onClick={() => setShowInvModal(true)} className="bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow hover:bg-emerald-800">
                  <Plus size={16} /> Thêm Nguyên Liệu Mới
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 font-bold border-b">
                  <tr>
                    <th className="p-4">Tên Nguyên Liệu</th>
                    <th className="p-4">Số Lượng Tồn Kho</th>
                    <th className="p-4">Đơn Vị Tính</th>
                    <th className="p-4">Trạng Thái</th>
                    <th className="p-4 text-center">Điều Chỉnh Tồn Kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inventory.map(item => {
                    const isLow = item.quantity <= item.min_quantity;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-800">{item.name}</td>
                        <td className="p-4 font-extrabold text-sm text-emerald-700">{item.quantity}</td>
                        <td className="p-4 font-semibold text-gray-500">{item.unit}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isLow ? '⚠️ Sắp hết hàng' : '✓ An toàn'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-2">
                            <button onClick={() => updateInventoryQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-gray-100 font-bold hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-sm">-</button>
                            <button onClick={() => updateInventoryQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-gray-100 font-bold hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center text-sm">+</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 📄 3. KÊ KHAI THUẾ TT88 */}
        {activeTab === 'tax' && currentUser.role === 'OWNER' && (
          <div className="p-8 max-w-5xl mx-auto w-full overflow-y-auto space-y-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Bảng Kê Khai Thuế Doanh Thu (Thông Tư 88/2021/TT-BTC)</h3>
              <p className="text-xs text-gray-500">Chọn khoảng thời gian để xem trước dữ liệu tổng hợp tiền mặt & chuyển khoản trước khi xuất file Excel.</p>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Từ ngày:</label>
                  <input type="date" value={taxStartDate} onChange={(e) => setTaxStartDate(e.target.value)} className="w-full border rounded-xl p-2.5 text-xs font-semibold outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Đến ngày:</label>
                  <input type="date" value={taxEndDate} onChange={(e) => setTaxEndDate(e.target.value)} className="w-full border rounded-xl p-2.5 text-xs font-semibold outline-none" />
                </div>
                <div className="flex items-end">
                  <button onClick={exportTaxExcel} className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow">
                    <Download size={16} /> Xuất File Excel Thuế TT88
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Eye size={18} className="text-emerald-700" /> Bảng Xem Trước Dữ Liệu Kê Khai</h4>
                <span className="text-xs font-bold text-emerald-700">Tổng Doanh Thu: {taxPreviewData.reduce((s,x)=>s+x.total,0).toLocaleString()} đ</span>
              </div>

              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-matcha-50 font-bold border-b text-matcha-900">
                    <tr><th className="p-3">STT</th><th className="p-3">Ngày / Tháng / Năm</th><th className="p-3">Tiền Mặt</th><th className="p-3">Chuyển Khoản</th><th className="p-3 text-right">Tổng Doanh Thu</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {taxPreviewData.length === 0 ? (
                      <tr><td colSpan="5" className="p-4 text-center text-gray-400">Chưa có dữ liệu đơn hàng trong khoảng thời gian này.</td></tr>
                    ) : (
                      taxPreviewData.map(row => (
                        <tr key={row.stt} className="hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-500">{row.stt}</td>
                          <td className="p-3 font-bold text-gray-800">{row.date}</td>
                          <td className="p-3 text-emerald-700 font-semibold">{row.cash.toLocaleString()} đ</td>
                          <td className="p-3 text-blue-700 font-semibold">{row.transfer.toLocaleString()} đ</td>
                          <td className="p-3 text-right font-extrabold text-gray-900">{row.total.toLocaleString()} đ</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 📊 4. DOANH THU HÀNG NGÀY & LỊCH SỬ BILL */}
        {activeTab === 'daily_report' && (
          <div className="p-8 max-w-5xl mx-auto w-full overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 border shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b pb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Doanh Thu Ngày {new Date().toLocaleDateString('vi-VN')}</h3>
                  <p className="text-xs text-gray-500 mt-1">Thu ngân ca hiện tại: <span className="font-bold text-emerald-700">{currentUser.full_name}</span></p>
                </div>
                <button onClick={() => { setReprintOrder(null); window.print(); }} className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow hover:bg-emerald-800">
                  <Printer size={16} /> In Báo Cáo Doanh Thu Ca
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <div className="text-xs text-emerald-800 font-bold mb-1">💵 Tiền Mặt</div>
                  <div className="text-xl font-extrabold text-emerald-700">{todayCash.toLocaleString()} đ</div>
                </div>
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                  <div className="text-xs text-blue-800 font-bold mb-1">💳 Chuyển Khoản</div>
                  <div className="text-xl font-extrabold text-blue-700">{todayTransfer.toLocaleString()} đ</div>
                </div>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                  <div className="text-xs text-amber-800 font-bold mb-1">🔥 TỔNG DOANH THU</div>
                  <div className="text-xl font-extrabold text-amber-800">{todayTotal.toLocaleString()} đ</div>
                </div>
              </div>

              <div className="border rounded-2xl overflow-hidden space-y-2">
                <div className="bg-gray-100 px-4 py-3 font-bold text-xs text-gray-700 border-b flex justify-between items-center">
                  <span>Lịch Sử Đơn Hàng / In Bill ({todayOrders.length} đơn hôm nay)</span>
                  <span className="text-[11px] font-normal text-gray-500">Bấm "Xem bill" để kiểm tra các món đã gọi</span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 font-bold border-b text-gray-600">
                    <tr>
                      <th className="p-3">Giờ xuất</th>
                      <th className="p-3">Người bán</th>
                      <th className="p-3">Hình thức</th>
                      <th className="p-3 text-right">Tổng tiền</th>
                      <th className="p-3 text-center">Chi tiết món</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {todayOrders.length === 0 ? (
                      <tr><td colSpan="5" className="p-4 text-center text-gray-400">Chưa có đơn hàng nào phát sinh hôm nay.</td></tr>
                    ) : (
                      todayOrders.map((ord, i) => {
                        const items = ord.items_json ? JSON.parse(ord.items_json) : [];
                        return (
                          <tr key={i} className="hover:bg-emerald-50/50 transition-colors">
                            <td className="p-3 font-semibold text-gray-800">{new Date(ord.created_at).toLocaleTimeString('vi-VN')}</td>
                            <td className="p-3 font-semibold text-gray-700">{ord.staff_name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${ord.payment_method === 'CASH' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                {ord.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-700">{Number(ord.total_amount).toLocaleString()} đ</td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => setSelectedOrderDetails(ord)}
                                className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1 mx-auto transition-all shadow-sm"
                              >
                                <Eye size={14} /> Xem bill ({items.length} món)
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* 👥 5. CẤP TÀI KHOẢN NHÂN VIÊN */}
        {activeTab === 'staff_mgr' && currentUser.role === 'OWNER' && (
          <div className="p-8 max-w-4xl mx-auto w-full overflow-y-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 border shadow-xl space-y-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2"><UserCheck className="text-emerald-700" size={20} /> Cấp Tài Khoản Nhân Viên Mới</h3>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-3 gap-4">
                <input type="text" required placeholder="Họ tên nhân viên" value={newStaffName} onChange={(e)=>setNewStaffName(e.target.value)} className="border rounded-xl p-2.5 text-xs font-semibold outline-none" />
                <input type="text" required placeholder="Tên đăng nhập" value={newStaffUser} onChange={(e)=>setNewStaffUser(e.target.value)} className="border rounded-xl p-2.5 text-xs font-semibold outline-none" />
                <input type="password" required placeholder="Mật khẩu" value={newStaffPass} onChange={(e)=>setNewStaffPass(e.target.value)} className="border rounded-xl p-2.5 text-xs font-semibold outline-none" />
                <div className="col-span-3">
                  <button type="submit" className="bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow hover:bg-emerald-800">+ Cấp Tài Khoản Ngay</button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-6 border shadow-xl space-y-4">
              <h3 className="font-bold text-gray-800 text-base">Danh Sách Nhân Viên Đã Cấp Quyền</h3>
              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 font-bold border-b"><tr><th className="p-3">Họ Tên</th><th className="p-3">Tên Đăng Nhập</th><th className="p-3">Thao Tác</th></tr></thead>
                  <tbody className="divide-y">
                    {staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold">{s.full_name}</td>
                        <td className="p-3 text-emerald-700 font-semibold">{s.username}</td>
                        <td className="p-3"><button onClick={() => handleDeleteStaff(s.id)} className="text-red-500 font-bold hover:text-red-700">Xóa quyền</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 💬 6. BÁO CÁO TÌNH TRẠNG & SỰ CỐ QUÁN */}
        {activeTab === 'staff_issue' && (
          <div className="p-8 max-w-4xl mx-auto w-full overflow-y-auto space-y-6">
            {currentUser.role === 'STAFF' && (
              <div className="bg-white rounded-3xl p-6 border shadow-xl space-y-4">
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /> Báo Cáo Hết Món / Sự Cố Máy Móc Quán</h3>
                <form onSubmit={handleSubmitIssue} className="space-y-3">
                  <input type="text" required placeholder="Tiêu đề (VD: Hết sữa tươi thanh trùng / Máy xay bị hỏng...)" value={newIssueTitle} onChange={(e) => setNewIssueTitle(e.target.value)} className="w-full border rounded-xl p-2.5 text-xs font-semibold outline-none" />
                  <textarea rows="3" required placeholder="Nội dung gửi Chủ Quán..." value={newIssueContent} onChange={(e) => setNewIssueContent(e.target.value)} className="w-full border rounded-xl p-2.5 text-xs font-semibold outline-none"></textarea>
                  <button type="submit" className="bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow"><Send size={14} /> Gửi Báo Cáo</button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 border shadow-xl space-y-4">
              <h3 className="font-bold text-gray-800 text-base">Hòm Thư Báo Cáo Sự Cố Quán</h3>
              <div className="space-y-3">
                {issueReports.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Chưa có báo cáo sự cố nào.</p>
                ) : (
                  issueReports.map(item => (
                    <div key={item.id} className="p-4 rounded-2xl border bg-gray-50 flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-800">{item.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status === 'RESOLVED' ? 'Đã xử lý' : 'Chờ xử lý'}</span>
                        </div>
                        <p className="text-xs text-gray-600">{item.content}</p>
                        <div className="text-[10px] text-gray-400 pt-1">Người gửi: {item.staff_name} • {new Date(item.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                      {currentUser.role === 'OWNER' && item.status !== 'RESOLVED' && (
                        <button onClick={() => resolveIssue(item.id)} className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-800">Xác nhận xử lý</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 📂 POPUP QUẢN LÝ / THÊM XÓA DANH MỤC MÓN */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-gray-800 flex items-center gap-2">
                <FolderPlus size={18} className="text-amber-700" /> Quản Lý Danh Mục Món
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Form thêm danh mục mới */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input 
                type="text" 
                required 
                placeholder="Tên danh mục mới (VD: Trà Trái Cây, Đá Xay...)" 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)} 
                className="flex-1 border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow shrink-0">
                + Thêm Mới
              </button>
            </form>

            {/* Danh sách các danh mục hiện có */}
            <div className="space-y-2 max-h-56 overflow-y-auto border-t pt-3">
              <p className="text-[11px] font-bold text-gray-500 mb-1">Các danh mục hiện tại:</p>
              {categories.filter(c => c !== 'Tất cả').map((cat) => (
                <div key={cat} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-gray-800">
                  <span>{cat}</span>
                  <button 
                    onClick={() => handleDeleteCategory(cat)} 
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa danh mục"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t text-right">
              <button onClick={() => setShowCategoryModal(false)} className="w-full py-2.5 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100">
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 POPUP XEM CHI TIẾT CÁC MÓN TRONG LỊCH SỬ BILL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-800">Chi Tiết Hóa Đơn</h3>
                <p className="text-[11px] text-gray-500">
                  {new Date(selectedOrderDetails.created_at).toLocaleString('vi-VN')} • Thu ngân: <span className="font-bold text-emerald-700">{selectedOrderDetails.staff_name}</span>
                </p>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border-b pb-3">
              {(() => {
                const items = selectedOrderDetails.items_json ? JSON.parse(selectedOrderDetails.items_json) : [];
                if (items.length === 0) return <p className="text-xs text-gray-400 text-center py-4">Không tìm thấy chi tiết danh sách món</p>;
                return items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{it.name}</div>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                        {it.price?.toLocaleString()} đ x <span className="font-bold text-emerald-700">{it.qty}</span>
                        {it.note ? <span className="text-amber-600 italic font-normal"> ({it.note})</span> : ''}
                      </div>
                    </div>
                    <div className="font-extrabold text-emerald-800 text-sm">
                      {((it.price || 0) * (it.qty || 1)).toLocaleString()} đ
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="space-y-1.5 text-xs bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
              {Number(selectedOrderDetails.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Giảm giá:</span>
                  <span className="font-bold text-red-500">-{Number(selectedOrderDetails.discount_amount).toLocaleString()} đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-gray-900">
                <span>Tổng tiền ({selectedOrderDetails.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}):</span>
                <span className="text-emerald-700">{Number(selectedOrderDetails.total_amount).toLocaleString()} đ</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setSelectedOrderDetails(null)} className="flex-1 py-2.5 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100">Đóng</button>
              <button onClick={() => handleReprintHistoryOrder(selectedOrderDetails)} className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow hover:bg-emerald-800">
                <Printer size={15} /> In Lại Bill Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÊM/SỬA MÓN NƯỚC (DANH MỤC LẤY TỰ ĐỘNG TỪ DANH SÁCH ĐỘNG) */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-800">{editingProduct.id ? 'Chỉnh Sửa Món Nước' : 'Thêm Món Nước Mới'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên món nước:</label>
                <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full border rounded-xl p-2.5 font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Giá bán (VNĐ):</label>
                  <input type="number" required value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} className="w-full border rounded-xl p-2.5 font-semibold" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Biểu tượng (Emoji):</label>
                  <input type="text" required value={editingProduct.image} onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })} className="w-full border rounded-xl p-2.5 font-semibold text-center text-base" />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Danh mục món:</label>
                <select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full border rounded-xl p-2.5 font-semibold">
                  {categories.filter(c => c !== 'Tất cả').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-2.5 border rounded-xl font-bold">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl font-bold">Lưu Món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP THÊM NGUYÊN LIỆU KHO */}
      {showInvModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-800">Thêm Nguyên Liệu Kho Mới</h3>
            <form onSubmit={handleAddInventory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên nguyên liệu:</label>
                <input type="text" required value={newInvItem.name} onChange={(e) => setNewInvItem({ ...newInvItem, name: e.target.value })} className="w-full border rounded-xl p-2.5 font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Số lượng tồn ban đầu:</label>
                  <input type="number" required value={newInvItem.quantity} onChange={(e) => setNewInvItem({ ...newInvItem, quantity: e.target.value })} className="w-full border rounded-xl p-2.5 font-semibold" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Đơn vị tính:</label>
                  <input type="text" required placeholder="kg, hộp..." value={newInvItem.unit} onChange={(e) => setNewInvItem({ ...newInvItem, unit: e.target.value })} className="w-full border rounded-xl p-2.5 font-semibold" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowInvModal(false)} className="flex-1 py-2.5 border rounded-xl font-bold">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl font-bold">Lưu Kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MÃ VIETQR TRÊN MÀN HÌNH MÁY POS */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-800">Quét Mã VietQR MBBank</h3>
            <p className="text-xs text-gray-500">Mã QR tự động nhập đúng số tiền đơn hàng.</p>
            
            <div className="p-3 bg-gray-100 rounded-2xl inline-block border border-gray-200 shadow-inner">
              <img 
                src={dynamicQrUrl} 
                alt="MBBank VietQR" 
                className="w-56 h-56 object-contain rounded-xl" 
              />
            </div>

            <div className="text-center font-extrabold text-emerald-700 text-lg">
              {finalTotal.toLocaleString()} VNĐ
            </div>
            <div className="text-[11px] font-bold text-gray-600">
              {BANK_CONFIG.ACCOUNT_NAME} - {BANK_CONFIG.ACCOUNT_NO}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowQRModal(false)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-gray-600">Hủy</button>
              <button onClick={handleCheckout} className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow">Xác Nhận Đã Nhận Tiền</button>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ MẪU IN BILL NHIỆT (IN ĐƠN BÁN, IN TỔNG KẾT CA VÀ IN LẠI BILL TỪ LỊCH SỬ) */}
      <div id="print-area" className="p-2 text-[11px] font-mono leading-tight">
        <div className="text-center font-extrabold text-sm uppercase">TIỆM NHÀ TẠO POS</div>
        <div className="text-center text-[10px]">Cửa Hàng Matcha & Cà Phê</div>
        <div className="border-b border-black my-1 border-dashed"></div>

        {reprintOrder ? (
          <div>
            <div className="text-center font-bold text-xs my-0.5">[ IN LẠI HÓA ĐƠN ]</div>
            <div className="flex justify-between text-[10px]">
              <span>Mã HD: #{reprintOrder.id || 'BILL'}</span>
              <span>{new Date(reprintOrder.created_at).toLocaleTimeString('vi-VN')}</span>
            </div>
            <div className="text-[10px]">Thu ngân: {reprintOrder.staff_name}</div>
            <div className="border-b border-black my-1 border-dashed"></div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black">
                  <th>Món</th>
                  <th className="text-center">SL</th>
                  <th className="text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {(reprintOrder.items_json ? JSON.parse(reprintOrder.items_json) : []).map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-right">{(item.price * item.qty).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-b border-black my-1 border-dashed"></div>
            <div className="flex justify-between font-bold text-xs">
              <span>TỔNG TIỀN:</span>
              <span>{Number(reprintOrder.total_amount).toLocaleString()} đ</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Hình thức:</span>
              <span>{reprintOrder.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
            </div>

            {reprintOrder.payment_method === 'TRANSFER' && (
              <div className="text-center my-3 pt-2 border-t border-black border-dashed">
                <div className="font-extrabold text-[10px] uppercase">QUÉT MÃ CHUYỂN KHOẢN MBBANK</div>
                <img 
                  src={`https://img.vietqr.io/image/${BANK_CONFIG.BANK_ID}-${BANK_CONFIG.ACCOUNT_NO}-compact2.png?amount=${reprintOrder.total_amount}&addInfo=TiemNhaTao%20HD&accountName=${encodeURIComponent(BANK_CONFIG.ACCOUNT_NAME)}`} 
                  alt="MBBank VietQR Bill" 
                  className="w-40 h-40 mx-auto my-1.5 object-contain"
                />
                <div className="text-[9px] font-bold">{BANK_CONFIG.ACCOUNT_NAME}</div>
                <div className="text-[9px]">{BANK_CONFIG.ACCOUNT_NO} (MBBank)</div>
              </div>
            )}
          </div>
        ) : activeTab === 'daily_report' ? (
          <div>
            <div className="text-center font-bold my-1">BÁO CÁO TỔNG KẾT DOANH THU CA</div>
            <div>Ngày: {new Date().toLocaleDateString('vi-VN')}</div>
            <div>Thu ngân: {currentUser.full_name}</div>
            <div className="border-b border-black my-1 border-dashed"></div>
            <div className="flex justify-between"><span>Tiền mặt:</span><span>{todayCash.toLocaleString()} đ</span></div>
            <div className="flex justify-between"><span>Chuyển khoản:</span><span>{todayTransfer.toLocaleString()} đ</span></div>
            <div className="flex justify-between font-bold text-xs mt-1"><span>TỔNG DOANH THU:</span><span>{todayTotal.toLocaleString()} đ</span></div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between text-[10px]">
              <span>Mã HD: #{Math.floor(Math.random() * 899999 + 100000)}</span>
              <span>{new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
            <div className="text-[10px]">Thu ngân: {currentUser.full_name}</div>
            <div className="border-b border-black my-1 border-dashed"></div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black">
                  <th>Món</th>
                  <th className="text-center">SL</th>
                  <th className="text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-right">{(item.price * item.qty).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-b border-black my-1 border-dashed"></div>
            <div className="flex justify-between font-bold text-xs">
              <span>TỔNG TIỀN:</span>
              <span>{finalTotal.toLocaleString()} đ</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Hình thức:</span>
              <span>{paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
            </div>

            {paymentMethod === 'TRANSFER' && (
              <div className="text-center my-3 pt-2 border-t border-black border-dashed">
                <div className="font-extrabold text-[10px] uppercase">QUÉT MÃ CHUYỂN KHOẢN MBBANK</div>
                <img 
                  src={dynamicQrUrl} 
                  alt="MBBank VietQR Bill" 
                  className="w-40 h-40 mx-auto my-1.5 object-contain"
                />
                <div className="text-[9px] font-bold">{BANK_CONFIG.ACCOUNT_NAME}</div>
                <div className="text-[9px]">{BANK_CONFIG.ACCOUNT_NO} (MBBank)</div>
              </div>
            )}
          </div>
        )}

        <div className="border-b border-black my-1 border-dashed"></div>
        <div className="text-center italic text-[10px] mt-2">Cảm ơn quý khách & Hẹn gặp lại!</div>
      </div>

    </div>
  );
}