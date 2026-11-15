'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scissors, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@vietthanh.vn');
  const [password, setPassword] = useState('Admin@VietThanh2026!ChangeMe');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'Đăng nhập không thành công.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-teal-600 items-center justify-center text-white shadow-lg shadow-teal-900/50 mb-2">
            <Scissors className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">MAY VIỆT THÀNH</h2>
          <p className="text-sm text-teal-400 font-medium">
            Hệ Thống Quản Trị Chuyền May Quần Trẻ Em Nữ - Nhóm 2
          </p>
          <p className="text-xs text-slate-400">Tích hợp nhận dữ liệu tự động với phần mềm mô phỏng FlexSim</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-950 text-white shadow-2xl">
          <CardHeader className="border-b border-slate-800/80">
            <CardTitle className="text-lg text-white">Đăng Nhập Hệ Thống</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Sử dụng tài khoản nội bộ được cấp để truy cập dữ liệu sản xuất
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Email người dùng</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vietthanh.vn"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Mật khẩu truy cập</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full mt-2 h-10 gap-2">
                {isLoading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>

          {/* Quick Demo Access Bar */}
          <CardFooter className="flex flex-col border-t border-slate-800/80 pt-4 bg-slate-900/40 text-xs">
            <span className="text-[11px] text-slate-400 font-medium mb-2.5">
              Chọn nhanh tài khoản kiểm thử theo phân quyền:
            </span>
            <div className="flex flex-wrap gap-2 w-full">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@vietthanh.vn', 'Admin@VietThanh2026!ChangeMe')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 font-mono text-[11px] border border-slate-700 transition-colors"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('manager@vietthanh.vn', 'Manager@VietThanh2026')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-[11px] border border-slate-700 transition-colors"
              >
                MANAGER
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('viewer@vietthanh.vn', 'Viewer@VietThanh2026')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700 transition-colors"
              >
                VIEWER
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-teal-500" />
          <span>Bảo mật phiên JWT mã hóa SHA-256 | Không đăng ký công khai</span>
        </div>
      </div>
    </div>
  );
}
