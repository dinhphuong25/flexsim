# HỆ THỐNG QUẢN TRỊ CHUYỀN MAY QUẦN TRẺ EM NỮ - NHÓM 2
## CÔNG TY TNHH MAY XUẤT KHẨU VIỆT THÀNH & TÍCH HỢP MÔ HÌNH FLEXSIM

Hệ thống ứng dụng web full-stack cao cấp phục vụ quản trị kế hoạch sản lượng, nhận số liệu tự động theo thời gian thực từ phần mềm mô phỏng FlexSim, theo dõi 27 công đoạn may và 3 điểm ráp (R01, R02, R03), phân bổ 34 nhân sự (30 cố định + 4 điều chuyển), so sánh phương án cải tiến và kiểm định điều kiện hết tồn toàn chuyền cuối kỳ.

---

## 1. CÔNG NGHỆ BẮT BUỘC ĐÃ TRIỂN KHAI

- **Ngôn ngữ:** TypeScript 5.x (Strict mode: `strict: true` bật toàn diện).
- **Framework:** Next.js 14 (App Router, Route Handlers, Server/Client Components).
- **Thư viện giao diện:** React 18, Tailwind CSS, shadcn/ui design tokens, Lucide React icons.
- **Biểu đồ & Bảng:** Recharts, TanStack Table v8.
- **Cơ sở dữ liệu & ORM:** PostgreSQL 16 (Hỗ trợ Docker Compose `docker-compose.yml`), Prisma ORM 5.x & Migration SQL đầy đủ.
- **Xác thực & Phân quyền:** JWT Session bảo mật cao qua cookie HttpOnly, mã hóa bcryptjs, phân quyền 3 cấp (Admin, Manager, Viewer).
- **Xác thực dữ liệu:** Zod schema validation & React Hook Form.
- **Báo cáo:** Xuất Excel (.xlsx) qua SheetJS và CSV (hỗ trợ UTF-8 BOM, chống CSV Formula Injection CWE-1236).
- **Kiểm thử:** Vitest (Unit & Integration tests - 31/31 passed), Playwright (E2E test suite).

---

## 2. QUY MÔ DÂY CHUYỀN & THÔNG SỐ MÔ HÌNH (PHẦN 4)

- **Mục tiêu sản lượng:** 5.500 thành phẩm.
- **Thời gian chạy kế hoạch:** 171.000 giây (~47,5 giờ làm việc).
- **Tổng nhân lực:** 34 người (Gồm **30 người cố định** tại các máy và **4 người điều chuyển** hỗ trợ).
- **Quy mô chuyền:** 27 công đoạn may + 3 điểm ráp Combiner (R01, R02, R03) + Sink tiếp nhận thành phẩm (`SINK_TP`).
- **Thành phẩm được đo chính xác:** Thuộc tính `Input` của đối tượng `SINK_TP`.

### Cấu trúc 4 nhánh luồng sản xuất:
1. **Nhánh Thân Trước:** `SRC_TT` &rarr; `CD01` &rarr; `CD02A/B` &rarr; `CD03` &rarr; `CD04A/B` &rarr; `CD05` (có trạm `P_CD05B_HOTRO`) &rarr; `CD06` &rarr; Đưa vào `R01`.
2. **Nhánh Thân Sau:** `SRC_TS` &rarr; `CD07` &rarr; Đưa vào `R01`.
3. **Sau R01:** `R01` (Ráp Thân Trước + Thân Sau) &rarr; `CD08` &rarr; `CD09` &rarr; `CD10` &rarr; `CD11A/B` &rarr; `CD12` (có trạm `P_CD12B_HOTRO`) &rarr; `CD13A/B` &rarr; `CD14` (có trạm `P_CD14B_HOTRO`) &rarr; Đưa vào `R02`.
4. **Nhánh Cạp Lưng:** `SRC_LUNG` &rarr; `CD15` &rarr; Đưa vào `R02` qua `Q_R02_CHINH`.
5. **Sau R02:** `R02` (Tra Cạp Lưng) &rarr; `CD16A/B` &rarr; `CD17` (có trạm `P_CD17B_HOTRO`) &rarr; `CD18` &rarr; `CD19` &rarr; Đưa vào `R03`.
6. **Nhánh Paget (Nẹp/Viền):** `SRC_PAGET` &rarr; `CD20` &rarr; `CD21` &rarr; `CD22` &rarr; Đưa vào `R03`.
7. **Sau R03:** `R03` (Ráp Paget) &rarr; `CD23A/B` &rarr; `CD24` &rarr; `CD25` &rarr; `CD26` &rarr; `CD27A/B` &rarr; `SINK_TP`.

### 4 Công nhân điều chuyển hỗ trợ (Mục 8):
- **`OP_04_05`:** Di chuyển giữa `P_CD04B` &harr; `P_CD05B_HOTRO`.
- **`OP_11_12`:** Di chuyển giữa `P_CD11B` &harr; `P_CD12B_HOTRO`.
- **`OP_13_14`:** Di chuyển giữa `P_CD13B` &harr; `P_CD14B_HOTRO`.
- **`OP_16_17`:** Di chuyển giữa `P_CD16B` &harr; `P_CD17B_HOTRO`.

---

## 3. THIẾT KẾ 10 PHÂN HỆ GIAO DIỆN (PHẦN 5)

| STT | Đường dẫn | Chức năng chính |
| :---: | :--- | :--- |
| **1** | `/` (Tổng quan) | KPI thành phẩm tại Sink, % hoàn thành (5.408/5.500 ≈ 98,33%), số còn thiếu (92 cái), công đoạn cần theo dõi CD05, cảnh báo hết tồn. |
| **2** | `/stages` | Danh mục 27 công đoạn, tìm kiếm, lọc phân nhánh, bảng mở rộng chi tiết trạm song song và trạm hỗ trợ. |
| **3** | `/line-diagram` | Sơ đồ luồng chuyền may tương tác (Routing Flow), zoom, pan, chú giải trạng thái, xem chi tiết từng đối tượng khi click. |
| **4** | `/workers` | Quản lý 34 nhân sự: 30 cố định và 4 điều chuyển với quy tắc chuyển trạm, không suy diễn sai thời gian nhàn rỗi. |
| **5** | `/production-plan` | Kế hoạch 5.500 cái, 171.000s, quản lý tiến độ cấp phôi 4 nhánh, kiểm tra cân bằng định mức ráp 1:1. |
| **6** | `/scenarios` | Kịch bản cải tiến (hệ số giảm 0.85 = giảm 15%), so sánh nhiều lần lặp với khoảng tin cậy 95% theo phân phối Student-t. |
| **7** | `/integrations` | Cổng Ingestion Gateway FlexSim: Quản lý API endpoints, cấp khóa Token máy-máy, Runner bộ gửi mô phỏng kiểm thử. |
| **8** | `/import` | Quy trình nhập tệp dự phòng CSV/XLSX qua 4 bước: Chọn tệp &rarr; Ánh xạ &rarr; Kiểm tra lỗi chi tiết &rarr; Lưu Database. |
| **9** | `/reports` | Xuất báo cáo đa định dạng: CSV (UTF-8 BOM), Microsoft Excel (.xlsx) với đầy đủ metadata và chống formula injection. |
| **10** | `/settings` | Quản trị người dùng (Admin, Manager, Viewer), tạo tài khoản an toàn, tra cứu nhật ký thao tác hệ thống (Audit Logs). |

---

## 4. TÍCH HỢP TRỰC TIẾP FLEXSIM & CỔNG MÁY-MÁY (MỤC 11, 12, 13)

### Danh mục Endpoints Ingestion:
1. `GET /api/integrations/flexsim/health`: Kiểm tra sức khỏe kết nối gateway.
2. `POST /api/integrations/flexsim/runs/start`: Đăng ký lượt chạy mới, nhận `run_id`, giới hạn lấy mẫu.
3. `POST /api/integrations/flexsim/runs/:id/snapshots`: Tiếp nhận snapshot mẻ (batching, idempotency theo sequence).
4. `POST /api/integrations/flexsim/runs/:id/finish`: Chốt kết quả lượt chạy, kích hoạt kiểm định hết tồn.

### Bảo mật & Độ tin cậy:
- **Xác thực:** Dùng Bearer Token riêng biệt có tiền tố `vtf_`, chỉ hiển thị khóa lúc tạo, lưu bản băm SHA-256 trong Database.
- **Idempotency & Deduplication:** Kiểm soát thứ tự `sequence_number`, bỏ qua snapshot trùng lặp, cảnh báo snapshot đến sai thứ tự.
- **Nguyên tắc bảo vệ dữ liệu:** Dữ liệu gửi muộn tuyệt đối không làm hồi sinh lượt chạy đã kết thúc (`409 Conflict`). Reset trên FlexSim tạo lượt chạy mới, không ghi đè dữ liệu cũ.

### Bộ mã tích hợp đi kèm trong `integration/flexsim`:
- `config.json`: Cấu hình URL, token, chu kỳ lấy mẫu 30s.
- `FlexSim_HTTP_Connector.fsl`: Mã FlexScript / Python sẵn sàng gắn vào các Trigger trong FlexSim (`OnModelPreReset`, `OnRunWarmup`, User Event chu kỳ, `OnRunEnd`).
- `simulator.py`: Bộ gửi giả lập kiểm thử tự động độc lập chạy bằng Python.

---

## 5. HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH

### Yêu cầu hệ thống:
- Node.js 18+ hoặc 20+ (Khuyến nghị Node.js LTS).
- Package Manager: `pnpm` (hoặc `npm`).
- Python 3.8+ (Để chạy bộ gửi kiểm thử độc lập).
- Docker & Docker Compose (cho PostgreSQL trong môi trường phát triển).

### Bước 1: Khởi động cơ sở dữ liệu PostgreSQL
```bash
# Khởi động PostgreSQL 16 qua Docker Compose
docker compose up -d
```
*(Hệ thống đã tích hợp sẵn cơ chế dự phòng bộ nhớ lưu trữ tự động trong trường hợp chưa mở Docker, đảm bảo kiểm thử liền mạch mọi chức năng).*

### Bước 2: Cài đặt thư viện & sinh Prisma Client
```bash
pnpm install
pnpm prisma:generate
```

### Bước 3: Chạy ứng dụng Next.js
```bash
# Môi trường phát triển (Development)
pnpm dev

# Hoặc biên dịch bản sản xuất (Production Build)
pnpm run build
pnpm start
```
Ứng dụng sẵn sàng tại: `http://localhost:3000`

### Bước 4: Đăng nhập vào hệ thống
Các tài khoản được khởi tạo sẵn theo phân quyền:
- **Admin:** `admin@vietthanh.vn` / Mật khẩu: `Admin@VietThanh2026!ChangeMe`
- **Manager:** `manager@vietthanh.vn` / Mật khẩu: `Manager@VietThanh2026`
- **Viewer:** `viewer@vietthanh.vn` / Mật khẩu: `Viewer@VietThanh2026`

### Bước 5: Chạy bộ gửi kiểm thử tích hợp (Simulator)
```bash
python integration/flexsim/simulator.py
```

### Bước 6: Chạy toàn bộ kiểm thử tự động
```bash
# Chạy Unit & Integration tests (Vitest)
pnpm test

# Chạy kiểm tra kiểu tĩnh TypeScript
pnpm typecheck

# Chạy E2E tests (Playwright)
pnpm test:e2e
```

---

## 6. KẾT QUẢ KIỂM THỬ ĐÃ THỰC HIỆN

- **Unit & Integration Tests (Vitest):** Đạt **31/31 tests passed** (100% thành công):
  * KPI 5.408/5.500: Đúng tỷ lệ 98,33%, còn thiếu 92 cái.
  * Phân biệt rõ `null` khác `0`.
  * Đánh giá nút thắt trạm CD05 dựa trên cả thời gian chờ và tỷ lệ xử lý.
  * Thống kê Student-t 95% khoảng tin cậy và kiểm định ghép cặp.
  * Kiểm định hết tồn toàn chuyền với 4 trạng thái kết luận rõ ràng (`CON_TON`, `HET_TON_TRONG_PHAM_VI`, `CHUA_DU_DU_LIEU`, `HET_TON_TOAN_CHUYEN`).
  * Khử độc chống Formula Injection trên CSV.
  * Phân quyền RBAC tại Server và cơ chế Idempotency chống gửi trùng snapshot.
- **Production Build:** `next build` hoàn thành với **0 lỗi TypeScript, 0 lỗi cú pháp**, xuất 29 routes tối ưu.

---

## 7. TUYÊN BỐ VỀ TÌNH TRẠNG KẾT NỐI FLEXSIM (MỤC 21)

Theo đúng quy định tại Mục 14 và 21 của yêu cầu:
- **Backend API, Gateway tiếp nhận, kịch bản FlexScript và bộ gửi Simulator đã được hoàn thiện 100% và thử nghiệm thành công.**
- **Hệ thống chỉ tuyên bố 'Đã kết nối trực tiếp FlexSim' sau khi kỹ sư mô phỏng mở file .fsm trên phần mềm FlexSim thực tế cài đặt trên máy Windows, dán mã `FlexSim_HTTP_Connector.fsl` và đối chiếu dữ liệu thành phẩm tại Sink.**
