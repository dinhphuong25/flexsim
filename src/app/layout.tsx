import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://flexsim.dinhphuong.dev'),
  title: {
    default: 'Nhóm 2 — Quản Trị Chuyền May & Mô Phỏng FlexSim',
    template: '%s | Nhóm 2 — May XK Việt Thành',
  },
  description: 'Hệ thống website quản trị số liệu chuyền may 27 công đoạn, kết nối trực tiếp mô hình 3D Autodesk FlexSim 2027, giám sát tồn BTP và nghiệm thu 5.500 sản phẩm tại Công ty TNHH May XK Việt Thành.',
  applicationName: 'Quản Trị Chuyền May Nhóm 2',
  authors: [{ name: 'Nhóm 2 — May XK Việt Thành' }],
  creator: 'Nhóm 2',
  publisher: 'Công ty TNHH May Xuất Khẩu Việt Thành',
  keywords: [
    'FlexSim',
    'May Việt Thành',
    'Nhóm 2',
    'Quản trị chuyền may',
    'Mô phỏng chuyền may',
    'Tồn BTP',
    'Nghiệm thu sản lượng',
  ],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Nhóm 2 — Quản Trị Chuyền May & Mô Phỏng FlexSim',
    description: 'Website quản trị chuyền may 27 công đoạn, kết nối mô hình 3D FlexSim, theo dõi tồn BTP và nghiệm thu 5.500 sản phẩm — Công ty TNHH May XK Việt Thành.',
    url: 'https://flexsim.dinhphuong.dev',
    siteName: 'Nhóm 2 — May XK Việt Thành',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nhóm 2 — Hệ Thống Quản Trị Chuyền May & Mô Phỏng FlexSim',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nhóm 2 — Quản Trị Chuyền May & Mô Phỏng FlexSim',
    description: 'Website quản trị chuyền may 27 công đoạn, kết nối mô hình 3D FlexSim, theo dõi tồn BTP và nghiệm thu 5.500 sản phẩm.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
