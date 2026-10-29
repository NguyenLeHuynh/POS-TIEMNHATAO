import React from 'react';
import { Plus, Edit3, Trash2, FolderPlus, ShoppingCart, Printer } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function PosView({ 
  products, categories, selectedCategory, setSelectedCategory, 
  searchTerm, onAddToCart, currentUser, onEditProduct, onDeleteProduct, 
  onOpenCatModal, cart, onOpenCartModal, finalTotal 
}) {
  const filteredProducts = products.filter(item => {
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4">
        
        <div className="shrink-0 min-h-[52px] flex gap-2 overflow-x-auto py-1.5 items-center scrollbar-none z-10 sticky top-0 bg-slate-50/95 backdrop-blur-sm">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap shadow-sm ${selectedCategory === cat ? 'bg-amber-800 text-white shadow-amber-900/20' : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}

          {currentUser?.role === 'OWNER' && (
            <button 
              onClick={onOpenCatModal}
              className="shrink-0 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 transition-all shadow-sm"
            >
              <FolderPlus size={14} /> Danh mục
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 pb-24">
          {filteredProducts.map((item, idx) => (
            <div 
              key={item.id || item.name || idx} 
              className={`group bg-white rounded-3xl p-3.5 border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between relative overflow-hidden transform hover:-translate-y-1 ${(!item.is_available || item.stock <= 0) ? 'opacity-50 grayscale' : ''}`}
            >
              {currentUser?.role === 'OWNER' && (
                <div className="absolute top-2 right-2 flex gap-1 z-10 bg-white/90 backdrop-blur rounded-xl p-1 shadow">
                  <button onClick={(e) => { e.stopPropagation(); onEditProduct(item); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={12} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(item.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                </div>
              )}

              <div onClick={() => onAddToCart(item)} className="cursor-pointer">
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

              <div onClick={() => onAddToCart(item)} className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between cursor-pointer">
                <span className="font-black text-emerald-800 text-xs md:text-sm">{formatVND(item.price)}</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md group-hover:bg-emerald-600 transition-colors"><Plus size={15} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl text-white p-3.5 rounded-3xl flex items-center justify-between shadow-2xl z-30 border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3">
          <div className="relative bg-gradient-to-tr from-emerald-600 to-teal-500 p-3 rounded-2xl shadow-lg shadow-emerald-900/50">
            <ShoppingCart size={20} />
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">{cart.reduce((s, x) => s + x.qty, 0)}</span>}
          </div>
          <div>
            <div className="text-sm font-black text-emerald-400">{formatVND(finalTotal)}</div>
            <div className="text-[10px] text-gray-400 font-medium">{cart.length === 0 ? 'Chưa chọn món' : `Đã chọn ${cart.length} món`}</div>
          </div>
        </div>

        <button 
          onClick={onOpenCartModal} 
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-2"
        >
          <Printer size={16} /> THANH TOÁN & IN BILL
        </button>
      </div>
    </div>
  );
}