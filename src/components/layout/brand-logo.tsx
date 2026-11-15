import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  const sizeMap = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-16 w-16 rounded-2xl',
  };

  const pixelSize = {
    sm: 32,
    md: 40,
    lg: 64,
  };

  const currentPx = pixelSize[size];

  return (
    <div
      style={{
        width: `${currentPx}px`,
        height: `${currentPx}px`,
        minWidth: `${currentPx}px`,
        minHeight: `${currentPx}px`,
        maxWidth: `${currentPx}px`,
        maxHeight: `${currentPx}px`,
      }}
      className={cn(
        sizeMap[size],
        'bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-800',
        'border-2 border-teal-200/50 shadow-xl shadow-teal-950/60',
        'flex items-center justify-center relative overflow-hidden shrink-0 group select-none p-1.5',
        className
      )}
      title="Hệ Thống Quản Trị Chuyền May Nhóm 2 - May Việt Thành"
    >
      {/* Ambient high-tech glass highlights */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none" />
      <div className="absolute -top-3 -right-3 w-10 h-10 bg-teal-200/30 rounded-full blur-xs pointer-events-none" />

      {/* Modern Bold Industrial Smart Sewing Machine Emblem */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
        className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
      >
        <defs>
          {/* Machine Body Solid Metallic Gradient */}
          <linearGradient id="solidBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Golden Spool Accent */}
          <linearGradient id="solidGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Electric Cyan Smart Thread */}
          <linearGradient id="solidCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>

        {/* 1. Heavy Industrial Bedplate (Bàn máy may chân đế vững chắc) */}
        <rect x="5" y="34" width="34" height="4.5" rx="2.25" fill="#f8fafc" />
        <rect x="12" y="33" width="9" height="1.8" rx="0.9" fill="#cbd5e1" />

        {/* 2. Sewing Machine Arm & Column (Thân máy may đặc khối C-Frame nổi bật) */}
        <path
          d="M 29 34 
             L 29 20 
             C 29 17.5, 30.5 16, 32.5 16 
             L 35.5 16 
             C 36.5 16, 37 15, 37 14 
             C 37 12.5, 35.5 11, 34 11 
             L 15 11 
             C 12.5 11, 10.5 13, 10.5 15.5 
             L 10.5 24 
             C 10.5 25.5, 11.8 26.8, 13.5 26.8 
             L 18 26.8 
             C 19.5 26.8, 20.5 25.5, 20.5 24 
             L 20.5 21 
             C 20.5 19, 21.8 17.5, 24 17.5 
             L 26.5 17.5 
             C 28 17.5, 29 18.5, 29 20 
             L 29 34 
             Z"
          fill="url(#solidBodyGrad)"
          stroke="#0f766e"
          strokeWidth="0.8"
        />

        {/* 3. Handwheel / Balance Wheel on Right (Bánh đà bên phải) */}
        <rect x="35" y="14" width="2.8" height="10" rx="1.4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />
        <line x1="36.4" y1="16.5" x2="36.4" y2="21.5" stroke="#475569" strokeWidth="1" strokeLinecap="round" />

        {/* 4. Golden Thread Spool & Pin on Top (Cọc & cuộn chỉ may hoàng kim rực rỡ) */}
        <line x1="31" y1="5.5" x2="31" y2="11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="29" y="5.5" width="4" height="4.8" rx="1.2" fill="url(#solidGoldGrad)" stroke="#78350f" strokeWidth="0.5" />

        {/* 5. Cần giật chỉ & Mắt xỏ chỉ (Take-up Lever) */}
        <circle cx="12" cy="8.5" r="1.6" fill="#38bdf8" />
        <path d="M 12 8.5 L 14 11" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />

        {/* 6. Trục kim & Chân vịt (Needle Bar & Presser Foot đậm nét) */}
        <line x1="14.5" y1="25" x2="14.5" y2="33" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="14.5" y1="30" x2="14.5" y2="33.5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M 16.8 26.5 L 16.8 32 L 19 33.2" stroke="#475569" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* 7. Đường chỉ may kỹ thuật số (Cyan Digital Thread) */}
        <path
          d="M 31 5.5 
             C 25 3, 17 4, 12 8.5 
             L 14.5 26"
          fill="none"
          stroke="url(#solidCyanGrad)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Đường mũi chỉ gia công BTP trên đế máy */}
        <line x1="6.5" y1="33" x2="12" y2="33" stroke="url(#solidCyanGrad)" strokeWidth="1.8" strokeDasharray="1.5 1.5" strokeLinecap="round" />

        {/* 8. Đèn LED IoT thông minh báo trạng thái kết nối FlexSim */}
        <circle cx="24.5" cy="14" r="1.8" fill="#10b981" />
        <circle cx="24.5" cy="14" r="3.2" stroke="#6ee7b7" strokeWidth="0.7" opacity="0.9" />
      </svg>
    </div>
  );
}
