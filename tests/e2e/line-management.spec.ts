import { test, expect } from '@playwright/test';

test.describe('Hệ Thống Quản Trị Chuyền May Việt Thành - E2E Tests', () => {
  test('1. Đăng nhập hệ thống với tài khoản quản trị viên', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('MAY VIỆT THÀNH')).toBeVisible();

    await page.fill('input[type="email"]', 'admin@vietthanh.vn');
    await page.fill('input[type="password"]', 'Admin@VietThanh2026!ChangeMe');
    await page.click('button[type="submit"]');

    // Sau khi đăng nhập thành công, điều hướng về Dashboard tổng quan
    await page.waitForURL('/');
    await expect(page.getByText('Tổng Quan Vận Hành Chuyền May Nhóm 2')).toBeVisible();
  });

  test('2. Xem lượt tham chiếu ban đầu (5.408 / 5.500 cái, 98,33%)', async ({ page }) => {
    await page.goto('/');
    // Kiểm tra các số liệu tham chiếu Phần 18
    await expect(page.getByText('5.408 cái')).toBeVisible();
    await expect(page.getByText('/ 5.500 cái')).toBeVisible();
    await expect(page.getByText('98,33%')).toBeVisible();
    await expect(page.getByText('92 cái')).toBeVisible(); // Còn thiếu
  });

  test('3. Xem bảng 27 công đoạn và kiểm tra công đoạn CD05', async ({ page }) => {
    await page.goto('/stages');
    await expect(page.getByText('CD05')).toBeVisible();
    await expect(page.getByText('May đáp đáy thân trước')).toBeVisible();
    // CD05 tồn hiện tại = 22 cái
    await expect(page.getByText('22 cái')).toBeVisible();
  });

  test('4. Xem sơ đồ chuyền may tương tác', async ({ page }) => {
    await page.goto('/line-diagram');
    await expect(page.getByText('SRC_TT')).toBeVisible();
    await expect(page.getByText('R01 (Ráp Thân)')).toBeVisible();
    await expect(page.getByText('R02 (Tra Cạp)')).toBeVisible();
    await expect(page.getByText('R03 (Ráp Paget)')).toBeVisible();
    await expect(page.getByText('SINK_TP')).toBeVisible();
  });

  test('5. Xem danh sách 34 nhân sự và 4 công nhân điều chuyển', async ({ page }) => {
    await page.goto('/workers');
    await expect(page.getByText('OP_04_05')).toBeVisible();
    await expect(page.getByText('OP_11_12')).toBeVisible();
    await expect(page.getByText('OP_13_14')).toBeVisible();
    await expect(page.getByText('OP_16_17')).toBeVisible();
  });

  test('6. Quản lý phương án cải tiến và phân tích Student-t', async ({ page }) => {
    await page.goto('/scenarios');
    await expect(page.getByText('SCEN_CO_DINH')).toBeVisible();
    await expect(page.getByText('SCEN_CAI_TIEN_01')).toBeVisible();
    await expect(page.getByText('So Sánh Thống Kê 95% Khoảng Tin Cậy')).toBeVisible();
  });

  test('7. Trang Kết nối FlexSim và tạo khóa token', async ({ page }) => {
    await page.goto('/integrations');
    await expect(page.getByText('/api/integrations/flexsim/health')).toBeVisible();
    await expect(page.getByText('/api/integrations/flexsim/runs/start')).toBeVisible();
    await expect(page.getByText('Kích hoạt bộ gửi giả lập (Test Simulator)')).toBeVisible();
  });

  test('8. Trang Nhập dữ liệu dự phòng (CSV / XLSX Import Wizard)', async ({ page }) => {
    await page.goto('/import');
    await expect(page.getByText('Tải tệp CSV mẫu chuẩn')).toBeVisible();
    await expect(page.getByText('Bước 1: Chọn Tệp Bảng Tính Cần Nhập')).toBeVisible();
  });

  test('9. Trung tâm xuất báo cáo', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText('Xuất tệp Excel (.xlsx)')).toBeVisible();
    await expect(page.getByText('Xuất tệp CSV (UTF-8 BOM)')).toBeVisible();
  });

  test('10. Trang Người dùng & Cài đặt', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('admin@vietthanh.vn')).toBeVisible();
    await expect(page.getByText('Nhật Ký Thao Tác Hệ Thống')).toBeVisible();
  });
});
