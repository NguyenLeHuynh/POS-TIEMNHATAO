import React from 'react';
import { UserCheck } from 'lucide-react';

export default function StaffManagerView({
  newStaffName, setNewStaffName, newStaffUser, setNewStaffUser,
  newStaffPass, setNewStaffPass, handleCreateStaff, staffList, handleDeleteStaff
}) {
  return (
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
                <tr key={s.id || s.username} className="hover:bg-gray-50">
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
  );
}