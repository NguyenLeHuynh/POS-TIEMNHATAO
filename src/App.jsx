import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { localDb } from './db';
import * as XLSX from 'xlsx';
import { 
  ShoppingCart, FileText, Printer, Plus, Minus, Trash2, 
  Search, QrCode, Package, UserCheck, Users, LogOut, Edit3, 
  AlertTriangle, Calendar, Eye, Download, Send, X, FolderPlus, Menu, RefreshCw, CheckCircle2, AlertCircle, UploadCloud
} from 'lucide-react';

// 🔴 DÁN TRỰC TIẾP URL VÀ ANON KEY CỦA SUPABASE VÀO 2 DÒNG NÀY:
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

export default function App() {
  // 🟢 TRẠNG THÁI TÀI KHOẢN & ĐĂNG NHẬP
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [cloudStatusMsg, setCloudStatusMsg] = useState('');

  // 🟢 TRẠNG THÁI GIAO DIỆN
  const [activeTab, setActiveTab] = useState('pos');
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 🟢 TRẠNG THÁI POS & GIỎ HÀNG
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

  // Khởi tạo ứng dụng
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    
    const startApp = async () => {
      await initData();
      await testCloudConnection();
      await loadAllData();
    };
    startApp();
  }, []);

  // 🔄 TỰ ĐỘNG LÀM MỚI DỮ LIỆU CỨ MỖI 4 GIÂY
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
  }, [taxStartDate, taxEndDate]);

  const testCloudConnection = async () => {
    if (!supabase) {
      setCloudStatusMsg('🔴 Chưa điền Key Supabase ở dòng 13, 14!');
      return;
    }
    try {
      const { data, error } = await supabase.from('staff').select('id').limit(1);
      if (error) {
        setCloudStatusMsg(`⚠️ Lỗi Bảng Cloud: ${error.message}`);
      } else {
        setCloudStatusMsg('🟢 Cloud Ready (Đã kết nối!)');
      }
    } catch (e) {
      setCloudStatusMsg('🔴 Lỗi mạng Cloud!');
    }
  };

  // 🟢 KHÔI PHỤC DỮ LIỆU MẪU ĐẢM BẢO KHÔNG BAO GIỜ BỊ TRẮNG MÀN HÌNH
  const initData = async () => {
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
        await localDb.products.bulkPut([
          { id: '1', name: 'Matcha Latte Premium', price: 45000, category: 'Matcha Series', image: '🍵', stock: 45, is_available: true },
          { id: '2', name: 'Matcha Coco Espresso', price: 52000, category: 'Matcha Series', image: '🥥', stock: 28, is_available: true },
          { id: '3', name: 'Matcha Foam Kem Trứng', price: 49000, category: 'Matcha Series', image: '🍦', stock: 15, is_available: true },
          { id: '4', name: 'Cà Phê Sữa Đá Măng Đen', price: 29000, category: 'Cà Phê Măng Đen', image: '☕', stock: 99, is_available: true },
          { id: '5', name: 'Bạc Xỉu Sữa Hạnh Nhân', price: 35000, category: 'Cà Phê Măng Đen', image: '🥤', stock: 60, is_available: true },
          { id: '6', name: 'Trà Ô Long Sữa Nướng', price: 39000, category: 'Trà & Latte', image: '🧋', stock: 35, is_available: true }
        ]);
      }

      const existingInv = await localDb.inventory.toArray();
      if (existingInv.length === 0) {
        await localDb.inventory.bulkPut([
          { name: 'Bột Matcha Uji Grade A', quantity: 12.5, unit: 'kg', min_quantity: 3 },
          { name: 'Hạt Cà Phê Măng Đen', quantity: 25, unit: 'kg', min_quantity: 5 },
          { name: 'Sữa Tươi Thanh Trùng', quantity: 40, unit: 'hộp', min_quantity: 10 }
        ]);
      }
    } catch (err) {
      console.error('Lỗi DB local:', err);
    }
  };

  // 🔄 ĐỒNG BỘ DỮ LIỆU TỪ CLOUD SUPABASE VỀ MÁY
  const loadAllData = async () => {
    setIsSyncing(true);
    try {
      if (supabase) {
        try {
          const { data: cloudStaff } = await supabase.from('staff').select('*');
          if (cloudStaff && cloudStaff.length > 0) {
            await localDb.staff.clear();
            await localDb.staff.bulkPut(cloudStaff);
          }

          const { data: cloudProducts } = await supabase.from('products').select('*');
          if (cloudProducts && cloudProducts.length > 0) {
            await localDb.products.clear();
            await localDb.products.bulkPut(cloudProducts);
          }

          const { data: cloudOrders } = await supabase.from('orders').select('*');
          if (cloudOrders && cloudOrders.length > 0) {
            await localDb.orders.clear();
            await localDb.orders.bulkPut(cloudOrders);
          }

          const { data: cloudInv } = await supabase.from('inventory').select('*');
          if (cloudInv && cloudInv.length > 0) {
            await localDb.inventory.clear();
            await localDb.inventory.bulkPut(cloudInv);
          }

          const { data: cloudCat } = await supabase.from('categories').select('*');
          if (cloudCat && cloudCat.length > 0) {
            await localDb.categories.clear();
            await localDb.categories.bulkPut(cloudCat);
          }
        } catch (e) {}
      }

      const catList = await localDb.categories.toArray();
      setCategories(['Tất cả', ...catList.map(c => c.name)]);
      setProducts(await localDb.products.toArray());
      setInventory(await localDb.inventory.toArray());
      setStaffList(await localDb.staff.toArray());
      const issueList = await localDb.issue_reports.toArray();
      setIssueReports(issueList.reverse());
      fetchTodayOrders();
    } catch (err) {
      console.error('Lỗi nạp dữ liệu:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 📤 NÚT ÉP ĐẨY DỮ LIỆU TỪ MÁY LÊN CLOUD (CHỈ CẦN BẤM 1 LẦN DÀNH CHO CHỦ QUÁN)
  const pushLocalToCloud = async () => {
    if (!supabase) return alert('Chưa kết nối được Supabase!');
    setIsSyncing(true);
    try {
      const localCats = await localDb.categories.toArray();
      for (const c of localCats) {
        await supabase.from('categories').upsert([{ name: c.name }]);
      }

      const localProds = await localDb.products.toArray();
      for (const p of localProds) {
        await supabase.from('products').upsert([{ name: p.name, price: p.price, category: p.category, image: p.image, stock: p.stock, is_available: true }]);
      }

      const localInvs = await localDb.inventory.toArray();
      for (const i of localInvs) {
        await supabase.from('inventory').upsert([{ name: i.name, quantity: i.quantity, unit: i.unit, min_quantity: i.min_quantity }]);
      }

      alert('✅ Đã đẩy toàn bộ Menu và Dữ liệu từ Máy tính lên Cloud thành công! Điện thoại giờ đã thấy 100% rồi nha ní!');
      await loadAllData();
    } catch (err) {
      alert(`⚠️ Lỗi đẩy dữ liệu: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
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

  // 🟢 CẤP TÀI KHOẢN NHÂN VIÊN (LƯU KÉP LOCAL + CLOUD)
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffUser || !newStaffPass) return alert('Vui lòng nhập đủ thông tin!');

    const staffData = {
      full_name: newStaffName,
      username: newStaffUser.trim(),
      password: newStaffPass.trim(),
      role: 'STAFF'
    };

    // 1. Lưu vào máy trước
    await localDb.staff.add(staffData);

    // 2. Đẩy lên Supabase (Không truyền ID để Supabase tự sinh UUID)
    if (supabase) {
      try { 
        const { error } = await supabase.from('staff').insert([staffData]);
        if (error) {
          alert(`⚠️ Đã lưu vào Máy tính nhưng lỗi Cloud: ${error.message}`);
        } else {
          alert(`✅ Đã cấp thành công tài khoản "${newStaffName}" lên Cloud!`);
        }
      } catch (err) {}
    }

    setNewStaffName(''); setNewStaffUser(''); setNewStaffPass('');
    loadAllData();
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

  // Món Nước CRUD (LƯU KÉP LOCAL + CLOUD)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) return;

    const prodObj = {
      id: editingProduct.id || Date.now().toString(),
      name: editingProduct.name,
      price: Number(editingProduct.price),
      category: editingProduct.category,
      image: editingProduct.image,
      stock: Number(editingProduct.stock) || 50,
      is_available: true
    };

    // 1. Lưu dưới máy trước
    await localDb.products.put(prodObj);

    // 2. Đẩy lên Cloud
    if (supabase) {
      try { 
        await supabase.from('products').insert([{
          name: prodObj.name,
          price: prodObj.price,
          category: prodObj.category,
          image: prodObj.image,
          stock: prodObj.stock,
          is_available: true
        }]); 
      } catch (err) {}
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

  // Kho Nguyên Liệu
  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!newInvItem.name) return;
    const item = { name: newInvItem.name, quantity: Number(newInvItem.quantity), unit: newInvItem.unit, min_quantity: Number(newInvItem.min_quantity) };
    
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
      ["BÁO CÁO TỒN KHO NGUYÊN LIỆU - TIỆM NHÀ TÁO"],
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
    if (!product.is_available || product.stock <= 0) return alert('Món này tạm thời báo hết!');
    const exist = cart.find(x => x.id === product.id);
    if (exist) {
      if (exist.qty >= product.stock) return alert(`Số lượng trong giỏ đã đạt tối đa tồn kho (${product.stock})!`);
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
      try { 
        await supabase.from('orders').insert([{
          code: orderData.code,
          created_at: orderData.created_at,
          total_amount: orderData.total_amount,
          sub_total: orderData.sub_total,
          discount_amount: orderData.discount_amount,
          cash_amount: orderData.cash_amount,
          transfer_amount: orderData.transfer_amount,
          payment_method: orderData.payment_method,
          staff_name: orderData.staff_name,
          items_json: orderData.items_json
        }]); 
      } catch (err) {}
    }

    for (const cartItem of cart) {
      const p = await localDb.products.get(cartItem.id);
      if (p) {
        const updatedStock = Math.max(0, (p.stock || 0) - cartItem.qty);
        await localDb.products.update(cartItem.id, { stock: updatedStock, is_available: updatedStock > 0 });
        if (supabase) {
          try { await supabase.from('products').update({ stock: updatedStock, is_available: updatedStock > 0 }).eq('id', cartItem.id); } catch (err) {}
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
                <span>{cloudStatusMsg || 'Đang kiểm tra kết nối Cloud...'}</span>
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

  // 🟢 MÀN HÌNH CHÍNH POS
  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden relative">
      
      {showLeftMenu && (
        <div 
          onClick={() => setShowLeftMenu(false)} 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* THANH SIDEBAR MENU BÊN TRÁI */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col justify-between shadow-2xl z-50 transition-transform duration-300 ease-in-out ${showLeftMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-lg shadow-lg">🍵</div>
              <div>
                <h1 className="font-extrabold text-sm tracking-wide text-white leading-none">TIỆM NHÀ TÁO</h1>
                <span className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase">Matcha & Coffee POS</span>
              </div>
            </div>
            <button onClick={() => setShowLeftMenu(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800">
              <X size={20} />
            </button>
          </div>

          <nav className="p-3 space-y-1.5">
            <button onClick={() => { setActiveTab('pos'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'pos' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}>
              <ShoppingCart size={16} /> <span>1. POS Gọi Món</span>
            </button>

            <button onClick={() => { setActiveTab('daily_report'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'daily_report' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}>
              <FileText size={16} /> <span>2. Doanh Thu Ngày</span>
            </button>

            <button onClick={() => { setActiveTab('staff_issue'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'staff_issue' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}>
              <AlertTriangle size={16} /> <span>3. Hòm Thư Sự Cố</span>
            </button>

            {currentUser.role === 'OWNER' && (
              <>
                <button onClick={() => { setActiveTab('inventory'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}>
                  <Package size={16} /> <span>4. Quản Lý Tồn Kho</span>
                </button>

                <button onClick={() => { setActiveTab('tax'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'tax' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}>
                  <FileText size={16} /> <span>5. Kê Khai Thuế TT88</span>
                </button>

                <button onClick={() => { setActiveTab('staff_mgr'); setShowLeftMenu(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'staff_mgr' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}>
                  <Users size={16} /> <span>6. Cấp Quyền Nhân Viên</span>
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-3.5 border-t border-slate-800 bg-slate-950">
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        
        {/* HEADER TOP ĐIỀU HƯỚNG */}
        <header className="h-14 md:h-16 bg-white border-b border-gray-200 px-3 md:px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowLeftMenu(true)} 
              className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1.5 shadow"
            >
              <Menu size={18} />
              <span className="text-xs font-bold hidden sm:inline">Menu</span>
            </button>

            <h2 className="text-sm md:text-base font-bold text-gray-800 truncate">
              {activeTab === 'pos' && '🛒 POS Gọi Món'}
              {activeTab === 'daily_report' && '📊 Doanh Thu'}
              {activeTab === 'inventory' && '📦 Tồn Kho'}
              {activeTab === 'tax' && '📄 Thuế TT88'}
              {activeTab === 'staff_mgr' && '👥 Nhân Viên'}
              {activeTab === 'staff_issue' && '💬 Sự Cố'}
            </h2>

            {/* NÚT ÉP ĐẨY DỮ LIỆU CỦA CHỦ QUÁN */}
            {currentUser.role === 'OWNER' && (
              <button 
                onClick={pushLocalToCloud}
                title="Bấm nút này để đẩy toàn bộ Menu từ Máy tính lên Điện thoại"
                className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow transition-all active:scale-95"
              >
                <UploadCloud size={13} />
                <span className="hidden sm:inline">Đẩy Dữ Liệu Lên Cloud</span>
              </button>
            )}

            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border bg-emerald-50 text-emerald-700 border-emerald-200">
              <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Auto-Sync</span>
            </div>
          </div>

          {activeTab === 'pos' && (
            <div className="flex items-center gap-2">
              {currentUser.role === 'OWNER' && (
                <button 
                  onClick={() => { 
                    setEditingProduct({ name: '', price: 35000, category: categories[1] || 'Matcha Series', image: '🍵', stock: 50, is_available: true }); 
                    setShowProductModal(true); 
                  }}
                  className="bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow hover:bg-emerald-800"
                >
                  <Plus size={14} /> <span className="hidden sm:inline">Thêm Món</span>
                </button>
              )}
              <div className="relative w-36 sm:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Tìm món..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-7 pr-3 py-1 bg-gray-100 rounded-full text-xs font-medium focus:bg-white outline-none" />
              </div>
            </div>
          )}
        </header>

        {/* 🛒 1. MÀN HÌNH POS GỌI MÓN */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            <div className="flex-1 p-3 md:p-6 overflow-y-auto flex flex-col gap-3">
              
              <div className="flex gap-2 overflow-x-auto pb-1 items-center scrollbar-none">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap ${selectedCategory === cat ? 'bg-amber-800 text-white' : 'bg-white text-gray-600 border'}`}>
                    {cat}
                  </button>
                ))}

                {currentUser.role === 'OWNER' && (
                  <button 
                    onClick={() => setShowCategoryModal(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 flex items-center gap-1 shrink-0 transition-all shadow-sm"
                  >
                    <FolderPlus size={13} /> Danh mục
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-24">
                {filteredProducts.map((item) => (
                  <div key={item.id} className={`group bg-white rounded-2xl p-3 border shadow-sm transition-all flex flex-col justify-between relative overflow-hidden ${(!item.is_available || item.stock <= 0) ? 'opacity-50 grayscale' : 'hover:shadow-md hover:border-emerald-500'}`}>
                    
                    {currentUser.role === 'OWNER' && (
                      <div className="absolute top-1.5 right-1.5 flex gap-1 z-10 bg-white/80 backdrop-blur rounded-lg p-1 shadow">
                        <button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); setShowProductModal(true); }} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                          <Edit3 size={11} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item.id); }} className="p-1 text-red-600 hover:bg-red-100 rounded">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}

                    <div onClick={() => addToCart(item)} className="cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl md:text-3xl p-1 bg-emerald-50 rounded-xl">{item.image}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${item.is_available && item.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {item.is_available && item.stock > 0 ? `Kho: ${item.stock}` : 'HẾT'}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800 text-xs md:text-sm line-clamp-1">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.category}</p>
                      </div>
                    </div>

                    <div onClick={() => addToCart(item)} className="mt-2.5 pt-2 border-t flex items-center justify-between cursor-pointer">
                      <span className="font-extrabold text-emerald-800 text-xs md:text-sm">{item.price.toLocaleString()} đ</span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow">
                        <Plus size={14} />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* THANH NỔI GIỎ HÀNG DƯỚI ĐÁY */}
            <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-2xl z-30 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="relative bg-emerald-600 p-2.5 rounded-xl shadow">
                  <ShoppingCart size={20} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                      {cart.reduce((s, x) => s + x.qty, 0)}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-emerald-400">{finalTotal.toLocaleString()} VNĐ</div>
                  <div className="text-[10px] text-gray-400 font-medium">{cart.length === 0 ? 'Chưa chọn món nào' : `Đã chọn ${cart.length} món`}</div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (cart.length === 0) return alert('Vui lòng chọn món nước trước khi thanh toán!');
                  setShowCartModal(true);
                }} 
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Printer size={16} /> THANH TOÁN & IN BILL
              </button>
            </div>
          </div>
        )}

        {/* 📦 2. QUẢN LÝ TỒN KHO */}
        {activeTab === 'inventory' && currentUser.role === 'OWNER' && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto w-full overflow-y-auto space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
              <div>
                <h3 className="text-sm md:text-base font-bold text-gray-800">Quản Lý Tồn Kho Nguyên Liệu</h3>
                <p className="text-[11px] text-gray-500">Thêm mặt hàng mới, điều chỉnh số lượng tồn và xuất file Excel.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={exportInventoryExcel} className="flex-1 sm:flex-none bg-amber-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow">
                  <Download size={13} /> Xuất Excel
                </button>
                <button onClick={() => setShowInvModal(true)} className="flex-1 sm:flex-none bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow">
                  <Plus size={13} /> Thêm Mới
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead className="bg-gray-50 font-bold border-b">
                  <tr>
                    <th className="p-3">Tên Nguyên Liệu</th>
                    <th className="p-3">Số Lượng Tồn</th>
                    <th className="p-3">Đơn Vị</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3 text-center">Điều Chỉnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inventory.map(item => {
                    const isLow = item.quantity <= item.min_quantity;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-800">{item.name}</td>
                        <td className="p-3 font-extrabold text-xs text-emerald-700">{item.quantity}</td>
                        <td className="p-3 font-semibold text-gray-500">{item.unit}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isLow ? '⚠️ Sắp hết' : '✓ An toàn'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center items-center gap-1.5">
                            <button onClick={() => updateInventoryQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-100 font-bold hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-xs">-</button>
                            <button onClick={() => updateInventoryQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-100 font-bold hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center text-xs">+</button>
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
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto space-y-4">
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
              <h3 className="text-sm md:text-base font-bold text-gray-800">Bảng Kê Khai Thuế Doanh Thu (Thông Tư 88/2021/TT-BTC)</h3>
              <p className="text-[11px] text-gray-500">Chọn khoảng thời gian để tổng hợp tiền mặt & chuyển khoản trước khi xuất file Excel.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Từ ngày:</label>
                  <input type="date" value={taxStartDate} onChange={(e) => setTaxStartDate(e.target.value)} className="w-full border rounded-xl p-2 text-xs font-semibold outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Đến ngày:</label>
                  <input type="date" value={taxEndDate} onChange={(e) => setTaxEndDate(e.target.value)} className="w-full border rounded-xl p-2 text-xs font-semibold outline-none" />
                </div>
                <div className="flex items-end">
                  <button onClick={exportTaxExcel} className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow">
                    <Download size={14} /> Xuất Excel TT88
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-xs text-gray-800 flex items-center gap-1.5"><Eye size={14} className="text-emerald-700" /> Xem Trước Dữ Liệu</h4>
                <span className="text-xs font-bold text-emerald-700">Tổng: {taxPreviewData.reduce((s,x)=>s+x.total,0).toLocaleString()} đ</span>
              </div>

              <div className="border rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[420px]">
                  <thead className="bg-emerald-50 font-bold border-b text-emerald-900">
                    <tr><th className="p-2.5">STT</th><th className="p-2.5">Ngày</th><th className="p-2.5">Tiền Mặt</th><th className="p-2.5">Chuyển Khoản</th><th className="p-2.5 text-right">Tổng Doanh Thu</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {taxPreviewData.length === 0 ? (
                      <tr><td colSpan="5" className="p-3 text-center text-gray-400">Chưa có dữ liệu đơn hàng trong khoảng thời gian này.</td></tr>
                    ) : (
                      taxPreviewData.map(row => (
                        <tr key={row.stt} className="hover:bg-gray-50">
                          <td className="p-2.5 font-semibold text-gray-500">{row.stt}</td>
                          <td className="p-2.5 font-bold text-gray-800">{row.date}</td>
                          <td className="p-2.5 text-emerald-700 font-semibold">{row.cash.toLocaleString()} đ</td>
                          <td className="p-2.5 text-blue-700 font-semibold">{row.transfer.toLocaleString()} đ</td>
                          <td className="p-2.5 text-right font-extrabold text-gray-900">{row.total.toLocaleString()} đ</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 📊 4. DOANH THU & LỊCH SỬ BILL */}
        {activeTab === 'daily_report' && (
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
            <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800">Doanh Thu Ngày {new Date().toLocaleDateString('vi-VN')}</h3>
                  <p className="text-[11px] text-gray-500">Thu ngân: <span className="font-bold text-emerald-700">{currentUser.full_name}</span></p>
                </div>
                <button onClick={() => { setReprintOrder(null); window.print(); }} className="bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow hover:bg-emerald-800">
                  <Printer size={14} /> In Báo Cáo Ca
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
                  <div className="text-[11px] text-emerald-800 font-bold mb-0.5">💵 Tiền Mặt</div>
                  <div className="text-base md:text-lg font-extrabold text-emerald-700">{todayCash.toLocaleString()} đ</div>
                </div>
                <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100">
                  <div className="text-[11px] text-blue-800 font-bold mb-0.5">💳 Chuyển Khoản</div>
                  <div className="text-base md:text-lg font-extrabold text-blue-700">{todayTransfer.toLocaleString()} đ</div>
                </div>
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-100">
                  <div className="text-[11px] text-amber-800 font-bold mb-0.5">🔥 TỔNG DOANH THU</div>
                  <div className="text-base md:text-lg font-extrabold text-amber-800">{todayTotal.toLocaleString()} đ</div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden space-y-1.5">
                <div className="bg-gray-100 px-3 py-2 font-bold text-xs text-gray-700 border-b">
                  Lịch Sử Đơn Hàng ({todayOrders.length} đơn)
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[420px]">
                    <thead className="bg-gray-50 font-bold border-b text-gray-600">
                      <tr>
                        <th className="p-2.5">Giờ</th>
                        <th className="p-2.5">Người bán</th>
                        <th className="p-2.5">Hình thức</th>
                        <th className="p-2.5 text-right">Tổng tiền</th>
                        <th className="p-2.5 text-center">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {todayOrders.length === 0 ? (
                        <tr><td colSpan="5" className="p-3 text-center text-gray-400">Chưa có đơn hàng nào phát sinh hôm nay.</td></tr>
                      ) : (
                        todayOrders.map((ord, i) => {
                          const items = ord.items_json ? JSON.parse(ord.items_json) : [];
                          return (
                            <tr key={i} className="hover:bg-emerald-50/50">
                              <td className="p-2.5 font-semibold text-gray-800">{new Date(ord.created_at).toLocaleTimeString('vi-VN')}</td>
                              <td className="p-2.5 font-semibold text-gray-700">{ord.staff_name}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${ord.payment_method === 'CASH' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {ord.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-bold text-emerald-700">{Number(ord.total_amount).toLocaleString()} đ</td>
                              <td className="p-2.5 text-center">
                                <button 
                                  onClick={() => setSelectedOrderDetails(ord)}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold text-[10px] flex items-center gap-1 mx-auto"
                                >
                                  <Eye size={11} /> Xem ({items.length})
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
          <div className="p-4 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto space-y-4">
            <div className="bg-white rounded-2xl p-4 border shadow-xl space-y-3">
              <h3 className="font-bold text-gray-800 text-xs md:text-sm flex items-center gap-1.5"><UserCheck className="text-emerald-700" size={16} /> Cấp Tài Khoản Nhân Viên</h3>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input type="text" required placeholder="Họ tên nhân viên" value={newStaffName} onChange={(e)=>setNewStaffName(e.target.value)} className="border rounded-xl p-2 text-xs font-semibold outline-none" />
                <input type="text" required placeholder="Tên đăng nhập" value={newStaffUser} onChange={(e)=>setNewStaffUser(e.target.value)} className="border rounded-xl p-2 text-xs font-semibold outline-none" />
                <input type="password" required placeholder="Mật khẩu" value={newStaffPass} onChange={(e)=>setNewStaffPass(e.target.value)} className="border rounded-xl p-2 text-xs font-semibold outline-none" />
                <div className="sm:col-span-3">
                  <button type="submit" className="w-full sm:w-auto bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow hover:bg-emerald-800">+ Cấp Tài Khoản</button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl p-4 border shadow-xl space-y-3">
              <h3 className="font-bold text-gray-800 text-xs md:text-sm">Danh Sách Nhân Viên Đã Cấp Quyền</h3>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 font-bold border-b"><tr><th className="p-2.5">Họ Tên</th><th className="p-2.5">Tên Đăng Nhập</th><th className="p-2.5">Thao Tác</th></tr></thead>
                  <tbody className="divide-y">
                    {staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold">{s.full_name}</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">{s.username}</td>
                        <td className="p-2.5"><button onClick={() => handleDeleteStaff(s.id)} className="text-red-500 font-bold hover:text-red-700">Xóa</button></td>
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
          <div className="p-4 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto space-y-4">
            {currentUser.role === 'STAFF' && (
              <div className="bg-white rounded-2xl p-4 border shadow-xl space-y-3">
                <h3 className="font-bold text-gray-800 text-xs md:text-sm flex items-center gap-1.5"><AlertTriangle size={16} className="text-amber-600" /> Báo Cáo Hết Món / Sự Cố</h3>
                <form onSubmit={handleSubmitIssue} className="space-y-2.5">
                  <input type="text" required placeholder="Tiêu đề báo cáo..." value={newIssueTitle} onChange={(e) => setNewIssueTitle(e.target.value)} className="w-full border rounded-xl p-2 text-xs font-semibold outline-none" />
                  <textarea rows="3" required placeholder="Nội dung gửi Chủ Quán..." value={newIssueContent} onChange={(e) => setNewIssueContent(e.target.value)} className="w-full border rounded-xl p-2 text-xs font-semibold outline-none"></textarea>
                  <button type="submit" className="bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1 shadow"><Send size={13} /> Gửi Báo Cáo</button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 border shadow-xl space-y-3">
              <h3 className="font-bold text-gray-800 text-xs md:text-sm">Hòm Thư Báo Cáo Sự Cố Quán</h3>
              <div className="space-y-2">
                {issueReports.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Chưa có báo cáo sự cố nào.</p>
                ) : (
                  issueReports.map(item => (
                    <div key={item.id} className="p-3 rounded-xl border bg-gray-50 flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-gray-800">{item.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status === 'RESOLVED' ? 'Đã xử lý' : 'Chờ xử lý'}</span>
                        </div>
                        <p className="text-xs text-gray-600">{item.content}</p>
                        <div className="text-[10px] text-gray-400">Người gửi: {item.staff_name} • {new Date(item.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                      {currentUser.role === 'OWNER' && item.status !== 'RESOLVED' && (
                        <button onClick={() => resolveIssue(item.id)} className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0">Xác nhận</button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
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
              {cart.map((item) => (
                <div key={item.id} className="p-2.5 bg-gray-50 rounded-2xl border flex flex-col gap-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-gray-800">{item.name}</h4>
                      <span className="text-[10px] font-semibold text-emerald-700">{item.price.toLocaleString()} đ</span>
                    </div>
                    <span className="font-bold text-xs text-gray-800">{(item.price * item.qty).toLocaleString()} đ</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <input type="text" placeholder="Ghi chú (VD: Ít đường, nhiều đá...)" value={item.note || ''} onChange={(e) => setCart(cart.map(x => x.id === item.id ? { ...x, note: e.target.value } : x))} className="text-[10px] bg-white border rounded-lg px-2 py-1 w-44 outline-none" />
                    <div className="flex items-center gap-1 bg-white border rounded-lg p-0.5">
                      <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center rounded"><Minus size={12} /></button>
                      <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center rounded"><Plus size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
              <div className="flex justify-between text-gray-500"><span>Tạm tính:</span><span className="font-semibold text-gray-800">{subTotal.toLocaleString()} đ</span></div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Giảm giá (%):</span>
                <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="w-14 text-right border rounded px-1.5 py-0.5 font-bold text-emerald-700" />
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t"><span>Tổng thanh toán:</span><span className="text-emerald-700">{finalTotal.toLocaleString()} VNĐ</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentMethod('CASH')} className={`py-2.5 rounded-xl text-xs font-bold border ${paymentMethod === 'CASH' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-600'}`}>💵 Tiền Mặt</button>
              <button onClick={() => setPaymentMethod('TRANSFER')} className={`py-2.5 rounded-xl text-xs font-bold border ${paymentMethod === 'TRANSFER' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-600'}`}><QrCode size={14} className="inline mr-1" /> Chuyển Khoản</button>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCartModal(false)} className="flex-1 py-3 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100">Hủy</button>
              <button onClick={handleCheckout} className="flex-2 py-3 bg-amber-800 hover:bg-amber-900 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs">
                <Printer size={16} /> IN BILL & HOÀN TẤT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP QUẢN LÝ DANH MỤC */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl">
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
                placeholder="Tên danh mục mới..." 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)} 
                className="flex-1 border rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
              />
              <button type="submit" className="bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow shrink-0">
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

            <div className="pt-2 border-t text-right">
              <button onClick={() => setShowCategoryModal(false)} className="w-full py-2 border rounded-xl font-bold text-xs text-gray-600">
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CHI TIẾT BILL LỊCH SỬ */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800">Chi Tiết Hóa Đơn</h3>
                <p className="text-[10px] text-gray-500">
                  {new Date(selectedOrderDetails.created_at).toLocaleString('vi-VN')} • {selectedOrderDetails.staff_name}
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
                  <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
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

            <div className="flex justify-between text-xs font-extrabold text-gray-900 bg-emerald-50 p-2.5 rounded-xl">
              <span>Tổng tiền ({selectedOrderDetails.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}):</span>
              <span className="text-emerald-700">{Number(selectedOrderDetails.total_amount).toLocaleString()} đ</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setSelectedOrderDetails(null)} className="flex-1 py-2 border rounded-xl font-bold text-xs text-gray-600">Đóng</button>
              <button onClick={() => handleReprintHistoryOrder(selectedOrderDetails)} className="flex-1 py-2 bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow">
                <Printer size={13} /> In Lại Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÊM/SỬA MÓN NƯỚC */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-gray-800">{editingProduct.id ? 'Chỉnh Sửa Món Nước' : 'Thêm Món Nước Mới'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên món nước:</label>
                <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full border rounded-xl p-2 font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Giá bán (VNĐ):</label>
                  <input type="number" required value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} className="w-full border rounded-xl p-2 font-semibold" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Emoji:</label>
                  <input type="text" required value={editingProduct.image} onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })} className="w-full border rounded-xl p-2 font-semibold text-center" />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Danh mục món:</label>
                <select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full border rounded-xl p-2 font-semibold">
                  {categories.filter(c => c !== 'Tất cả').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-2 border rounded-xl font-bold">Hủy</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-700 text-white rounded-xl font-bold">Lưu Món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP THÊM NGUYÊN LIỆU KHO */}
      {showInvModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-gray-800">Thêm Nguyên Liệu Mới</h3>
            <form onSubmit={handleAddInventory} className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên nguyên liệu:</label>
                <input type="text" required value={newInvItem.name} onChange={(e) => setNewInvItem({ ...newInvItem, name: e.target.value })} className="w-full border rounded-xl p-2 font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Số lượng tồn:</label>
                  <input type="number" required value={newInvItem.quantity} onChange={(e) => setNewInvItem({ ...newInvItem, quantity: e.target.value })} className="w-full border rounded-xl p-2 font-semibold" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Đơn vị:</label>
                  <input type="text" required placeholder="kg, hộp..." value={newInvItem.unit} onChange={(e) => setNewInvItem({ ...newInvItem, unit: e.target.value })} className="w-full border rounded-xl p-2 font-semibold" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowInvModal(false)} className="flex-1 py-2 border rounded-xl font-bold">Hủy</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-700 text-white rounded-xl font-bold">Lưu Kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP VIETQR MBBANK */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full text-center space-y-2.5 shadow-2xl">
            <h3 className="font-bold text-sm text-gray-800">Quét Mã VietQR MBBank</h3>
            
            <div className="p-2 bg-gray-100 rounded-2xl inline-block border border-gray-200">
              <img 
                src={dynamicQrUrl} 
                alt="MBBank VietQR" 
                className="w-44 h-44 object-contain rounded-xl" 
              />
            </div>

            <div className="text-center font-extrabold text-emerald-700 text-sm">
              {finalTotal.toLocaleString()} VNĐ
            </div>
            <div className="text-[10px] font-bold text-gray-600">
              {BANK_CONFIG.ACCOUNT_NAME} - {BANK_CONFIG.ACCOUNT_NO}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowQRModal(false)} className="flex-1 py-2 rounded-xl border text-xs font-bold text-gray-600">Hủy</button>
              <button onClick={handleCheckout} className="flex-1 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow">Đã Nhận Tiền</button>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ KHU VỰC IN BILL */}
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
