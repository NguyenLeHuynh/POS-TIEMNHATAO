import React from 'react';
import { FolderPlus, X, Edit3, Trash2, Check, Printer } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function PosModals({
  showCategoryModal, setShowCategoryModal, categories, newCatName, setNewCatName,
  handleAddCategory, editingCategory, setEditingCategory, editCatNewName, setEditCatNewName,
  handleUpdateCategoryName, handleDeleteCategory,
  showProductModal, setShowProductModal, editingProduct, setEditingProduct, handleSaveProduct,
  selectedOrderDetails, setSelectedOrderDetails, handleReprintHistoryOrder
}) {
  return (
    <>
      {/* 1. MODAL DANH MỤC MÓN */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
                <FolderPlus size={16} className="text-amber-700" /> Quản Lý Danh Mục
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input type="text" required placeholder="Tên danh mục..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 border rounded-2xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
              <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-2xl text-xs shadow-md shrink-0 active:scale-95 transition-all">+ Thêm</button>
            </form>

            <div className="space-y-1.5 max-h-56 overflow-y-auto border-t pt-2">
              {categories.filter(c => c !== 'Tất cả').map((cat) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border text-xs font-bold text-gray-800">
                  {editingCategory === cat ? (
                    <div className="flex gap-1 w-full">
                      <input type="text" value={editCatNewName} onChange={(e) => setEditCatNewName(e.target.value)} className="flex-1 border rounded-lg px-2 py-0.5 text-xs outline-none" />
                      <button onClick={() => handleUpdateCategoryName(cat)} className="p-1 bg-emerald-700 text-white rounded-lg"><Check size={13} /></button>
                      <button onClick={() => setEditingCategory(null)} className="p-1 bg-gray-200 text-gray-700 rounded-lg"><X size={13} /></button>
                    </div>
                  ) : (
                    <>
                      <span>{cat}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingCategory(cat); setEditCatNewName(cat); }} className="p-1 text-blue-600 hover:text-blue-800"><Edit3 size={13} /></button>
                        <button onClick={() => handleDeleteCategory(cat)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={13} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowCategoryModal(false)} className="w-full py-2 border rounded-2xl font-bold text-xs text-gray-600">Đóng</button>
          </div>
        </div>
      )}

      {/* 2. MODAL THÊM / SỬA MÓN NƯỚC */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-gray-800">{editingProduct.id ? 'Chỉnh Sửa Món Nước' : 'Thêm Món Nước Mới'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên món nước:</label>
                <input type="text" required value={editingProduct.name || ''} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Giá bán (VNĐ):</label>
                  <input type="number" required value={editingProduct.price || ''} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Emoji Biểu Tượng:</label>
                  <input type="text" required value={editingProduct.image || '🍵'} onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold text-center outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Danh mục món:</label>
                  <select value={editingProduct.category || categories[1] || 'Matcha Series'} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600">
                    {categories.filter(c => c !== 'Tất cả').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Tồn kho ban đầu:</label>
                  <input type="number" required value={editingProduct.stock ?? 50} onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="flex-1 py-2.5 border rounded-2xl font-bold text-gray-600">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">Lưu Món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL CHI TIẾT LỊCH SỬ BILL */}
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
              <button onClick={() => setSelectedOrderDetails(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 border-b pb-2">
              {(() => {
                const items = selectedOrderDetails.items_json ? JSON.parse(selectedOrderDetails.items_json) : [];
                return items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                    <div>
                      <div className="font-bold text-gray-800 text-xs">{it.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {formatVND(it.price)} x <span className="font-bold text-emerald-700">{it.qty}</span>
                        {it.note ? <span className="text-amber-600 italic"> ({it.note})</span> : ''}
                      </div>
                    </div>
                    <div className="font-extrabold text-emerald-800 text-xs">
                      {formatVND((it.price || 0) * (it.qty || 1))}
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
              <span className="text-emerald-700">{formatVND(selectedOrderDetails.total_amount)}</span>
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
    </>
  );
}