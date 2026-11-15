# HƯỚNG DẪN TÍCH HỢP TRỰC TIẾP MÔ HÌNH FLEXSIM VÀO HỆ THỐNG QUẢN TRỊ CHUYỀN MAY VIỆT THÀNH

Tài liệu này hướng dẫn kỹ sư mô phỏng gắn kết trực tiếp mô hình FlexSim chuyền may quần trẻ em nữ (Nhóm 2) vào Cổng tiếp nhận dữ liệu (Ingestion Gateway) của Website Quản trị.

---

## 1. NGUYÊN TẮC KỸ THUẬT & KIẾN TRÚC MÁY-MÁY

- **Hướng truyền tin:** FlexSim trên máy trạm Windows chủ động gửi dữ liệu ra ngoài qua HTTP/HTTPS tới các Route Handlers của Website. Máy chủ website không thể tự truy cập localhost của máy trạm người dùng.
- **Bảo mật:** Sử dụng Bearer Token riêng biệt cho từng máy trạm. Khóa bí mật được băm SHA-256 trên cơ sở dữ liệu.
- **Không can thiệp file nhị phân:** Giữ nguyên vẹn file mô hình `.fsm`. Tích hợp hoàn toàn qua các Triggers và User Events tiêu chuẩn của FlexSim.
- **Đo lường thành phẩm:** Đọc chính xác tại thuộc tính **`Input`** của đối tượng **`SINK_TP`** theo đúng thiết kế mô hình (Phần 4).
- **Phòng chống nghẽn đường truyền:** Không gửi HTTP đồng bộ tại mỗi sự kiện chi tiết. Thu thập số liệu theo chu kỳ lấy mẫu (mặc định 30 giây mô phỏng) hoặc gửi theo gói (batch) khi chạy Fast Forward.

---

## 2. DANH MỤC ENDPOINTS TIẾP NHẬN DỮ LIỆU

| Phương thức | Đường dẫn API | Chức năng |
| :--- | :--- | :--- |
| **GET** | `/api/integrations/flexsim/health` | Kiểm tra tình trạng gateway và kiểm tra độ trễ mạng |
| **POST** | `/api/integrations/flexsim/runs/start` | Đăng ký lượt chạy mới, nhận `run_id` và giới hạn lấy mẫu |
| **POST** | `/api/integrations/flexsim/runs/:id/snapshots` | Truyền chuỗi số liệu định kỳ (Hỗ trợ deduplication) |
| **POST** | `/api/integrations/flexsim/runs/:id/finish` | Chốt kết quả, phân biệt lý do kết thúc (Normal, Error, Reset) |

---

## 3. CÁC BƯỚC GẮN VÀO SỰ KIỆN MÔ HÌNH TRONG FLEXSIM

Mở mô hình chuyền may trong FlexSim (giao diện Tree View hoặc Model Triggers):

### Bước 1: Gắn sự kiện `OnModelPreReset`
Khi người dùng bấm **Reset** trên thanh công cụ FlexSim:
- Xóa biến lưu `current_run_id`.
- Đảm bảo lượt chạy cũ đã được đóng; Reset sẽ tạo ra một lượt chạy mới riêng biệt tại lần Run kế tiếp, **tuyệt đối không ghi đè** lên kết quả lượt trước.

```flexscript
// FlexScript tại Model Trigger -> OnModelPreReset
setvarnum(model(), "current_run_id", "");
setvarnum(model(), "snapshot_sequence_counter", 0);
```

### Bước 2: Gắn sự kiện `OnRunWarmup` hoặc `OnRunStart`
Gửi yêu cầu đăng ký lượt chạy mới:
- Đọc `random_seed` hiện tại của FlexSim thông qua hàm `getstream(1)`.
- Gửi yêu cầu `POST /api/integrations/flexsim/runs/start`.
- Lưu `run_id` trả về vào biến mô hình `current_run_id`.

### Bước 3: Gắn User Event lấy mẫu định kỳ (Snapshot Timer)
Tạo một User Event trong FlexSim lặp lại mỗi **30 giây** thời gian mô phỏng:
- Kiểm tra đối tượng tồn tại trước khi đọc: `objectexists(treenode obj)`.
- Đọc Input của `SINK_TP`: `getstat(model().find("SINK_TP"), "Input", STAT_CURRENT)`.
- Đọc Current Content và Average Content của hàng chờ `Q_CD01` đến `Q_CD27`.
- Tăng biến đếm `sequence_number` để backend kiểm tra tính toàn vẹn (idempotency).
- Gửi gói dữ liệu bằng `Http.Request` bất đồng bộ.

### Bước 4: Gắn sự kiện `OnRunEnd`
Khi mô hình chạy đủ thời gian kế hoạch (171.000 giây):
- Gửi yêu cầu `POST /api/integrations/flexsim/runs/:id/finish`.
- Gửi kèm `final_sink_finished_count` (thành phẩm tại SINK_TP) và `final_snapshot`.
- Nhận xác nhận `CONFIRMED` từ website trước khi kết thúc ca làm việc.

---

## 4. BỘ GỬI MÔ PHỎNG KIỂM THỬ (SIMULATOR RUNNER)

Trường hợp đang phát triển trên máy chưa cài đặt phần mềm FlexSim, hệ thống cung cấp sẵn script Python kiểm thử:

```bash
# Kích hoạt bộ gửi mô phỏng kiểm thử độc lập
python integration/flexsim/simulator.py
```

*Lưu ý: Bộ gửi này được định danh rõ ràng là `TEST_SIMULATION` và không thay thế cho việc nghiệm thu trên phần mềm FlexSim thật.*

---

## 5. XỬ LÝ SỰ CỐ & KHÔI PHỤC KẾT NỐI

1. **Mất kết nối mạng giữa chừng:** Bộ kết nối tích hợp cơ chế Retry với exponential backoff. Dữ liệu snapshot trong lúc mất mạng được lưu vào bộ đệm bộ nhớ của FlexSim và gửi bù theo mẻ khi kết nối hồi phục.
2. **Snapshot đến muộn hoặc trùng:** Backend tự động loại bỏ các snapshot có `sequence_number` nhỏ hơn hoặc bằng sequence đã lưu mà không gây lỗi logic.
3. **Không ghi đè lượt chạy đã kết thúc:** Nếu một lượt chạy đã nhận được tín hiệu `finish`, các snapshot gửi muộn sẽ bị từ chối với mã lỗi `409 Conflict` để bảo vệ tính toàn vẹn của kết quả nghiệm thu.
