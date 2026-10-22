import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { localDb } from './db';
import * as XLSX from 'xlsx';
import { 
  ShoppingCart, FileText, Printer, Plus, Minus, Trash2, 
  Search, QrCode, Package, UserCheck, Users, LogOut, Edit3, 
  AlertTriangle, Calendar, Eye, Download, Send, X, FolderPlus, Menu, CheckCircle2, AlertCircle
} from 'lucide-react';

// 🟢 THÔNG TIN SUPABASE DÃ ĐƯỢC ĐỒNG BỘ CHUẨN CỦA NÍ
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
  { id: 'prod_1', name: 'Matcha Latte Premium', price: 45000, category: 'Matcha Series', image: '🍵', stock: 45, is_available: true },
  { id: 'prod_2', name: 'Matcha Coco Espresso', price: 52000, category: 'Matcha Series', image: '🥥', stock: 28, is_available: true },
  { id: 'prod_3', name: 'Matcha Foam Kem Trứng', price: 49000, category: 'Matcha Series', image: '🍦', stock: 15, is_available: true },
  { id: 'prod_4', name: 'Cà Phê Sữa Đá Măng Đen', price: 29000, category: 'Cà Phê Măng Đen', image: '☕', stock: 99, is_available: true },
  { id: 'prod_5', name: 'Bạc Xỉu Sữa Hạnh Nhân', price: 35000, category: 'Cà Phê Măng Đen', image: '🥤', stock: 60, is_available: true },
  { id: 'prod_6', name: 'Trà Ô Long Sữa Nướng', price: 39000, category: 'Trà & Latte', image: '🧋', stock: 35, is_available: true }
];
const DEFAULT_INVENTORY = [
  { id: 'inv_1', name: 'Bột Matcha Uji Grade A', quantity: 12.5, unit: 'kg', min_quantity: 3 },
  { id: 'inv_2', name: 'Hạt Cà Phê Măng Đen', quantity: 25, unit: 'kg', min_quantity: 5 },
  { id: 'inv_3', name: 'Sữa Tươi Thanh Trùng', quantity: 40, unit: 'hộp', min_quantity: 10 },
  { id: 'inv_4', name: 'Trà Ô Long Nướng Grade 1', quantity: 8, unit: 'kg', min_quantity: 2 }
];

export default function App() {
  // 🟢 TRẠNG THÁI TÀI KHOẢN & ĐĂNG NHẬP
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // 🟢 TRẠNG THÁI GIAO DIỆN
  const [activeTab, setActiveTab] = useState('pos');
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

  // 🟢 TRẠNG THÁI POS & GIỎ HÀNG
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showQRModal, setShowQRModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  // 🟢 QUẢN LÝ DANH MỤC ĐỘNG
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // 🟢 LỊCH SỬ BILL & XEM CHI TIẾT
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [reprintOrder, setReprintOrder] = useState(null);

  // 🟢 DANH SÁCH MÓN NƯỚC & KHO
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // 🟢 QUẢN LÝ KHO NGUYÊN LIỆU
  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
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

  // Khởi tạo ứng dụng
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
    }
    
    const startApp = async () => {
      await initLocalDb();
      await loadAllData();
    };
    startApp();
  }, []);

  // 🔄 ĐỒNG BỘ NẦM CỨ MỖI 4 GIÂY (KHÔNG XOAY ICON LÀM LAG MÀN HÌNH)
  useEffect(() => {
    if (!currentUser) return;
    loadAllData();
    const interval = setInterval(() => {
      loadAllData();
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser, activeTab]);

  useEffect(() => {
    generateTaxPreview();
  }, [taxStartDate, taxEndDate, todayOrders]);

  // Khôi phục dữ liệu cục bộ mặc định nếu máy rỗng
  const initLocalDb = async () => {
    try {
      const existingCat = await localDb.categories.toArray();
      if (existingCat.length === 0) {
        await localDb.categories.bulkPut([
          { name: 'Matcha Series' },
          { name: 'Cà Phê Măng Đen' },
          { name: 'Trà & Latte' },
          { name: 'Bánh Sweet' }
        ]);
      }

      const existingProducts = await localDb.products.toArray();
      if (existingProducts.length === 0) {
        await localDb.products.bulkPut(DEFAULT_PRODUCTS);
      }

      const existingInv = await localDb.inventory.toArray();
      if (existingInv.length === 0) {
        await localDb.inventory.bulkPut(DEFAULT_INVENTORY);
      }
    } catch (err) {
      console.error('Lỗi DB local:', err);
    }
  };

  // 🔄 NẠP VÀ ĐỒNG BỘ DỮ LIỆU TỪ SUPABASE
  const loadAllData = async () => {
    try {
      if (supabase) {
        // 1. Nhân viên
        const { data: cloudStaff } = await supabase.from('staff').select('*');
        if (cloudStaff && cloudStaff.length > 0) {
          await localDb.staff.clear();
          await localDb.staff.bulkPut(cloudStaff);
        }

        // 2. Món nước
        const { data: cloudProducts } = await supabase.from('products').select('*');
        if (cloudProducts && cloudProducts.length > 0) {
          await localDb.products.clear();
          await localDb.products.bulkPut(cloudProducts);
        } else {
          autoSeedCloudProducts();
        }

        // 3. Đơn hàng
        const { data: cloudOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (cloudOrders && cloudOrders.length > 0) {
          await localDb.orders.clear();
          await localDb.orders.bulkPut(cloudOrders);
        }

        // 4. Kho nguyên liệu
        const { data: cloudInv } = await supabase.from('inventory').select('*');
        if (cloudInv && cloudInv.length > 0) {
          await localDb.inventory.clear();
          await localDb.inventory.bulkPut(cloudInv);
        } else {
          autoSeedCloudInventory();
        }

        // 5. Danh mục
        const { data: cloudCat } = await supabase.from('categories').select('*');
        if (cloudCat && cloudCat.length > 0) {
          await localDb.categories.clear();
          await localDb.categories.bulkPut(cloudCat);
        }

        // 6. Báo cáo sự cố
        const { data: cloudIssues } = await supabase.from('issue_reports').select('*');
        if (cloudIssues && cloudIssues.length > 0) {
          await localDb.issue_reports.clear();
          await localDb.issue_reports.bulkPut(cloudIssues);
        }
      }

      const catList = await localDb.categories.toArray();
      setCategories(['Tất cả', ...catList.map(c => c.name)]);
      
      const prodList = await localDb.products.toArray();
      if (prodList.length > 0) setProducts(prodList);

      const invList = await localDb.inventory.toArray();
      if (invList.length > 0) setInventory(invList);

      setStaffList(await localDb.staff.toArray());
      const issueList = await localDb.issue_reports.toArray();
      setIssueReports(issueList.reverse());
      fetchTodayOrders();
    } catch (err) {
      console.error('Lỗi nạp dữ liệu:', err);
    }
  };

  const autoSeedCloudProducts = async () => {
    if (!supabase) return;
    try {
      for (const cat of DEFAULT_CATEGORIES.filter(c => c !== 'Tất cả')) {
        await supabase.from('categories').upsert([{ name: cat }], { onConflict: 'name' });
      }
      for (const p of DEFAULT_PRODUCTS) {
        await supabase.from('products').insert([{ name: p.name, price: p.price, category: p.category, image: p.image, stock: p.stock, is_available: true }]);
      }
    } catch (e) {}
  };

  const autoSeedCloudInventory = async () => {
    if (!supabase) return;
    try {
      for (const inv of DEFAULT_INVENTORY) {
        await supabase.from('inventory').insert([{ name: inv.name, quantity: inv.quantity, unit: inv.unit, min_quantity: inv.min_quantity }]);
      }
    } catch (e) {}
  };

  // 📂 QUẢN LÝ DANH MỤC MÓN
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    if (categories.includes(name)) return alert('Danh mục này đã tồn tại!');

    await localDb.categories.add({ name });
    if (supabase) {
      try { await supabase.from('categories').insert([{ name }]); } catch (err) {}
    }
    setNewCatName('');
    loadAllData();
  };

  const handleDeleteCategory = async (catName) => {
    if (catName === 'Tất cả') return alert('Không thể xóa danh mục này!');
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${catName}"?`)) return;

    const allCats = await localDb.categories.toArray();
    const catObj = allCats.find(c => c.name === catName);
    if (catObj) await localDb.categories.delete(catObj.id);

    if (supabase) {
      try { await supabase.from('categories').delete().eq('name', catName); } catch (err) {}
    }
    if (selectedCategory === catName) setSelectedCategory('Tất cả');
    loadAllData();
  };

  // 🟢 ĐĂNG NHẬP
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

    const allStaff = await localDb.staff.toArray();
    const localStaff = allStaff.find(s => s.username === loginUser);
    if (localStaff && localStaff.password === loginPass) {
      const user = { full_name: localStaff.full_name, username: localStaff.username, role: localStaff.role };
      setCurrentUser(user);
      localStorage.setItem('pos_current_user', JSON.stringify(user));
      return;
    }

    setLoginError('Tài khoản hoặc mật khẩu không chính xác!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
    setCart([]);
  };

  // 🟢 CẤP TÀI KHOẢN NHÂN VIÊN (LOẠI BỎ ID CỤC BỘ TRÁNH LỖI UUID)
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffUser || !newStaffPass) return alert('Vui lòng nhập đủ thông tin!');

    const staffData = {
      full_name: newStaffName,
      username: newStaffUser.trim(),
      password: newStaffPass.trim(),
      role: 'STAFF'
    };

    // 1. Lưu vào bộ nhớ máy
    await localDb.staff.add(staffData);

    // 2. Đẩy lên Supabase (Không truyền ID cục bộ số "1")
    if (supabase) {
      try { 
        const { error } = await supabase.from('staff').insert([staffData]);
        if (error) {
          alert(`⚠️ Đã lưu máy tính nhưng lỗi Cloud: ${error.message}`);
        } else {
          alert(`✅ Đã cấp thành công tài khoản "${newStaffName}" lên Cloud!`);
        }
      } catch (err) {
        alert(`Lỗi kết nối: ${err.message}`);
      }
    }

    setNewStaffName(''); setNewStaffUser(''); setNewStaffPass('');
    await loadAllData();
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    const staffObj = await localDb.staff.get(id);
    await localDb.staff.delete(id);

    if (staffObj && supabase) {
      try { await supabase.from('staff').delete().eq('username', staffObj.username); } catch (err) {}
    }
    loadAllData();
  };

  // 🟢 QUẢN LÝ MÓN NƯỚC (THÊM / SỬA / XÓA)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) return;

    const prodPayload = {
      name: editingProduct.name,
      price: Number(editingProduct.price),
      category: editingProduct.category,
      image: editingProduct.image || '🍵',
      stock: Number(editingProduct.stock) || 50,
      is_available: true
    };

    if (editingProduct.id) {
      await localDb.products.update(editingProduct.id, prodPayload);
      if (supabase && typeof editingProduct.id === 'string' && editingProduct.id.length > 20) {
        try { await supabase.from('products').update(prodPayload).eq('id', editingProduct.id); } catch (err) {}
      }
    } else {
      await localDb.products.add(prodPayload);
      if (supabase) {
        try { await supabase.from('products').insert([prodPayload]); } catch (err) {}
      }
    }

    setShowProductModal(false);
    setEditingProduct(null);
    loadAllData();
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa món nước này khỏi menu?')) return;
    await localDb.products.delete(id);
    if (supabase) {
      try { await supabase.from('products').delete().eq('id', id); } catch (err) {}
    }
    loadAllData();
  };

  // 🟢 QUẢN LÝ KHO NGUYÊN LIỆU
  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!newInvItem.name) return;
    const item = { 
      name: newInvItem.name, 
      quantity: Number(newInvItem.quantity), 
      unit: newInvItem.unit, 
      min_quantity: Number(newInvItem.min_quantity) 
    };

    await localDb.inventory.add(item);
    if (supabase) {
      try { await supabase.from('inventory').insert([item]); } catch (err) {}
    }
    setNewInvItem({ name: '', quantity: 10, unit: 'kg', min_quantity: 3 });
    setShowInvModal(false);
    loadAllData();
  };

  const updateInventoryQty = async (id, delta) => {
    const item = await localDb.inventory.get(id);
    if (item) {
      const newQty = Math.max(0, Number(item.quantity) + delta);
      await localDb.inventory.update(id, { quantity: newQty });
      if (supabase) {
        try { await supabase.from('inventory').update({ quantity: newQty }).eq('id', id); } catch (err) {}
      }
      loadAllData();
    }
  };

  const exportInventoryExcel = () => {
    const rows = [
      ["BÁO CÁO TỒN KHO NGUYÊN LIỆU - TIỆM NHÀ TÁO POS"],
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

  // 🟢 KÊ KHAI THUẾ TT88 (CHUẨN THÔNG TƯ 88/2021/TT-BTC)
  const generateTaxPreview = async () => {
    const orders = await localDb.orders.toArray();
    const dailyMap = {};

    orders.forEach(ord => {
      const ordDateStr = new Date(ord.created_at).toISOString().split('T')[0];
      if (ordDateStr >= taxStartDate && ordDateStr <= taxEndDate) {
        const displayDate = new Date(ord.created_at).toLocaleDateString('vi-VN');
        if (!dailyMap[displayDate]) dailyMap[displayDate] = { cash: 0, transfer: 0, total: 0 };
        dailyMap[displayDate].cash += Number(ord.cash_amount || 0);
        dailyMap[displayDate].transfer += Number(ord.transfer_amount || 0);
        dailyMap[displayDate].total += Number(ord.total_amount || 0);
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
      [`Tên hộ kinh doanh: TIỆM NHÀ TÁO POS`],
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

  // 🟢 BÁO CÁO SỰ CỐ QUÁN
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
    if (supabase) {
      try { await supabase.from('issue_reports').insert([report]); } catch (err) {}
    }
    setNewIssueTitle(''); setNewIssueContent('');
    alert('Đã gửi báo cáo lên Chủ Quán!');
    loadAllData();
  };

  const resolveIssue = async (id) => {
    await localDb.issue_reports.update(id, { status: 'RESOLVED' });
    if (supabase) {
      try { await supabase.from('issue_reports').update({ status: 'RESOLVED' }).eq('id', id); } catch (err) {}
    }
    loadAllData();
  };

  // 🟢 POS ORDER & THANH TOÁN
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
    if (!product.is_available || product.stock <= 0) return alert('Món này tạm thời báo hết!');
    const exist = cart.find(x => x.name === product.name);
    if (exist) {
      if (exist.qty >= product.stock) return alert(`Số lượng trong giỏ đã đạt tối đa tồn kho (${product.stock})!`);
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
    const orderData = {
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

    await localDb.orders.add(orderData);
    if (supabase) {
      try { await supabase.from('orders').insert([orderData]); } catch (err) {}
    }

    for (const cartItem of cart) {
      const p = products.find(x => x.name === cartItem.name);
      if (p) {
        const updatedStock = Math.max(0, (p.stock || 0) - cartItem.qty);
        if (p.id) await localDb.products.update(p.id, { stock: updatedStock, is_available: updatedStock > 0 });
        if (supabase && p.id) {
          try { await supabase.from('products').update({ stock: updatedStock, is_available: updatedStock > 0 }).eq('id', p.id); } catch (err) {}
        }
      }
    }

    setReprintOrder(null);
    setTimeout(() => { window.print(); }, 100);

    setCart([]);
    setShowQRModal(false);
    setShowCartModal(false);
    setDiscountPercent(0);
    loadAllData();
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

  // 🔴 MÀN HÌNH ĐĂNG NHẬP (ANIMATION BẮT MẮT)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 -right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 border border-white/20 transition-all duration-300 transform animate-in fade-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-400 text-white rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-xl shadow-emerald-600/30 transform hover:rotate-6 transition-transform">🍵</div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">TIỆM NHÀ TÁO POS</h1>
            <p className="text-xs text-gray-500 font-medium">Hệ thống quản lý bán hàng Matcha & Coffee</p>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs font-bold text-center border border-red-200 animate-bounce">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Tên đăng nhập:</label>
              <input type="text" required placeholder="Nhập tài khoản..." value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Mật khẩu:</label>
              <input type="password" required placeholder="Nhập mật khẩu..." value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all" />
            </div>
            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-700/25 active:scale-95 transition-all">
              ĐĂNG NHẬP POS
            </button>
          </form>

          <div className="text-center text-[11px] text-gray-400">
            Tài khoản Chủ Quán: <span className="font-bold text-gray-700">admin / 123456</span>
          </div>
        </div>
      </div>
    );
  }

  // 🟢 MÀN HÌNH CHÍNH POS
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
      
      {showLeftMenu && (
        <div onClick={() => setShowLeftMenu(false)} className="fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-sm transition-opacity" />
      )}

      {/* THANH SIDEBAR MENU BÊN TRÁI (HIỆU ỨNG TRƯỢT VÀ NỔI ĐẸP MẮT) */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300 ease-out ${showLeftMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-600/30">🍵</div>
              <div>
                <h1 className="font-extrabold text-sm text-white tracking-wide">TIỆM NHÀ TÁO</h1>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">POS Cloud Ready</span>
              </div>
            </div>
            <button onClick={() => setShowLeftMenu(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"><X size={20} /></button>
          </div>

          <nav className="p-3 space-y-1.5">
            <button onClick={() => { setActiveTab('pos'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'pos' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}><ShoppingCart size={17} /> <span>1. POS Gọi Món</span></button>
            <button onClick={() => { setActiveTab('daily_report'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'daily_report' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}><FileText size={17} /> <span>2. Doanh Thu Ngày</span></button>
            <button onClick={() => { setActiveTab('staff_issue'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'staff_issue' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}><AlertTriangle size={17} /> <span>3. Hòm Thư Sự Cố</span></button>
            {currentUser.role === 'OWNER' && (
              <>
                <button onClick={() => { setActiveTab('inventory'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}><Package size={17} /> <span>4. Quản Lý Tồn Kho</span></button>
                <button onClick={() => { setActiveTab('tax'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'tax' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}><FileText size={17} /> <span>5. Kê Khai Thuế TT88</span></button>
                <button onClick={() => { setActiveTab('staff_mgr'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${activeTab === 'staff_mgr' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}><Users size={17} /> <span>6. Cấp Quyền Nhân Viên</span></button>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">{currentUser.full_name}</div>
            <div className="text-[10px] text-emerald-400 font-semibold uppercase">{currentUser.role === 'OWNER' ? '👑 Chủ Quán' : '👤 Nhân Viên'}</div>
          </div>
          <button onClick={handleLogout} title="Đăng xuất" className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        
        {/* HEADER TOP ĐIỀU HƯỚNG SANG TRỌNG */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 md:px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowLeftMenu(true)} className="p-2.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-md flex items-center gap-2">
              <Menu size={18} />
              <span className="text-xs font-bold hidden sm:inline">Menu</span>
            </button>

            <h2 className="text-sm md:text-base font-extrabold text-gray-800 truncate">
              {activeTab === 'pos' && '🛒 POS Bán Hàng'}
              {activeTab === 'daily_report' && '📊 Doanh Thu Ngày'}
              {activeTab === 'inventory' && '📦 Quản Lý Tồn Kho'}
              {activeTab === 'tax' && '📄 Kê Khai Thuế TT88'}
              {activeTab === 'staff_mgr' && '👥 Cấp Quyền Nhân Viên'}
              {activeTab === 'staff_issue' && '💬 Hòm Thư Báo Sự Cố'}
            </h2>
          </div>

          {activeTab === 'pos' && (
            <div className="flex items-center gap-2">
              {currentUser.role === 'OWNER' && (
                <button 
                  onClick={() => { setEditingProduct({ name: '', price: 35000, category: categories[1] || 'Matcha Series', image: '🍵', stock: 50, is_available: true }); setShowProductModal(true); }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-2xl flex items-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
                >
                  <Plus size={15} /> <span className="hidden sm:inline">Thêm Món</span>
                </button>
              )}
              <div className="relative w-36 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Tìm món..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-gray-100 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none transition-all" />
              </div>
            </div>
          )}
        </header>

        {/* 🛒 1. MÀN HÌNH POS GỌI MÓN */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4">
              
              {/* THANH DANH MỤC CÓ THÊM MÓN */}
              <div className="flex gap-2 overflow-x-auto pb-1 items-center scrollbar-none">
                {categories.map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap shadow-sm ${selectedCategory === cat ? 'bg-amber-800 text-white shadow-amber-900/20' : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'}`}
                  >
                    {cat}
                  </button>
                ))}

                {currentUser.role === 'OWNER' && (
                  <button 
                    onClick={() => setShowCategoryModal(true)}
                    className="px-3 py-2 rounded-2xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 shrink-0 transition-all shadow-sm"
                  >
                    <FolderPlus size={14} /> Danh mục
                  </button>
                )}
              </div>

              {/* LƯỚI THẺ MÓN NƯỚC (HIỆU ỨNG TƯƠI TẮN) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 pb-24">
                {filteredProducts.map((item, idx) => (
                  <div 
                    key={item.id || idx} 
                    className={`group bg-white rounded-3xl p-3.5 border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between relative overflow-hidden transform hover:-translate-y-1 ${(!item.is_available || item.stock <= 0) ? 'opacity-50 grayscale' : ''}`}
                  >
                    {currentUser.role === 'OWNER' && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10 bg-white/90 backdrop-blur rounded-xl p-1 shadow">
                        <button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); setShowProductModal(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                      </div>
                    )}

                    <div onClick={() => addToCart(item)} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="text-3xl p-2 bg-emerald-50/80 rounded-2xl group-hover:scale-110 transition-transform">{item.image}</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${item.is_available && item.stock > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {item.is_available && item.stock > 0 ? `Kho: ${item.stock}` : 'HẾT'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-gray-800 text-xs md:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.category}</p>
                      </div>
                    </div>

                    <div onClick={() => addToCart(item)} className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between cursor-pointer">
                      <span className="font-black text-emerald-800 text-xs md:text-sm">{item.price.toLocaleString()} đ</span>
                      <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md group-hover:bg-emerald-600 transition-colors"><Plus size={15} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* THANH GIỎ HÀNG NỔI */}
            <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl text-white p-3.5 rounded-3xl flex items-center justify-between shadow-2xl z-30 border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3">
                <div className="relative bg-gradient-to-tr from-emerald-600 to-teal-500 p-3 rounded-2xl shadow-lg shadow-emerald-900/50">
                  <ShoppingCart size={20} />
                  {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">{cart.reduce((s, x) => s + x.qty, 0)}</span>}
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-400">{finalTotal.toLocaleString()} VNĐ</div>
                  <div className="text-[10px] text-gray-400 font-medium">{cart.length === 0 ? 'Chưa chọn món' : `Đã chọn ${cart.length} món`}</div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (cart.length === 0) return alert('Vui lòng chọn món nước trước khi thanh toán!');
                  setShowCartModal(true);
                }} 
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-2"
              >
                <Printer size={16} /> THANH TOÁN & IN BILL
              </button>
            </div>
          </div>
        )}

        {/* 📦 2. QUẢN LÝ TỒN KHO */}
        {activeTab === 'inventory' && currentUser.role === 'OWNER' && (
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm">
              <div>
                <h3 className="text-sm md:text-base font-extrabold text-gray-800">Quản Lý Tồn Kho Nguyên Liệu</h3>
                <p className="text-[11px] text-gray-500">Thêm mặt hàng mới, điều chỉnh số lượng tồn và xuất file Excel.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={exportInventoryExcel} className="flex-1 sm:flex-none bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all">
                  <Download size={14} /> Xuất Excel
                </button>
                <button onClick={() => setShowInvModal(true)} className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all">
                  <Plus size={14} /> Thêm Kho
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead className="bg-gray-50 font-bold border-b text-gray-600">
                  <tr>
                    <th className="p-3.5">Tên Nguyên Liệu</th>
                    <th className="p-3.5">Tồn Kho</th>
                    <th className="p-3.5">Đơn Vị</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-center">Điều Chỉnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map((item, idx) => {
                    const isLow = item.quantity <= item.min_quantity;
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-extrabold text-gray-800">{item.name}</td>
                        <td className="p-3.5 font-black text-emerald-800 text-sm">{item.quantity}</td>
                        <td className="p-3.5 font-semibold text-gray-500">{item.unit}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isLow ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {isLow ? '⚠️ Sắp hết' : '✓ An toàn'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex justify-center items-center gap-2">
                            <button onClick={() => updateInventoryQty(item.id, -1)} className="w-7 h-7 rounded-xl bg-gray-100 font-bold hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-xs active:scale-95 transition-all">-</button>
                            <button onClick={() => updateInventoryQty(item.id, 1)} className="w-7 h-7 rounded-xl bg-gray-100 font-bold hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center text-xs active:scale-95 transition-all">+</button>
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

        {/* 📄 3. KÊ KHAI THUẾ TT88 (KHÔI PHỤC ĐẦY ĐỦ THÔNG TƯ 88) */}
        {activeTab === 'tax' && currentUser.role === 'OWNER' && (
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <h3 className="text-sm md:text-base font-extrabold text-gray-800">Bảng Kê Khai Thuế Doanh Thu (Thông Tư 88/2021/TT-BTC)</h3>
              <p className="text-[11px] text-gray-500">Chọn khoảng thời gian để tổng hợp tiền mặt & chuyển khoản trước khi xuất file Excel chuẩn.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Từ ngày:</label>
                  <input type="date" value={taxStartDate} onChange={(e) => setTaxStartDate(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Đến ngày:</label>
                  <input type="date" value={taxEndDate} onChange={(e) => setTaxEndDate(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <div className="flex items-end">
                  <button onClick={exportTaxExcel} className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all">
                    <Download size={14} /> Xuất Excel TT88
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-extrabold text-xs text-gray-800 flex items-center gap-1.5"><Eye size={15} className="text-emerald-700" /> Xem Trước Dữ Liệu Bảng Kê Khai</h4>
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Tổng: {taxPreviewData.reduce((s,x)=>s+x.total,0).toLocaleString()} đ
                </span>
              </div>

              <div className="border rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[420px]">
                  <thead className="bg-emerald-50 font-bold border-b text-emerald-900">
                    <tr>
                      <th className="p-3">STT</th>
                      <th className="p-3">Ngày / Tháng / Năm</th>
                      <th className="p-3">Tiền Mặt (VNĐ)</th>
                      <th className="p-3">Chuyển Khoản (VNĐ)</th>
                      <th className="p-3 text-right">Tổng Doanh Thu Ngày</th>
                    </tr>
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
                          <td className="p-3 text-right font-black text-gray-900">{row.total.toLocaleString()} đ</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 📊 4. DOANH THU & LỊCH SỬ BILL (KHÔI PHỤC POPUP XEM CHI TIẾT) */}
        {activeTab === 'daily_report' && (
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-5 md:p-6 border border-gray-200/80 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="text-base md:text-lg font-extrabold text-gray-800">Doanh Thu Ngày {new Date().toLocaleDateString('vi-VN')}</h3>
                  <p className="text-[11px] text-gray-500">Thu ngân ca: <span className="font-bold text-emerald-700">{currentUser.full_name}</span></p>
                </div>
                <button onClick={() => { setReprintOrder(null); window.print(); }} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all">
                  <Printer size={15} /> In Báo Cáo Ca
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">💵 Tiền Mặt</div><div className="text-lg font-black text-emerald-700 mt-1">{todayCash.toLocaleString()} đ</div></div>
                <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100"><div className="text-xs text-blue-800 font-bold">💳 Chuyển Khoản</div><div className="text-lg font-black text-blue-700 mt-1">{todayTransfer.toLocaleString()} đ</div></div>
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-100"><div className="text-xs text-amber-800 font-bold">🔥 TỔNG DOANH THU</div><div className="text-lg font-black text-amber-800 mt-1">{todayTotal.toLocaleString()} đ</div></div>
              </div>

              <div className="border rounded-2xl overflow-hidden space-y-1.5">
                <div className="bg-gray-100 px-4 py-2.5 font-bold text-xs text-gray-700 border-b">
                  Lịch Sử Hóa Đơn Phát Sinh Trong Ngày ({todayOrders.length} đơn)
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[420px]">
                    <thead className="bg-gray-50 font-bold border-b text-gray-600">
                      <tr>
                        <th className="p-3">Mã HD / Giờ</th>
                        <th className="p-3">Người Bán</th>
                        <th className="p-3">Hình Thức</th>
                        <th className="p-3 text-right">Tổng Tiền</th>
                        <th className="p-3 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {todayOrders.length === 0 ? (
                        <tr><td colSpan="5" className="p-4 text-center text-gray-400">Chưa có hóa đơn nào phát sinh hôm nay.</td></tr>
                      ) : (
                        todayOrders.map((ord, i) => {
                          const items = ord.items_json ? JSON.parse(ord.items_json) : [];
                          return (
                            <tr key={i} className="hover:bg-emerald-50/50 transition-colors">
                              <td className="p-3 font-semibold text-gray-800">
                                <div className="font-extrabold text-gray-900">#{ord.code || 'HD'}</div>
                                <div className="text-[10px] text-gray-400">{new Date(ord.created_at).toLocaleTimeString('vi-VN')}</div>
                              </td>
                              <td className="p-3 font-semibold text-gray-700">{ord.staff_name}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${ord.payment_method === 'CASH' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {ord.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                                </span>
                              </td>
                              <td className="p-3 text-right font-black text-emerald-700">{Number(ord.total_amount).toLocaleString()} đ</td>
                              <td className="p-3 text-center">
                                <button 
                                  onClick={() => setSelectedOrderDetails(ord)}
                                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-bold text-[10px] flex items-center gap-1 mx-auto transition-colors"
                                >
                                  <Eye size={12} /> Xem ({items.length})
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
          </div>
        )}

        {/* 👥 5. CẤP TÀI KHOẢN NHÂN VIÊN */}
        {activeTab === 'staff_mgr' && currentUser.role === 'OWNER' && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto space-y-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xl space-y-4">
              <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5"><UserCheck className="text-emerald-700" size={18} /> Cấp Tài Khoản Nhân Viên Mới</h3>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" required placeholder="Họ tên nhân viên" value={newStaffName} onChange={(e)=>setNewStaffName(e.target.value)} className="border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                <input type="text" required placeholder="Tên đăng nhập" value={newStaffUser} onChange={(e)=>setNewStaffUser(e.target.value)} className="border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                <input type="password" required placeholder="Mật khẩu" value={newStaffPass} onChange={(e)=>setNewStaffPass(e.target.value)} className="border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                <div className="sm:col-span-3">
                  <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs shadow-md active:scale-95 transition-all">+ Cấp Tài Khoản</button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xl space-y-3">
              <h3 className="font-extrabold text-gray-800 text-xs">Danh Sách Nhân Viên Đã Cấp Quyền</h3>
              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 font-bold border-b"><tr><th className="p-3">Họ Tên</th><th className="p-3">Tên Đăng Nhập</th><th className="p-3">Thao Tác</th></tr></thead>
                  <tbody className="divide-y">
                    {staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold">{s.full_name}</td>
                        <td className="p-3 text-emerald-700 font-semibold">{s.username}</td>
                        <td className="p-3"><button onClick={() => handleDeleteStaff(s.id)} className="text-red-500 font-bold hover:text-red-700">Xóa</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 💬 6. BÁO CÁO SỰ CỐ QUÁN */}
        {activeTab === 'staff_issue' && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto space-y-4 animate-in fade-in duration-200">
            {currentUser.role === 'STAFF' && (
              <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xl space-y-3">
                <h3 className="font-extrabold text-gray-800 text-xs md:text-sm flex items-center gap-1.5"><AlertTriangle size={18} className="text-amber-600" /> Báo Cáo Hết Món / Sự Cố Cho Chủ Quán</h3>
                <form onSubmit={handleSubmitIssue} className="space-y-3">
                  <input type="text" required placeholder="Tiêu đề báo cáo..." value={newIssueTitle} onChange={(e) => setNewIssueTitle(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                  <textarea rows="3" required placeholder="Nội dung gửi Chủ Quán..." value={newIssueContent} onChange={(e) => setNewIssueContent(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600"></textarea>
                  <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"><Send size={14} /> Gửi Báo Cáo</button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xl space-y-3">
              <h3 className="font-extrabold text-gray-800 text-xs">Hòm Thư Báo Cáo Sự Cố Quán</h3>
              <div className="space-y-2">
                {issueReports.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Chưa có báo cáo sự cố nào.</p>
                ) : (
                  issueReports.map(item => (
                    <div key={item.id} className="p-3.5 rounded-2xl border bg-gray-50 flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-gray-800">{item.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status === 'RESOLVED' ? 'Đã xử lý' : 'Chờ xử lý'}</span>
                        </div>
                        <p className="text-xs text-gray-600">{item.content}</p>
                        <div className="text-[10px] text-gray-400">Người gửi: {item.staff_name} • {new Date(item.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                      {currentUser.role === 'OWNER' && item.status !== 'RESOLVED' && (
                        <button onClick={() => resolveIssue(item.id)} className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm active:scale-95 transition-all">Đã xử lý</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 🧾 POPUP GIỎ HÀNG & THANH TOÁN */}
      {showCartModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-emerald-700" size={20} />
                <h3 className="font-extrabold text-base text-gray-800">Xác Nhận Đơn Hàng</h3>
              </div>
              <button onClick={() => setShowCartModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border-b pb-3">
              {cart.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-2xl border flex flex-col gap-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">{item.name}</h4>
                      <span className="text-[10px] font-semibold text-emerald-700">{item.price.toLocaleString()} đ</span>
                    </div>
                    <span className="font-bold text-xs text-gray-800">{(item.price * item.qty).toLocaleString()} đ</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <input type="text" placeholder="Ghi chú (VD: Ít đường, nhiều đá...)" value={item.note || ''} onChange={(e) => setCart(cart.map(x => x.name === item.name ? { ...x, note: e.target.value } : x))} className="text-[10px] bg-white border rounded-xl px-2.5 py-1 w-44 outline-none" />
                    <div className="flex items-center gap-1 bg-white border rounded-xl p-0.5">
                      <button onClick={() => updateQty(item.name, -1)} className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-gray-100"><Minus size={12} /></button>
                      <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.name, 1)} className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-gray-100"><Plus size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              <div className="flex justify-between text-gray-500"><span>Tạm tính:</span><span className="font-semibold text-gray-800">{subTotal.toLocaleString()} đ</span></div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Giảm giá (%):</span>
                <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="w-14 text-right border rounded-lg px-2 py-0.5 font-bold text-emerald-700" />
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t"><span>Tổng thanh toán:</span><span className="text-emerald-700">{finalTotal.toLocaleString()} VNĐ</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentMethod('CASH')} className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${paymentMethod === 'CASH' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-gray-600'}`}>💵 Tiền Mặt</button>
              <button onClick={() => setPaymentMethod('TRANSFER')} className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${paymentMethod === 'TRANSFER' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-gray-600'}`}><QrCode size={14} className="inline mr-1" /> Chuyển Khoản</button>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCartModal(false)} className="flex-1 py-3 border rounded-2xl font-bold text-xs text-gray-600 hover:bg-gray-100">Hủy</button>
              <button onClick={handleCheckout} className="flex-2 py-3 bg-amber-800 hover:bg-amber-900 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs active:scale-95 transition-all">
                <Printer size={16} /> IN BILL & HOÀN TẤT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP QUẢN LÝ DANH MỤC */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
                <FolderPlus size={16} className="text-amber-700" /> Quản Lý Danh Mục
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input 
                type="text" 
                required 
                placeholder="Tên danh mục..." 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)} 
                className="flex-1 border rounded-2xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button type="submit" className="bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-2xl text-xs shadow-md shrink-0">
                + Thêm
              </button>
            </form>

            <div className="space-y-1.5 max-h-48 overflow-y-auto border-t pt-2">
              {categories.filter(c => c !== 'Tất cả').map((cat) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border text-xs font-bold text-gray-800">
                  <span>{cat}</span>
                  <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-red-500 hover:text-red-700">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => setShowCategoryModal(false)} className="w-full py-2 border rounded-2xl font-bold text-xs text-gray-600">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* POPUP CHI TIẾT BILL LỊCH SỬ (KHÔI PHỤC HOÀN CHỈNH) */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800">Chi Tiết Hóa Đơn #{selectedOrderDetails.code || 'HD'}</h3>
                <p className="text-[10px] text-gray-500">
                  {new Date(selectedOrderDetails.created_at).toLocaleString('vi-VN')} • Thu ngân: {selectedOrderDetails.staff_name}
                </p>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 border-b pb-2">
              {(() => {
                const items = selectedOrderDetails.items_json ? JSON.parse(selectedOrderDetails.items_json) : [];
                return items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                    <div>
                      <div className="font-bold text-gray-800 text-xs">{it.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {it.price?.toLocaleString()} đ x <span className="font-bold text-emerald-700">{it.qty}</span>
                        {it.note ? <span className="text-amber-600 italic"> ({it.note})</span> : ''}
                      </div>
                    </div>
                    <div className="font-extrabold text-emerald-800 text-xs">
                      {((it.price || 0) * (it.qty || 1)).toLocaleString()} đ
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-between text-xs font-extrabold text-gray-900 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
              <span>Hình thức thanh toán:</span>
              <span className="text-emerald-700">{selectedOrderDetails.payment_method === 'CASH' ? ' Tiền mặt' : ' Chuyển khoản'}</span>
            </div>

            <div className="flex justify-between text-sm font-black text-gray-900">
              <span>Tổng thanh toán:</span>
              <span className="text-emerald-700">{Number(selectedOrderDetails.total_amount).toLocaleString()} VNĐ</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setSelectedOrderDetails(null)} className="flex-1 py-2.5 border rounded-2xl font-bold text-xs text-gray-600">Đóng</button>
              <button onClick={() => handleReprintHistoryOrder(selectedOrderDetails)} className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all">
                <Printer size={14} /> In Lại Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÊM/SỬA MÓN NƯỚC */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-gray-800">{editingProduct.id ? 'Chỉnh Sửa Món Nước' : 'Thêm Món Nước Mới'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên món nước:</label>
                <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Giá bán (VNĐ):</label>
                  <input type="number" required value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Emoji Biểu Tượng:</label>
                  <input type="text" required value={editingProduct.image} onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold text-center outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Danh mục món:</label>
                <select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600">
                  {categories.filter(c => c !== 'Tất cả').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-2.5 border rounded-2xl font-bold text-gray-600">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">Lưu Món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP THÊM NGUYÊN LIỆU KHO */}
      {showInvModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-800">Thêm Nguyên Liệu Mới</h3>
            <form onSubmit={handleAddInventory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên nguyên liệu:</label>
                <input type="text" required value={newInvItem.name} onChange={(e) => setNewInvItem({ ...newInvItem, name: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Số lượng tồn:</label>
                  <input type="number" required value={newInvItem.quantity} onChange={(e) => setNewInvItem({ ...newInvItem, quantity: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Đơn vị tính:</label>
                  <input type="text" required placeholder="kg, hộp..." value={newInvItem.unit} onChange={(e) => setNewInvItem({ ...newInvItem, unit: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowInvModal(false)} className="flex-1 py-2.5 border rounded-2xl font-bold text-gray-600">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">Lưu Kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP VIETQR MBBANK */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-gray-800">Quét Mã VietQR MBBank</h3>
            
            <div className="p-2 bg-gray-50 rounded-2xl inline-block border border-gray-200 shadow-inner">
              <img 
                src={dynamicQrUrl} 
                alt="MBBank VietQR" 
                className="w-48 h-48 object-contain rounded-xl" 
              />
            </div>

            <div className="text-center font-black text-emerald-700 text-base">
              {finalTotal.toLocaleString()} VNĐ
            </div>
            <div className="text-[10px] font-bold text-gray-600">
              {BANK_CONFIG.ACCOUNT_NAME} - {BANK_CONFIG.ACCOUNT_NO}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowQRModal(false)} className="flex-1 py-2.5 rounded-2xl border text-xs font-bold text-gray-600">Hủy</button>
              <button onClick={handleCheckout} className="flex-1 py-2.5 rounded-2xl bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all">Đã Nhận Tiền</button>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ KHU VỰC IN BILL MÁY IN KHỔ GIẤY K80 */}
      <div id="print-area" className="hidden print:block p-2 text-[11px] font-mono leading-tight">
        <div className="text-center font-extrabold text-sm uppercase">TIỆM NHÀ TÁO POS</div>
        <div className="text-center text-[10px]">Cửa Hàng Matcha & Cà Phê</div>
        <div className="border-b border-black my-1 border-dashed"></div>

        {reprintOrder ? (
          <div>
            <div className="text-center font-bold text-xs my-0.5">[ IN LẠI HÓA ĐƠN ]</div>
            <div className="flex justify-between text-[10px]">
              <span>Mã HD: #{reprintOrder.code || 'BILL'}</span>
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
              <span>Mã HD: #{Date.now().toString().slice(-6)}</span>
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
