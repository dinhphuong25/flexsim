'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Settings, Users, Shield, Lock, CheckCircle2, History } from 'lucide-react';

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
}: {
  users: UserSummary[];
  logs: AuditLogSummary[];
}) {
  const [userList, setUserList] = useState(users);

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

    </div>
  );
}
