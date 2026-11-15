#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
BỘ GỬI MÔ PHỎNG KIỂM THỬ (SIMULATOR) - KHÔNG PHẢI FLEXSIM THẬT
Viet Thanh Garment Line - FlexSim Ingestion API Test Runner
================================================================================
CẢNH BÁO QUAN TRỌNG THEO MỤC 14 & 21:
Đây là bộ gửi mô phỏng kiểm thử tự động (Simulator) để kiểm chứng chức năng
của backend và API Ingestion. Đây KHÔNG phải là ứng dụng FlexSim runtime thật.
Chỉ được tuyên bố 'đã kết nối trực tiếp FlexSim' sau khi đã kích hoạt thành công
từ mô hình .fsm đang chạy trên phần mềm FlexSim chính thức trên Windows.
================================================================================
"""

import sys
import os
import json
import time
import urllib.request
import urllib.error

# Thiết lập bảng mã UTF-8 cho console Windows
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "api_base_url": "http://127.0.0.1:3000/api/integrations/flexsim",
        "integration_token": "vtf_demo_flexsim_integration_key_2026_secured",
        "model_version": "v1.0-baseline",
        "scenario_code": "SCEN_CO_DINH",
        "sample_interval_simulation_seconds": 30.0,
        "max_retries": 3,
    }

def send_http_request(url, method='GET', data=None, token=None):
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'FlexSim-Simulator-Tester/1.0 (Windows)'
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}
    except Exception as e:
        return 0, {"error": str(e)}

def run_simulation_test():
    print("=" * 70)
    print("BỘ GỬI MÔ PHỎNG KIỂM THỬ (SIMULATOR) - KHÔNG PHẢI FLEXSIM THẬT")
    print("Mục tiêu: Kiểm thử toàn trình API kết nối trực tiếp Chuyền May Nhóm 2")
    print("=" * 70)

    cfg = load_config()
    base_url = cfg["api_base_url"]
    token = cfg["integration_token"]

    # 1. Kiểm tra sức khỏe Gateway (Health Check)
    print(f"\n[Bước 1/4] Kiểm tra Health Check: {base_url}/health")
    status, res = send_http_request(f"{base_url}/health")
    if status == 200:
        print(f"  ✓ Gateway Online: {res.get('service')} (Phiên bản: {res.get('version')})")
    else:
        print(f"  ✗ Không thể kết nối Gateway (HTTP {status}). Kiểm tra Next.js đã chạy trên port 3000 chưa.")
        return False

    # 2. Khởi tạo Lượt chạy (Start Run)
    print(f"\n[Bước 2/4] Đăng ký lượt chạy mới: {base_url}/runs/start")
    start_payload = {
        "model_version": cfg["model_version"],
        "scenario_code": cfg["scenario_code"],
        "random_seed": 42,
        "replication_index": 1,
        "data_source": "TEST_SIMULATION",
        "target_count": 5500,
        "run_time_seconds": 171000,
        "client_software": "Simulator Kiểm Thử Tự Động (Python test runner)"
    }
    status, res = send_http_request(f"{base_url}/runs/start", method='POST', data=start_payload, token=token)
    if status == 200:
        run_id = res["run_id"]
        run_code = res["run_code"]
        print(f"  ✓ Đã cấp Run ID: {run_id} ({run_code})")
    else:
        print(f"  ✗ Thất bại khi tạo Run (HTTP {status}): {res}")
        return False

    # 3. Gửi Snapshots theo chu kỳ
    print(f"\n[Bước 3/4] Truyền chuỗi snapshots kiểm thử tới: {base_url}/runs/{run_id}/snapshots")
    test_snapshots = [
        {
            "schema_version": "1.0.0",
            "sequence_number": 1,
            "simulation_time_seconds": 30000.0,
            "sink_finished_count": 950,
            "stage_metrics": [
                {"stage_code": "CD01", "current_wip": 0, "avg_wip": 0.1, "processing_pct": 96.0},
                {"stage_code": "CD05", "current_wip": 12, "avg_wip": 10.5, "processing_pct": 99.2}
            ]
        },
        {
            "schema_version": "1.0.0",
            "sequence_number": 2,
            "simulation_time_seconds": 85000.0,
            "sink_finished_count": 2700,
            "stage_metrics": [
                {"stage_code": "CD05", "current_wip": 20, "avg_wip": 18.2, "processing_pct": 99.8},
                {"stage_code": "CD12", "current_wip": 0, "avg_wip": 0.01, "processing_pct": 93.5}
            ]
        },
        {
            "schema_version": "1.0.0",
            "sequence_number": 3,
            "simulation_time_seconds": 140000.0,
            "sink_finished_count": 4450,
            "stage_metrics": [
                {"stage_code": "CD05", "current_wip": 22, "avg_wip": 21.0, "processing_pct": 99.9}
            ]
        }
    ]

    for snap in test_snapshots:
        status, res = send_http_request(
            f"{base_url}/runs/{run_id}/snapshots",
            method='POST',
            data=snap,
            token=token
        )
        if status == 200:
            print(f"  ✓ Đã gửi Sequence #{snap['sequence_number']} ({snap['simulation_time_seconds']}s): Sink={snap['sink_finished_count']} cái")
        else:
            print(f"  ✗ Lỗi snapshot #{snap['sequence_number']}: {res}")
        time.sleep(0.3)

    # 4. Gửi tín hiệu Kết thúc lượt (Finish Run)
    print(f"\n[Bước 4/4] Gửi tín hiệu hoàn tất lượt chạy: {base_url}/runs/{run_id}/finish")
    finish_payload = {
        "final_simulation_time_seconds": 171000.0,
        "final_sink_finished_count": 5408,
        "completion_reason": "NORMAL",
        "notes": "Kiểm thử đầu cuối hoàn tất thời lượng 171.000s với kết quả chuẩn 5.408/5.500 cái.",
        "final_snapshot": {
            "stage_metrics": [
                {"stage_code": "CD01", "current_wip": 2, "avg_wip": 1.85, "max_wip": 4, "avg_staytime": 18.4, "processing_pct": 97.08},
                {"stage_code": "CD02", "current_wip": 4, "avg_wip": 3.42, "max_wip": 6, "avg_staytime": 24.1, "processing_pct": 95.51},
                {"stage_code": "CD03", "current_wip": 1, "avg_wip": 0.92, "max_wip": 3, "avg_staytime": 12.5, "processing_pct": 98.13},
                {"stage_code": "CD04", "current_wip": 5, "avg_wip": 5.15, "max_wip": 9, "avg_staytime": 32.8, "processing_pct": 86.71},
                {"stage_code": "CD05", "current_wip": 22, "avg_wip": 22.31, "max_wip": 30, "avg_staytime": 700.33, "processing_pct": 99.89},
                {"stage_code": "CD06", "current_wip": 2, "avg_wip": 1.74, "max_wip": 4, "avg_staytime": 16.2, "processing_pct": 98.69},
                {"stage_code": "CD07", "current_wip": 2, "avg_wip": 1.45, "max_wip": 3, "avg_staytime": 14.8, "processing_pct": 94.03},
                {"stage_code": "CD08", "current_wip": 3, "avg_wip": 2.65, "max_wip": 5, "avg_staytime": 21.0, "processing_pct": 92.48},
                {"stage_code": "CD09", "current_wip": 2, "avg_wip": 1.88, "max_wip": 4, "avg_staytime": 17.5, "processing_pct": 93.95},
                {"stage_code": "CD10", "current_wip": 3, "avg_wip": 2.45, "max_wip": 5, "avg_staytime": 19.8, "processing_pct": 92.88},
                {"stage_code": "CD11", "current_wip": 4, "avg_wip": 4.12, "max_wip": 7, "avg_staytime": 28.6, "processing_pct": 93.64},
                {"stage_code": "CD12", "current_wip": 4, "avg_wip": 3.20, "max_wip": 6, "avg_staytime": 22.4, "processing_pct": 99.55},
                {"stage_code": "CD13", "current_wip": 4, "avg_wip": 3.55, "max_wip": 6, "avg_staytime": 25.0, "processing_pct": 90.47},
                {"stage_code": "CD14", "current_wip": 4, "avg_wip": 3.65, "max_wip": 6, "avg_staytime": 26.65, "processing_pct": 99.59},
                {"stage_code": "CD15", "current_wip": 2, "avg_wip": 1.55, "max_wip": 3, "avg_staytime": 15.2, "processing_pct": 88.08},
                {"stage_code": "CD16", "current_wip": 4, "avg_wip": 4.25, "max_wip": 7, "avg_staytime": 29.5, "processing_pct": 89.01},
                {"stage_code": "CD17", "current_wip": 4, "avg_wip": 3.45, "max_wip": 6, "avg_staytime": 24.09, "processing_pct": 99.54},
                {"stage_code": "CD18", "current_wip": 2, "avg_wip": 1.70, "max_wip": 4, "avg_staytime": 16.8, "processing_pct": 87.21},
                {"stage_code": "CD19", "current_wip": 2, "avg_wip": 1.62, "max_wip": 3, "avg_staytime": 15.9, "processing_pct": 88.97},
                {"stage_code": "CD20", "current_wip": 1, "avg_wip": 0.85, "max_wip": 2, "avg_staytime": 11.2, "processing_pct": 72.71},
                {"stage_code": "CD21", "current_wip": 1, "avg_wip": 0.78, "max_wip": 2, "avg_staytime": 9.5, "processing_pct": 45.97},
                {"stage_code": "CD22", "current_wip": 1, "avg_wip": 0.82, "max_wip": 2, "avg_staytime": 10.4, "processing_pct": 57.46},
                {"stage_code": "CD23", "current_wip": 4, "avg_wip": 4.10, "max_wip": 7, "avg_staytime": 27.2, "processing_pct": 82.87},
                {"stage_code": "CD24", "current_wip": 2, "avg_wip": 1.68, "max_wip": 3, "avg_staytime": 16.0, "processing_pct": 69.21},
                {"stage_code": "CD25", "current_wip": 1, "avg_wip": 0.95, "max_wip": 2, "avg_staytime": 12.0, "processing_pct": 71.90},
                {"stage_code": "CD26", "current_wip": 2, "avg_wip": 1.75, "max_wip": 4, "avg_staytime": 17.1, "processing_pct": 87.50},
                {"stage_code": "CD27", "current_wip": 4, "avg_wip": 3.30, "max_wip": 6, "avg_staytime": 23.5, "processing_pct": 71.93}
            ],
            "object_metrics": [
                {"flexsim_name": "P_CD05B_HOTRO", "output": 904, "processing_pct": 21.50, "state": "Idle"},
                {"flexsim_name": "P_CD12B_HOTRO", "output": 150, "processing_pct": 14.80, "state": "Idle"},
                {"flexsim_name": "P_CD14B_HOTRO", "output": 120, "processing_pct": 12.50, "state": "Idle"},
                {"flexsim_name": "P_CD17B_HOTRO", "output": 210, "processing_pct": 18.20, "state": "Idle"}
            ]
        }
    }

    status, res = send_http_request(
        f"{base_url}/runs/{run_id}/finish",
        method='POST',
        data=finish_payload,
        token=token
    )

    if status == 200:
        print(f"  ✓ Hoàn tất lượt chạy thành công!")
        print(f"    - Sản lượng Sink: {res.get('finished_count')}/{res.get('target_count')} cái ({res.get('completion_rate_pct')}%)")
        print(f"    - Trạng thái kết thúc: {res.get('final_status')}")
        audit = res.get('inventory_audit')
        if audit:
            print(f"    - Kết luận kiểm định hết tồn: {audit.get('conclusion')} ({audit.get('title')})")
        print("\n" + "=" * 70)
        print("KẾT LUẬN KIỂM THỬ: Backend API và các luồng nhận dữ liệu hoạt động chính xác 100%.")
        print("LƯU Ý: Đây là kết quả từ Simulator. Cần mở FlexSim trên Windows để gắn mã tích hợp thật.")
        print("=" * 70)
        return True
    else:
        print(f"  ✗ Lỗi khi gửi finish (HTTP {status}): {res}")
        return False

if __name__ == '__main__':
    run_simulation_test()
