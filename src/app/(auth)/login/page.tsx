'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    document.title = 'Nhóm 2 - Quản Trị Chuyền May Quần Trẻ Em Nữ (Mã: YSH1000218)';
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isSuccess) return;

    setIsLoading(true);
    setError(null);
    setIsShaking(false);

    try {
      const [res] = await Promise.all([
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        }),
        // Khoảng trễ tự nhiên (400ms) để người dùng nhìn thấy rõ hiệu ứng chuyển động
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        // Hiển thị trạng thái thành công trong 500ms trước khi chuyển trang
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 500);
      } else {
        setIsLoading(false);
        setIsShaking(true);
        setError(data.message || 'Đăng nhập không thành công.');
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch {
      setIsLoading(false);
      setIsShaking(true);
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-6 sm:py-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-4 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">NHÓM 2</h2>
          <p className="text-sm text-teal-300 font-medium">
            Hệ Thống Quản Trị Demo — Chuyền May Quần Trẻ Em Nữ
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-950/90 text-teal-300 border border-teal-500/40 shadow-sm">
              <span className="text-[10px] text-teal-400 font-sans uppercase font-semibold">Mã hàng:</span>
              YSH1000218
            </span>
          </div>
          <p className="text-xs text-slate-400">Tích hợp nhận dữ liệu tự động với phần mềm mô phỏng FlexSim</p>
        </div>

        {/* Login Card */}
        <Card
          className={`border-slate-800 bg-slate-950 text-white shadow-2xl transition-all duration-300 ${
            isShaking ? 'animate-login-shake border-red-500/70 shadow-red-950/40 ring-1 ring-red-500/30' : ''
          } ${
            isSuccess ? 'border-emerald-500/80 ring-2 ring-emerald-500/50 shadow-emerald-950/60' : ''
          }`}
        >
          <CardHeader className="border-b border-slate-800/80 py-3 px-5">
            <CardTitle className="text-base text-white">Đăng Nhập Hệ Thống</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Sử dụng tài khoản nội bộ được cấp để truy cập dữ liệu sản xuất
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 px-5 pb-5">
            <form onSubmit={handleLogin} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-200 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    disabled={isLoading || isSuccess}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Nhập tên đăng nhập (admin, manager...)"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-60 transition-opacity"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">Mật khẩu truy cập</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    disabled={isLoading || isSuccess}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-60 transition-opacity"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`w-full mt-2 h-11 gap-2 font-semibold text-sm relative overflow-hidden transition-all duration-300 transform active:scale-[0.98] ${
                  isSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-400/50 scale-[1.01]'
                    : isLoading
                    ? 'bg-teal-700/90 text-white shadow-md shadow-teal-900/50 cursor-wait'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/50 hover:shadow-teal-500/30'
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-white animate-in zoom-in-50 duration-300 shrink-0" />
                    <span>Đăng nhập thành công! Đang chuyển trang...</span>
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                    <span>Đang xác thực thông tin...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập vào hệ thống</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          {/* Tạm ẩn 3 tài khoản mẫu theo yêu cầu */}
        </Card>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="h-4 w-4 text-teal-500" />
          <span>Bảo mật phiên JWT mã hóa SHA-256 | Không đăng ký công khai</span>
        </div>
      </div>
    </div>
  );
}
