import React from 'react';
import { AlertTriangle, Send, Check } from 'lucide-react';

export default function IssueReportView({
  reportType, setReportType, newIssueTitle, setNewIssueTitle,
  selectedInvItem, setSelectedInvItem, inventory, reportQty, setReportQty,
  newIssueContent, setNewIssueContent, handleSubmitReport, issueReports, currentUser, handleApproveInventoryRequest
}) {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto space-y-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xl space-y-3">
        <h3 className="font-extrabold text-gray-800 text-xs md:text-sm flex items-center gap-1.5"><AlertTriangle size={18} className="text-amber-600" /> Báo Cáo Sự Cố / Yêu Cầu Điều Chuyển Kho</h3>
        
        <form onSubmit={handleSubmitReport} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Loại báo cáo:</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600">
                <option value="SỰ CỐ">⚠️ Báo Cáo Sự Cố / Hỏng</option>
                <option value="NHẬP KHO">📥 Yêu Cầu Nhập Kho</option>
                <option value="XUẤT KHO">📤 Yêu Cầu Xuất Kho</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Tiêu đề ngắn gọn:</label>
              <input type="text" required placeholder="Ví dụ: Nhập bột Matcha, máy in hỏng..." value={newIssueTitle} onChange={(e) => setNewIssueTitle(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
            </div>
          </div>

          {reportType !== 'SỰ CỐ' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
              <div>
                <label className="text-[11px] font-bold text-emerald-900 block mb-1">Chọn nguyên liệu:</label>
                <select value={selectedInvItem} onChange={(e) => setSelectedInvItem(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600">
                  <option value="">-- Chọn mặt hàng kho --</option>
                  {inventory.map(inv => <option key={inv.id || inv.name} value={inv.name}>{inv.name} (Tồn: {inv.quantity} {inv.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-emerald-900 block mb-1">Số lượng {reportType === 'NHẬP KHO' ? 'nhập' : 'xuất'}:</label>
                <input type="number" min="0.1" step="any" value={reportQty} onChange={(e) => setReportQty(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Nội dung giải trình chi tiết:</label>
            <textarea rows="2" placeholder="Nội dung gửi Chủ Quán..." value={newIssueContent} onChange={(e) => setNewIssueContent(e.target.value)} className="w-full border rounded-2xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-600"></textarea>
          </div>

          <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"><Send size={14} /> Gửi Báo Cáo / Yêu Cầu</button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xl space-y-3">
        <h3 className="font-extrabold text-gray-800 text-xs">Danh Sách Báo Cáo & Yêu Cầu Điều Chuyển Kho</h3>
        <div className="space-y-2">
          {issueReports.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Chưa có báo cáo nào.</p>
          ) : (
            issueReports.map(item => (
              <div key={item.id} className="p-3.5 rounded-2xl border bg-gray-50 flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-gray-800">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status === 'RESOLVED' ? 'Đã duyệt / xử lý' : 'Chờ Chủ Quán duyệt'}</span>
                  </div>
                  <p className="text-xs text-gray-600">{item.content}</p>
                  <div className="text-[10px] text-gray-400">Người gửi: {item.staff_name} • {new Date(item.created_at).toLocaleString('vi-VN')}</div>
                </div>
                
                {currentUser.role === 'OWNER' && item.status !== 'RESOLVED' && (
                  <button 
                    onClick={() => handleApproveInventoryRequest(item)} 
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Check size={12} /> Duyệt & Cập Nhật Kho
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}