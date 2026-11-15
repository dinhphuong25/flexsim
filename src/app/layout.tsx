import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quản trị Chuyền May Nhóm 2 - May Việt Thành | FlexSim Integration',
  description: 'Hệ thống website quản trị chuyền may quần trẻ em nữ của Nhóm 2 tại Công ty TNHH May Xuất Khẩu Việt Thành, kết nối trực tiếp FlexSim.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
