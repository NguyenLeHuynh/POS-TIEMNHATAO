import React from 'react';
import { Menu, Plus, Search } from 'lucide-react';

export default function Header({ activeTab, currentUser, setShowLeftMenu, searchTerm, setSearchTerm, onOpenAddProduct }) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 md:px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={() => setShowLeftMenu(true)} className="p-2.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-md flex items-center gap-2">
          <Menu size={18} />
          <span className="text-xs font-bold hidden sm:inline">Menu</span>
        </button>

        <h2 className="text-sm md:text-base font-extrabold text-gray-800 truncate">
          {activeTab === 'pos' && '🛒 POS Bán Hàng'}
          {activeTab === 'daily_report' && '📊 Doanh Thu Ca & Ngày'}
          {activeTab === 'inventory' && '📦 Quản Lý Tồn Kho'}
          {activeTab === 'tax' && '📄 Kê Khai Thuế TT88'}
          {activeTab === 'staff_mgr' && '👥 Cấp Quyền Nhân Viên'}
          {activeTab === 'staff_issue' && '💬 Báo Cáo & Điều Chuyển Kho'}
        </h2>
      </div>

      {activeTab === 'pos' && (
        <div className="flex items-center gap-2">
          {currentUser?.role === 'OWNER' && (
            <button 
              onClick={onOpenAddProduct}
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
  );
}