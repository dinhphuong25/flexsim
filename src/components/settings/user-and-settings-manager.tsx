'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Settings, Users, Shield, Plus, Lock, CheckCircle2, History } from 'lucide-react';

interface UserSummary {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditLogSummary {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  detailsJson?: string;
  createdAt: string;
}

export function UserAndSettingsManager({
  users,
  logs,
  currentUserRole,
}: {
  users: UserSummary[];
  logs: AuditLogSummary[];
  currentUserRole: string;
}) {
  const [userList, setUserList] = useState(users);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'VIEWER'>('VIEWER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserList((prev) => [data.user, ...prev]);
        setShowCreateModal(false);
        setUsername('');
        setFullName('');
        setPassword('');
      } else {
        alert(data.message || 'Lỗi khi tạo người dùng.');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-teal-600" />
            Quản Trị Người Dùng & Nhật Ký Hệ Thống
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phân quyền 3 cấp (Admin, Manager, Viewer), bảo mật phiên làm việc và theo dõi lịch sử thao tác hệ thống (Audit Log).
          </p>
        </div>

        {currentUserRole === 'ADMIN' && (
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            Tạo tài khoản mới
          </Button>
        )}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Danh Sách Tài Khoản Hệ Thống
              </CardTitle>
              <CardDescription>
                Phân quyền truy cập và giới hạn thao tác theo vai trò
              </CardDescription>
            </div>
            <span className="text-xs text-slate-500 font-mono">Tổng: {userList.length} tài khoản</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
                <tr>
                  <th className="py-2.5 px-3">Họ và tên</th>
                  <th className="py-2.5 px-3">Tên đăng nhập</th>
                  <th className="py-2.5 px-3">Vai trò</th>
                  <th className="py-2.5 px-3">Ngày tạo</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{u.fullName}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{u.username}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          u.role === 'ADMIN' ? 'destructive' : u.role === 'MANAGER' ? 'warning' : 'secondary'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Hoạt động
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5 text-slate-700" />
            Nhật Ký Thao Tác Hệ Thống (Audit Logs)
          </CardTitle>
          <CardDescription>Ghi nhận mọi sự kiện tạo lượt chạy, nạp dữ liệu, kiểm định hết tồn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b font-sans">
                <tr>
                  <th className="py-2 px-3">Thời điểm</th>
                  <th className="py-2 px-3">Hành động</th>
                  <th className="py-2 px-3">Thực thể</th>
                  <th className="py-2 px-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500 font-sans">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 px-3 font-bold text-teal-800">{log.action}</td>
                    <td className="py-2 px-3 text-slate-700">{log.entityType}</td>
                    <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-xs">
                      {log.detailsJson || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Tạo Tài Khoản Người Dùng Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="admin, manager, viewer..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mật khẩu khởi tạo</label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vai trò phân quyền</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="VIEWER">VIEWER (Chỉ xem báo cáo &amp; sơ đồ)</option>
                  <option value="MANAGER">MANAGER (Quản lý kế hoạch, phương án, nhập tệp)</option>
                  <option value="ADMIN">ADMIN (Toàn quyền quản trị hệ thống)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
