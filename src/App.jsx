import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import { localDb } from './services/db';
import * as XLSX from 'xlsx';
import { getLocalDateString, formatVNShortDate } from './utils/formatters';

import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import PrintArea from './components/common/PrintArea';

import PosView from './components/pos/PosView';
import CartModal from './components/pos/CartModal';
import PosModals from './components/pos/PosModals';

import InventoryView from './components/inventory/InventoryView';
import InventoryModals from './components/inventory/InventoryModals';

import DailyReportView from './components/reports/DailyReportView';
import TaxTT88View from './components/reports/TaxTT88View';
import StaffManagerView from './components/staff/StaffManagerView';
import IssueReportView from './components/issues/IssueReportView';

const BANK_CONFIG = {
  BANK_ID: 'MB',
  ACCOUNT_NO: '16112266889999',
  ACCOUNT_NAME: 'NGUYEN LE HUYNH'
};

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
  { name: 'cà phê ru mạnh', quantity: 10, unit: 'kg', min_quantity: 3, cost_price: 258000, old_cost_price: 258000 },
  { name: 'Sữa Tươi Thanh Trùng', quantity: 12, unit: 'hộp', min_quantity: 4, cost_price: 27083, old_cost_price: 27083 },
  { name: 'Bột Matcha Uji Grade A', quantity: 12.5, unit: 'kg', min_quantity: 3, cost_price: 520000, old_cost_price: 480000 }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('pos');
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showQRModal, setShowQRModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  const [printOrder, setPrintOrder] = useState(null);
  const [printType, setPrintType] = useState('ORDER');

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatNewName, setEditCatNewName] = useState('');

  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
  const [showInvModal, setShowInvModal] = useState(false);
  const [editingInvItem, setEditingInvItem] = useState(null);
  const [invFormMode, setInvFormMode] = useState('PACK');
  const [invForm, setInvForm] = useState({
    name: '', unit: 'kg', min_quantity: 3,
    single_qty: 10, single_cost: 258000,
    pack_qty: 1, pack_size: 10, pack_price: 2580000
  });

  const [priceHistoryLogs, setPriceHistoryLogs] = useState([]);
  const [showA4Modal, setShowA4Modal] = useState(false);
  const [auditData, setAuditData] = useState([]);

  const [taxStartDate, setTaxStartDate] = useState(() => {
    const now = new Date();
    return getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [taxEndDate, setTaxEndDate] = useState(() => getLocalDateString());
  const [taxPreviewData, setTaxPreviewData] = useState([]);

  const [issueReports, setIssueReports] = useState([]);
  const [reportType, setReportType] = useState('SỰ CỐ');
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueContent, setNewIssueContent] = useState('');
  const [selectedInvItem, setSelectedInvItem] = useState('');
  const [reportQty, setReportQty] = useState(1);

  const [staffList, setStaffList] = useState([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUser, setNewStaffUser] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  
  const [selectedReportDate, setSelectedReportDate] = useState(() => getLocalDateString());
  const [reportOrders, setReportOrders] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) { try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {} }
    const startApp = async () => { await initLocalDb(); await loadAllData(); };
    startApp();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => { loadAllData(); }, 5000);
    return () => clearInterval(interval);
  }, [currentUser, activeTab]);

  useEffect(() => {
    generateTaxPreview();
  }, [taxStartDate, taxEndDate, reportOrders]);

  useEffect(() => {
    fetchOrdersByDate(selectedReportDate);
  }, [selectedReportDate, currentUser]);

  const initLocalDb = async () => {
    try {
      const existingCat = await localDb.categories.toArray();
      if (existingCat.length === 0) {
        await localDb.categories.bulkPut([{ name: 'Matcha Series' }, { name: 'Cà Phê Măng Đen' }, { name: 'Trà & Latte' }, { name: 'Bánh Sweet' }]);
      }
      const existingProducts = await localDb.products.toArray();
      if (existingProducts.length === 0) await localDb.products.bulkPut(DEFAULT_PRODUCTS);
      const existingInv = await localDb.inventory.toArray();
      if (existingInv.length === 0) await localDb.inventory.bulkPut(DEFAULT_INVENTORY);
    } catch (err) {}
  };

  const loadAllData = async () => {
    try {
      if (supabase) {
        const { data: cloudStaff } = await supabase.from('staff').select('*');
        if (cloudStaff) { setStaffList(cloudStaff); try { await localDb.staff.clear(); if (cloudStaff.length > 0) await localDb.staff.bulkPut(cloudStaff); } catch (e) {} }

        const { data: cloudProducts } = await supabase.from('products').select('*');
        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts); try { await localDb.products.clear(); await localDb.products.bulkPut(cloudProducts); } catch (e) {}
        }

        const { data: cloudOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (cloudOrders) { try { await localDb.orders.clear(); if (cloudOrders.length > 0) await localDb.orders.bulkPut(cloudOrders); } catch (e) {} }

        const { data: cloudInv } = await supabase.from('inventory').select('*');
        if (cloudInv && cloudInv.length > 0) {
          setInventory(cloudInv); try { await localDb.inventory.clear(); await localDb.inventory.bulkPut(cloudInv); } catch (e) {}
        }

        const { data: cloudCat } = await supabase.from('categories').select('*');
        if (cloudCat && cloudCat.length > 0) {
          setCategories(['Tất cả', ...new Set(cloudCat.map(c => c.name))]);
          try { await localDb.categories.clear(); await localDb.categories.bulkPut(cloudCat); } catch (e) {}
        }

        const { data: cloudIssues } = await supabase.from('issue_reports').select('*');
        if (cloudIssues) { setIssueReports([...cloudIssues].reverse()); try { await localDb.issue_reports.clear(); if (cloudIssues.length > 0) await localDb.issue_reports.bulkPut(cloudIssues); } catch (e) {} }

        const { data: cloudLogs } = await supabase.from('inventory_price_logs').select('*').order('created_at', { ascending: false });
        if (cloudLogs) setPriceHistoryLogs(cloudLogs);
      } else {
        const catList = await localDb.categories.toArray();
        if (catList.length > 0) setCategories(['Tất cả', ...catList.map(c => c.name)]);
        const prodList = await localDb.products.toArray();
        if (prodList.length > 0) setProducts(prodList);
        const invList = await localDb.inventory.toArray();
        if (invList.length > 0) setInventory(invList);
        const staff = await localDb.staff.toArray();
        if (staff.length > 0) setStaffList(staff);
        const issues = await localDb.issue_reports.toArray();
        if (issues.length > 0) setIssueReports([...issues].reverse());
      }
      await fetchOrdersByDate(selectedReportDate);
    } catch (err) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError('');
    if (loginUser === 'admin' && loginPass === '123456') {
      const user = { full_name: 'Chủ Quán (Admin)', username: 'admin', role: 'OWNER' };
      setCurrentUser(user); localStorage.setItem('pos_current_user', JSON.stringify(user)); return;
    }
    if (supabase) {
      try {
        const { data } = await supabase.from('staff').select('*').eq('username', loginUser).eq('password', loginPass).single();
        if (data) {
          const user = { full_name: data.full_name, username: data.username, role: data.role };
          setCurrentUser(user); localStorage.setItem('pos_current_user', JSON.stringify(user)); return;
        }
      } catch (err) {}
    }
    setLoginError('Tài khoản hoặc mật khẩu không chính xác!');
  };

  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('pos_current_user'); setCart([]); };

  const addToCart = (product) => {
    if (!product.is_available || product.stock <= 0) return alert('Món này tạm thời báo hết!');
    const exist = cart.find(x => x.name === product.name);
    if (exist) {
      if (exist.qty >= product.stock) return alert(`Số lượng vượt quá kho (${product.stock})!`);
      setCart(cart.map(x => x.name === product.name ? { ...exist, qty: exist.qty + 1 } : x));
    } else {
      setCart([...cart, { ...product, qty: 1, note: '' }]);
    }
  };

  const updateQty = (name, delta) => {
    setCart(cart.map(item => item.name === name ? (item.qty + delta > 0 ? { ...item, qty: item.qty + delta } : null) : item).filter(Boolean));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = (subTotal * discountPercent) / 100;
  const finalTotal = Math.max(0, subTotal - discountAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Chưa chọn món!');
    const orderCode = `HD${Date.now().toString().slice(-6)}`;
    const orderData = {
      code: orderCode, created_at: new Date().toISOString(),
      total_amount: finalTotal, sub_total: subTotal, discount_amount: discountAmount,
      cash_amount: paymentMethod === 'CASH' ? finalTotal : 0, transfer_amount: paymentMethod === 'TRANSFER' ? finalTotal : 0,
      payment_method: paymentMethod, staff_name: currentUser.full_name, items_json: JSON.stringify(cart)
    };

    setPrintType('ORDER'); setPrintOrder({ ...orderData, items: [...cart], isReprint: false });
    if (supabase) await supabase.from('orders').insert([orderData]);
    await localDb.orders.add({ ...orderData });

    setCart([]); setShowQRModal(false); setShowCartModal(false); setDiscountPercent(0); await loadAllData();
    setTimeout(() => window.print(), 250);
  };

  const fetchOrdersByDate = async (targetDate) => {
    const allOrders = await localDb.orders.toArray();
    const actualQueryDate = (currentUser?.role === 'STAFF') ? getLocalDateString() : targetDate;
    setReportOrders(allOrders.filter(ord => getLocalDateString(ord.created_at) === actualQueryDate).reverse());
  };

  const generateTaxPreview = async () => {
    const orders = await localDb.orders.toArray(); const dailyMap = {};
    orders.forEach(ord => {
      const ordDateStr = getLocalDateString(ord.created_at);
      if (ordDateStr && ordDateStr >= taxStartDate && ordDateStr <= taxEndDate) {
        const displayDate = formatVNShortDate(ord.created_at);
        if (!dailyMap[displayDate]) dailyMap[displayDate] = { cash: 0, transfer: 0, total: 0 };
        dailyMap[displayDate].cash += Number(ord.cash_amount || 0);
        dailyMap[displayDate].transfer += Number(ord.transfer_amount || 0);
        dailyMap[displayDate].total += Number(ord.total_amount || 0);
      }
    });
    setTaxPreviewData(Object.keys(dailyMap).sort().map((date, idx) => ({ stt: idx + 1, date, ...dailyMap[date] })));
  };

  const exportTaxExcel = () => {
    if (taxPreviewData.length === 0) return alert('Không có dữ liệu!');
    const rows = [
      ["BẢNG KÊ KHAI DOANH THU BÁN HÀNG THEO NGÀY (THÔNG TƯ 88/2021/TT-BTC)"],
      [`Tên hộ kinh doanh: TIỆM NHÀ TÁO POS`],
      [`Thời gian: Từ ngày ${taxStartDate} đến ${taxEndDate}`], [],
      ["STT", "Ngày / Tháng / Năm", "Tiền Mặt (VNĐ)", "Chuyển Khoản (VNĐ)", "TỔNG DOANH THU NGÀY (VNĐ)"]
    ];
    let sCash = 0, sTransfer = 0, sTotal = 0;
    taxPreviewData.forEach(item => {
      rows.push([item.stt, item.date, item.cash, item.transfer, item.total]);
      sCash += item.cash; sTransfer += item.transfer; sTotal += item.total;
    });
    rows.push([], ["", "TỔNG CỘNG KHÓA KỲ", sCash, sTransfer, sTotal]);
    const ws = XLSX.utils.aoa_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KeKhaiThueTT88");
    XLSX.writeFile(wb, `SoKeKhaiThue_TT88_${taxStartDate}_To_${taxEndDate}.xlsx`);
  };

  // QUẢN LÝ KHO (THỦ TỤC XỬ LÝ)
  const openAddInventoryModal = () => {
    setEditingInvItem(null); setInvFormMode('PACK');
    setInvForm({ name: '', unit: 'kg', min_quantity: 3, single_qty: 10, single_cost: 258000, pack_qty: 1, pack_size: 10, pack_price: 2580000 });
    setShowInvModal(true);
  };

  const openEditInventoryModal = (item) => {
    setEditingInvItem(item); setInvFormMode('SINGLE');
    const cCost = Number(item.cost_price || 258000); const cQty = Number(item.quantity || 10);
    setInvForm({ name: item.name, unit: item.unit || 'kg', min_quantity: item.min_quantity || 3, single_qty: cQty, single_cost: cCost, pack_qty: 1, pack_size: cQty > 0 ? cQty : 10, pack_price: cCost * (cQty > 0 ? cQty : 10) });
    setShowInvModal(true);
  };

  const handleSaveInventory = async (e) => {
    e.preventDefault(); if (!invForm.name) return alert('Vui lòng nhập tên nguyên liệu!');
    let finalQty = invFormMode === 'PACK' ? Number(invForm.pack_qty) * Number(invForm.pack_size) : Number(invForm.single_qty);
    let finalCost = invFormMode === 'PACK' ? Math.round(Number(invForm.pack_price) / Number(invForm.pack_size)) : Number(invForm.single_cost);
    const payload = { name: invForm.name.trim(), quantity: finalQty, unit: invForm.unit.trim() || 'kg', min_quantity: Number(invForm.min_quantity) || 0, cost_price: finalCost };

    if (editingInvItem) {
      if (supabase) await supabase.from('inventory').update(payload).eq('name', editingInvItem.name);
      await localDb.inventory.update(editingInvItem.id, payload);
    } else {
      if (supabase) await supabase.from('inventory').insert([payload]);
      await localDb.inventory.add({ ...payload, id: `local_inv_${Date.now()}` });
    }
    setShowInvModal(false); await loadAllData();
  };

  const handleDeleteInventory = async (item) => {
    if (!window.confirm(`Xóa nguyên liệu "${item.name}"?`)) return;
    if (supabase) await supabase.from('inventory').delete().eq('name', item.name);
    if (item.id) await localDb.inventory.delete(item.id);
    await loadAllData();
  };

  const updateInventoryQty = async (id, delta) => {
    const item = inventory.find(x => x.id === id); if (!item) return;
    const newQty = Math.max(0, Number(item.quantity) + delta);
    if (supabase) await supabase.from('inventory').update({ quantity: newQty }).eq('name', item.name);
    await localDb.inventory.update(id, { quantity: newQty });
    loadAllData();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg">🍵</div>
            <h1 className="text-2xl font-extrabold text-gray-900">TIỆM NHÀ TÁO POS</h1>
          </div>
          {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs font-bold text-center">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" required placeholder="Tài khoản..." value={loginUser} onChange={(e)=>setLoginUser(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-600" />
            <input type="password" required placeholder="Mật khẩu..." value={loginPass} onChange={(e)=>setLoginPass(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-600" />
            <button type="submit" className="w-full py-3.5 bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg hover:bg-emerald-800 transition-all">ĐĂNG NHẬP POS</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} showLeftMenu={showLeftMenu} setShowLeftMenu={setShowLeftMenu} currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        <Header activeTab={activeTab} currentUser={currentUser} setShowLeftMenu={setShowLeftMenu} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onOpenAddProduct={() => { setEditingProduct({ name: '', price: 35000, category: categories[1] || 'Matcha Series', image: '🍵', stock: 50, is_available: true }); setShowProductModal(true); }} />

        {activeTab === 'pos' && (
          <PosView products={products} categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} searchTerm={searchTerm} onAddToCart={addToCart} currentUser={currentUser} onEditProduct={(item) => { setEditingProduct(item); setShowProductModal(true); }} onDeleteProduct={async (id) => { if (window.confirm('Xóa món này?')) { if (supabase) await supabase.from('products').delete().eq('id', id); await localDb.products.delete(id); loadAllData(); } }} onOpenCatModal={() => setShowCategoryModal(true)} cart={cart} onOpenCartModal={() => setShowCartModal(true)} finalTotal={finalTotal} />
        )}

        {activeTab === 'daily_report' && (
          <DailyReportView currentUser={currentUser} selectedReportDate={selectedReportDate} setSelectedReportDate={setSelectedReportDate} handlePrintDailyReport={() => { setPrintType('REPORT'); setTimeout(() => window.print(), 250); }} reportCashTotal={reportOrders.reduce((s, o) => s + Number(o.cash_amount || 0), 0)} reportTransferTotal={reportOrders.reduce((s, o) => s + Number(o.transfer_amount || 0), 0)} reportGrandTotal={reportOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)} reportOrders={reportOrders} setSelectedOrderDetails={setSelectedOrderDetails} />
        )}

        {activeTab === 'inventory' && currentUser.role === 'OWNER' && (
          <InventoryView inventory={inventory} priceHistoryLogs={priceHistoryLogs} onUpdateQty={updateInventoryQty} onOpenAddModal={openAddInventoryModal} onOpenEditModal={openEditInventoryModal} onDeleteModal={handleDeleteInventory} onOpenAuditA4={() => { setAuditData(inventory.map(item => ({ name: item.name, unit: item.unit, sysQty: item.quantity, barQty: 0, storeQty: item.quantity, wasteQty: 0 }))); setShowA4Modal(true); }} onExportExcel={() => {}} />
        )}

        {activeTab === 'tax' && currentUser.role === 'OWNER' && (
          <TaxTT88View taxStartDate={taxStartDate} setTaxStartDate={setTaxStartDate} taxEndDate={taxEndDate} setTaxEndDate={setTaxEndDate} exportTaxExcel={exportTaxExcel} taxPreviewData={taxPreviewData} />
        )}

        {activeTab === 'staff_mgr' && currentUser.role === 'OWNER' && (
          <StaffManagerView newStaffName={newStaffName} setNewStaffName={setNewStaffName} newStaffUser={newStaffUser} setNewStaffUser={setNewStaffUser} newStaffPass={newStaffPass} setNewStaffPass={setNewStaffPass} handleCreateStaff={async (e) => { e.preventDefault(); const p = { full_name: newStaffName, username: newStaffUser, password: newStaffPass, role: 'STAFF' }; if (supabase) await supabase.from('staff').insert([p]); await localDb.staff.add({ ...p, id: `local_staff_${Date.now()}` }); setNewStaffName(''); setNewStaffUser(''); setNewStaffPass(''); loadAllData(); }} staffList={staffList} handleDeleteStaff={async (id) => { if (supabase) await supabase.from('staff').delete().eq('id', id); await localDb.staff.delete(id); loadAllData(); }} />
        )}

        {activeTab === 'staff_issue' && (
          <IssueReportView reportType={reportType} setReportType={setReportType} newIssueTitle={newIssueTitle} setNewIssueTitle={setNewIssueTitle} selectedInvItem={selectedInvItem} setSelectedInvItem={setSelectedInvItem} inventory={inventory} reportQty={reportQty} setReportQty={setReportQty} newIssueContent={newIssueContent} setNewIssueContent={setNewIssueContent} handleSubmitReport={async (e) => { e.preventDefault(); const p = { staff_name: currentUser.full_name, title: `[${reportType}] ${newIssueTitle}`, content: newIssueContent, status: 'PENDING', created_at: new Date().toISOString() }; if (supabase) await supabase.from('issue_reports').insert([p]); await localDb.issue_reports.add(p); setNewIssueTitle(''); setNewIssueContent(''); alert('Đã gửi báo cáo!'); loadAllData(); }} issueReports={issueReports} currentUser={currentUser} handleApproveInventoryRequest={async (item) => { if (supabase) await supabase.from('issue_reports').update({ status: 'RESOLVED' }).eq('id', item.id); await localDb.issue_reports.update(item.id, { status: 'RESOLVED' }); loadAllData(); }} />
        )}
      </main>

      <CartModal showCartModal={showCartModal} setShowCartModal={setShowCartModal} cart={cart} setCart={setCart} subTotal={subTotal} discountPercent={discountPercent} setDiscountPercent={setDiscountPercent} finalTotal={finalTotal} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} onCheckout={handleCheckout} onUpdateQty={updateQty} />
      
      <PosModals showCategoryModal={showCategoryModal} setShowCategoryModal={setShowCategoryModal} categories={categories} newCatName={newCatName} setNewCatName={setNewCatName} handleAddCategory={async (e) => { e.preventDefault(); if (supabase) await supabase.from('categories').insert([{ name: newCatName }]); setCategories([...categories, newCatName]); setNewCatName(''); loadAllData(); }} editingCategory={editingCategory} setEditingCategory={setEditingCategory} editCatNewName={editCatNewName} setEditCatNewName={setEditCatNewName} handleUpdateCategoryName={async (old) => { if (supabase) await supabase.from('categories').update({ name: editCatNewName }).eq('name', old); loadAllData(); }} handleDeleteCategory={async (c) => { if (supabase) await supabase.from('categories').delete().eq('name', c); loadAllData(); }} showProductModal={showProductModal} setShowProductModal={setShowProductModal} editingProduct={editingProduct} setEditingProduct={setEditingProduct} handleSaveProduct={async (e) => { e.preventDefault(); if (supabase) await supabase.from('products').upsert([editingProduct]); loadAllData(); setShowProductModal(false); }} selectedOrderDetails={selectedOrderDetails} setSelectedOrderDetails={setSelectedOrderDetails} handleReprintHistoryOrder={(ord) => { setPrintType('ORDER'); setPrintOrder({ ...ord, items: JSON.parse(ord.items_json || '[]'), isReprint: true }); setTimeout(() => window.print(), 250); }} />

      <InventoryModals showInvModal={showInvModal} setShowInvModal={setShowInvModal} editingInvItem={editingInvItem} handleSaveInventory={handleSaveInventory} invFormMode={invFormMode} setInvFormMode={setInvFormMode} invForm={invForm} setInvForm={setInvForm} showA4Modal={showA4Modal} setShowA4Modal={setShowA4Modal} auditData={auditData} handleAuditInputChange={(idx, field, val) => setAuditData(auditData.map((row, i) => i === idx ? { ...row, [field]: val } : row))} handleSyncAuditToApp={async () => { for (const row of auditData) { const total = Number(row.barQty || 0) + Number(row.storeQty || 0); if (supabase) await supabase.from('inventory').update({ quantity: total }).eq('name', row.name); } alert('Đã đồng bộ tồn kho!'); loadAllData(); setShowA4Modal(false); }} handlePrintA4Audit={() => { setPrintType('A4_AUDIT'); setTimeout(() => window.print(), 250); }} />

      <PrintArea printType={printType} printOrder={printOrder} reportOrders={reportOrders} reportCashTotal={reportOrders.reduce((s, o) => s + Number(o.cash_amount || 0), 0)} reportTransferTotal={reportOrders.reduce((s, o) => s + Number(o.transfer_amount || 0), 0)} reportGrandTotal={reportOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)} currentUser={currentUser} selectedReportDate={selectedReportDate} auditData={auditData} BANK_CONFIG={BANK_CONFIG} />
    </div>
  );
}