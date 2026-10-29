import React from 'react';
import { Printer, Eye } from 'lucide-react';
import { formatVND, formatVNShortDate } from '../../utils/formatters';

export default function DailyReportView({
  currentUser, selectedReportDate, setSelectedReportDate, handlePrintDailyReport,
  reportCashTotal, reportTransferTotal, reportGrandTotal, reportOrders, setSelectedOrderDetails
}) {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto animate-in fade-in duration-200 space-y-4">
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-gray-200/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-base md:text-lg font-extrabold text-gray-800">
              Doanh Thu {currentUser.role === 'STAFF' ? 'Hôm Nay' : `Ngày ${formatVNShortDate(selectedReportDate)}`}
            </h3>
            <p className="text-[11px] text-gray-500">Thu ngân ca: <span className="font-bold text-emerald-700">{currentUser.full_name}</span></p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {currentUser.role === 'OWNER' ? (
              <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 border rounded-2xl">
                <span className="text-[11px] font-bold text-gray-600 pl-1">Ngày:</span>
                <input 
                  type="date" 
                  value={selectedReportDate} 
                  onChange={(e) => setSelectedReportDate(e.target.value)} 
                  className="bg-white border rounded-xl px-2 py-1 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            ) : (
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-200 flex items-center gap-1">
                🟢 Doanh thu hôm nay ({formatVNShortDate()})
              </span>
            )}

            <button onClick={handlePrintDailyReport} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95 transition-all">
              <Printer size={15} /> In Báo Cáo Ca
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100"><div className="text-xs text-emerald-800 font-bold">💵 Tiền Mặt</div><div className="text-lg font-black text-emerald-700 mt-1">{formatVND(reportCashTotal)}</div></div>
          <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100"><div className="text-xs text-blue-800 font-bold">💳 Chuyển Khoản</div><div className="text-lg font-black text-blue-700 mt-1">{formatVND(reportTransferTotal)}</div></div>
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-100"><div className="text-xs text-amber-800 font-bold">🔥 TỔNG DOANH THU</div><div className="text-lg font-black text-amber-800 mt-1">{formatVND(reportGrandTotal)}</div></div>
        </div>

        <div className="border rounded-2xl overflow-hidden space-y-1.5">
          <div className="bg-gray-100 px-4 py-2.5 font-bold text-xs text-gray-700 border-b">
            Lịch Sử Hóa Đơn Trong Ngày ({reportOrders.length} đơn)
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
                {reportOrders.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-400">Chưa có hóa đơn nào phát sinh trong ngày này.</td></tr>
                ) : (
                  reportOrders.map((ord, i) => {
                    const items = ord.items_json ? JSON.parse(ord.items_json) : [];
                    return (
                      <tr key={ord.id || ord.code || i} className="hover:bg-emerald-50/50 transition-colors">
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
                        <td className="p-3 text-right font-black text-emerald-700">{formatVND(ord.total_amount)}</td>
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
  );
}