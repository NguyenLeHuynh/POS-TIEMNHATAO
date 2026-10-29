import React from 'react';
import { Package, X, Layers, Calculator, ClipboardList, RefreshCw, Printer } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function InventoryModals({
  showInvModal, setShowInvModal, editingInvItem, handleSaveInventory,
  invFormMode, setInvFormMode, invForm, setInvForm,
  showA4Modal, setShowA4Modal, auditData, handleAuditInputChange, handleSyncAuditToApp, handlePrintA4Audit
}) {
  return (
    <>
      {/* 1. MODAL THÊM / SỬA KHO CÓ QUY ĐỔI THÙNG/BAO */}
      {showInvModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
                <Package size={18} className="text-emerald-700" />
                {editingInvItem ? `Chỉnh Sửa "${editingInvItem.name}"` : 'Thêm Nguyên Liệu Kho Mới'}
              </h3>
              <button onClick={() => setShowInvModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveInventory} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên nguyên liệu:</label>
                <input type="text" required placeholder="Ví dụ: cà phê ru mạnh, sữa tươi..." value={invForm.name} onChange={(e) => setInvForm({ ...invForm, name: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Cách thức nhập hàng:</label>
                <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-2xl">
                  <button type="button" onClick={() => setInvFormMode('PACK')} className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${invFormMode === 'PACK' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>
                    <Layers size={14} /> Mua Thùng / Bao
                  </button>
                  <button type="button" onClick={() => setInvFormMode('SINGLE')} className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${invFormMode === 'SINGLE' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>
                    <Calculator size={14} /> Nhập Trực Tiếp Lẻ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Đơn vị pha chế (Lẻ):</label>
                  <input type="text" required placeholder="kg, hộp, chai..." value={invForm.unit} onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Cảnh báo tồn ít:</label>
                  <input type="number" required value={invForm.min_quantity} onChange={(e) => setInvForm({ ...invForm, min_quantity: e.target.value })} className="w-full border rounded-2xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
              </div>

              {invFormMode === 'PACK' ? (
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2.5">
                  <div className="text-[11px] font-bold text-amber-900 border-b border-amber-200/80 pb-1 flex items-center gap-1">
                    📦 Quy đổi mua Thùng/Bao tự động sang Đơn vị lẻ
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-800 block mb-1">Giá 1 Thùng/Bao (VNĐ):</label>
                      <input type="number" required placeholder="2580000" value={invForm.pack_price} onChange={(e) => setInvForm({ ...invForm, pack_price: e.target.value })} className="w-full border rounded-2xl p-2.5 font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-600 bg-white" />
                    </div>
                    <div>
                      <label className="font-bold text-gray-800 block mb-1">Quy cách (1 Thùng = ? {invForm.unit || 'đơn vị'}):</label>
                      <input type="number" required placeholder="10" value={invForm.pack_size} onChange={(e) => setInvForm({ ...invForm, pack_size: e.target.value })} className="w-full border rounded-2xl p-2.5 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-600 bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-800 block mb-1">Số lượng Thùng/Bao đang có:</label>
                    <input type="number" step="any" required placeholder="1" value={invForm.pack_qty} onChange={(e) => setInvForm({ ...invForm, pack_qty: e.target.value })} className="w-full border rounded-2xl p-2.5 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-600 bg-white" />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-[11px] space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-600">⚡ Tổng tồn kho lẻ:</span>
                      <span className="text-emerald-700 font-black">{(Number(invForm.pack_qty || 0) * Number(invForm.pack_size || 0))} {invForm.unit || 'kg'}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-600">⚡ Đơn giá lẻ thực tế:</span>
                      <span className="text-amber-800 font-black">
                        {formatVND(Number(invForm.pack_size) > 0 ? Math.round(Number(invForm.pack_price || 0) / Number(invForm.pack_size)) : 0)} / {invForm.unit || 'kg'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-800 block mb-1">Tồn kho hiện tại ({invForm.unit}):</label>
                      <input type="number" step="any" required value={invForm.single_qty} onChange={(e) => setInvForm({ ...invForm, single_qty: e.target.value })} className="w-full border rounded-2xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-emerald-600 bg-white" />
                    </div>
                    <div>
                      <label className="font-bold text-gray-800 block mb-1">Đơn giá lẻ 1 {invForm.unit} (VNĐ):</label>
                      <input type="number" required value={invForm.single_cost} onChange={(e) => setInvForm({ ...invForm, single_cost: e.target.value })} className="w-full border rounded-2xl p-2.5 font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-600 bg-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowInvModal(false)} className="flex-1 py-2.5 border rounded-2xl font-bold text-gray-600">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">Lưu Kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL KIỂM KÊ TỒN KHO CUỐI THÁNG A4 */}
      {showA4Modal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full my-auto space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-800 flex items-center gap-2">
                  <ClipboardList className="text-indigo-700" size={20} /> Bảng Kiểm Kê Tồn Kho Thực Tế Cuối Tháng
                </h3>
                <p className="text-xs text-gray-500">Đối chiếu nguyên liệu thực tế tại quán với phần mềm để hợp thức hóa sổ sách.</p>
              </div>
              <button onClick={() => setShowA4Modal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-2xl">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-indigo-50 font-bold border-b text-indigo-900 sticky top-0">
                  <tr>
                    <th className="p-2.5">STT</th>
                    <th className="p-2.5">Nguyên Liệu</th>
                    <th className="p-2.5 text-center">Tồn Ngoài Quán</th>
                    <th className="p-2.5 text-center">Tồn Trong Kho</th>
                    <th className="p-2.5 text-center">Hàng Hủy/Hỏng</th>
                    <th className="p-2.5 text-center">TỔNG TỒN THỰC</th>
                    <th className="p-2.5 text-center">Tồn Phần Mềm</th>
                    <th className="p-2.5 text-center">Chênh Lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditData.map((row, idx) => {
                    const actualTotal = Number(row.barQty || 0) + Number(row.storeQty || 0);
                    const diff = actualTotal - Number(row.sysQty || 0);
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2.5 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-gray-800">{row.name} ({row.unit})</td>
                        <td className="p-2 text-center"><input type="number" step="any" value={row.barQty} onChange={(e) => handleAuditInputChange(idx, 'barQty', e.target.value)} className="w-16 border rounded-xl p-1 text-center font-bold text-emerald-800 outline-none" /></td>
                        <td className="p-2 text-center"><input type="number" step="any" value={row.storeQty} onChange={(e) => handleAuditInputChange(idx, 'storeQty', e.target.value)} className="w-16 border rounded-xl p-1 text-center font-bold text-blue-800 outline-none" /></td>
                        <td className="p-2 text-center"><input type="number" step="any" value={row.wasteQty} onChange={(e) => handleAuditInputChange(idx, 'wasteQty', e.target.value)} className="w-16 border rounded-xl p-1 text-center font-bold text-red-600 outline-none" /></td>
                        <td className="p-2.5 text-center font-black text-gray-900 bg-gray-50">{actualTotal}</td>
                        <td className="p-2.5 text-center font-bold text-gray-600">{row.sysQty}</td>
                        <td className={`p-2.5 text-center font-black ${diff === 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-blue-600'}`}>{diff > 0 ? `+${diff}` : diff}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t">
              <div className="text-[11px] text-gray-500">💡 Bấm <span className="font-bold text-indigo-700">In Mẫu A4</span> để xuất bản cứng ký nhận.</div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleSyncAuditToApp} className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"><RefreshCw size={14} /> Đồng Bộ Tồn Thực Vào App</button>
                <button onClick={handlePrintA4Audit} className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"><Printer size={14} /> In Mẫu Báo Cáo A4</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}