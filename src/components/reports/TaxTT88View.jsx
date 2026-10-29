import React from 'react';
import { Download, Eye } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function TaxTT88View({
  taxStartDate, setTaxStartDate, taxEndDate, setTaxEndDate,
  exportTaxExcel, taxPreviewData
}) {
  return (
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
            Tổng: {formatVND(taxPreviewData.reduce((s,x)=>s+x.total,0))}
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
                    <td className="p-3 text-emerald-700 font-semibold">{formatVND(row.cash)}</td>
                    <td className="p-3 text-blue-700 font-semibold">{formatVND(row.transfer)}</td>
                    <td className="p-3 text-right font-black text-gray-900">{formatVND(row.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}