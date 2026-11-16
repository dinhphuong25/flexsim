const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function renderOgImage() {
  console.log('Rendering high-resolution Open Graph Banner (1200x630)...');

  // Read SVG icon to inline into the HTML
  const svgIconPath = path.join(__dirname, '..', 'public', 'icon.svg');
  let svgIcon = '';
  if (fs.existsSync(svgIconPath)) {
    svgIcon = fs.readFileSync(svgIconPath, 'utf8');
  }

  // HTML & CSS for the 1200x630 Open Graph Banner
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #020617;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Ambient Background Glows */
    .ambient-bg {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 15% 30%, rgba(13, 148, 136, 0.25) 0%, transparent 50%),
                  radial-gradient(circle at 85% 20%, rgba(56, 189, 248, 0.2) 0%, transparent 45%),
                  radial-gradient(circle at 50% 90%, rgba(99, 102, 241, 0.15) 0%, transparent 60%),
                  #020617;
      z-index: 1;
    }

    /* Subtle Grid Pattern */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      z-index: 2;
    }

    /* Top Accent Stripe */
    .top-stripe {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #14b8a6, #38bdf8, #818cf8, #2dd4bf);
      z-index: 10;
    }

    /* Main Container */
    .container {
      position: relative;
      z-index: 5;
      width: 1200px;
      height: 630px;
      padding: 48px 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
    }

    /* Left Card: Emblem & Brand */
    .left-card {
      width: 360px;
      height: 534px;
      background: rgba(15, 23, 42, 0.75);
      border: 1.5px solid rgba(45, 212, 191, 0.35);
      border-radius: 28px;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(20, 184, 166, 0.2);
      backdrop-filter: blur(16px);
      flex-shrink: 0;
    }

    .emblem-wrapper {
      width: 220px;
      height: 220px;
      border-radius: 48px;
      padding: 12px;
      background: linear-gradient(135deg, rgba(20, 184, 166, 0.3), rgba(15, 23, 42, 0.6));
      border: 2px solid rgba(94, 234, 212, 0.4);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(45, 212, 191, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-title {
      font-size: 30px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #ffffff;
      margin-top: 16px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    .brand-sub {
      font-size: 13px;
      font-weight: 700;
      color: #2dd4bf;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
    }

    .brand-line {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 6px;
      line-height: 1.4;
    }

    .brand-pill {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(13, 148, 136, 0.2);
      border: 1px solid rgba(45, 212, 191, 0.5);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      color: #5eead4;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 12px;
    }

    /* Right Section: Content & Metrics */
    .right-content {
      flex: 1;
      height: 534px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-left: 10px;
    }

    /* Company Tag & Main Titles */
    .header-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .company-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 800;
      color: #f59e0b;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .company-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f59e0b;
      box-shadow: 0 0 10px #f59e0b;
    }

    .main-heading {
      font-size: 38px;
      font-weight: 900;
      line-height: 1.15;
      color: #ffffff;
      letter-spacing: -0.5px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    }

    .main-heading span {
      background: linear-gradient(135deg, #2dd4bf, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sub-heading {
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.5;
      max-width: 660px;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 10px;
      margin-bottom: 10px;
    }

    .metric-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
    }

    .metric-card.accent-teal {
      border-left: 4px solid #14b8a6;
    }

    .metric-card.accent-amber {
      border-left: 4px solid #f59e0b;
    }

    .metric-card.accent-blue {
      border-left: 4px solid #38bdf8;
    }

    .metric-card.accent-purple {
      border-left: 4px solid #a855f7;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: -0.5px;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .metric-unit {
      font-size: 13px;
      font-weight: 700;
      color: #94a3b8;
    }

    .metric-label {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 600;
    }

    /* Footer Info Bar */
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      font-size: 12px;
      color: #94a3b8;
    }

    .footer-tags {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .footer-tag-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tag-badge {
      padding: 2px 8px;
      border-radius: 6px;
      font-family: monospace;
      font-weight: 700;
      font-size: 11px;
      background: rgba(45, 212, 191, 0.15);
      color: #2dd4bf;
      border: 1px solid rgba(45, 212, 191, 0.3);
    }

    .footer-domain {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="ambient-bg"></div>
  <div class="grid-pattern"></div>
  <div class="top-stripe"></div>

  <div class="container">
    <!-- Left Identity Card -->
    <div class="left-card">
      <div class="emblem-wrapper">
        ${svgIcon}
      </div>

      <div>
        <div class="brand-title">NHÓM 2</div>
        <div class="brand-sub">Quản Trị Chuyền May</div>
        <div class="brand-line">Chuyền may quần trẻ em nữ xuất khẩu</div>
      </div>

      <div class="brand-pill">
        MÔ PHỎNG 3D FLEXSIM
      </div>
    </div>

    <!-- Right Content Section -->
    <div class="right-content">
      <div class="header-section">
        <div class="company-tag">
          <span class="company-dot"></span>
          Công Ty TNHH May Xuất Khẩu Việt Thành
        </div>
        <h1 class="main-heading">
          HỆ THỐNG QUẢN TRỊ SỐ LIỆU &amp;<br>
          MÔ PHỎNG <span>AUTODESK FLEXSIM</span>
        </h1>
        <p class="sub-heading">
          Số hóa toàn bộ chuyền may 27 công đoạn, tự động nạp kết quả mô phỏng từ máy trạm, theo dõi tồn BTP theo thời gian thực và kiểm soát nghiệm thu sản phẩm.
        </p>
      </div>

      <!-- 4 Key Metrics -->
      <div class="metrics-grid">
        <div class="metric-card accent-teal">
          <div class="metric-value">5.427 <span class="metric-unit">/ 5.500 cái</span></div>
          <div class="metric-label">Thành phẩm SINK_TP (Nghiệm thu đạt 98,67%)</div>
        </div>

        <div class="metric-card accent-blue">
          <div class="metric-value">27 <span class="metric-unit">công đoạn</span></div>
          <div class="metric-label">4 nhánh cấp phôi &amp; 3 điểm ráp Combiner</div>
        </div>

        <div class="metric-card accent-amber">
          <div class="metric-value">171.000 <span class="metric-unit">giây</span></div>
          <div class="metric-label">Thời gian mô phỏng chuẩn (47 giờ 30 phút)</div>
        </div>

        <div class="metric-card accent-purple">
          <div class="metric-value">4 <span class="metric-unit">thợ điều chuyển</span></div>
          <div class="metric-label">Giải phóng tồn nút thắt CD05, CD12, CD14, CD17</div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="footer-bar">
        <div class="footer-tags">
          <div class="footer-tag-item">
            <span>Model:</span>
            <span class="tag-badge">v1.0-baseline</span>
          </div>
          <div class="footer-tag-item">
            <span>FlexSim:</span>
            <span class="tag-badge">2027 SQLite</span>
          </div>
          <div class="footer-tag-item">
            <span>Đồng bộ:</span>
            <span class="tag-badge">Trực tiếp máy trạm</span>
          </div>
        </div>
        <div class="footer-domain">
          demo.dinhphuong.dev
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  // Launch browser with system Chrome or Edge
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ channel: 'msedge' });
  }

  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // 2x retina clarity!
  });

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Save to public/og-image.png and public/og-image.jpg
  const outputPathPng = path.join(__dirname, '..', 'public', 'og-image.png');
  const outputPathJpg = path.join(__dirname, '..', 'public', 'og-image.jpg');

  await page.screenshot({ path: outputPathPng, type: 'png' });
  await page.screenshot({ path: outputPathJpg, type: 'jpeg', quality: 95 });

  await browser.close();
  console.log('Open Graph image rendered successfully at: ' + outputPathPng);
}

renderOgImage().catch((err) => {
  console.error('Failed to render OG image:', err);
  process.exit(1);
});
