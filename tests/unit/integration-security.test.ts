import { describe, it, expect } from 'vitest';
import {
  generateIntegrationToken,
  hashIntegrationToken,
  extractBearerToken,
  checkClientRateLimit,
  validateSnapshotSequence,
} from '@/lib/integration-security';

describe('Bảo mật tích hợp máy-máy và Idempotency (Mục 11, 12, 13, 20)', () => {
  it('Tạo token máy-máy chuẩn tiền tố vtf_ và băm SHA-256 an toàn', () => {
    const { rawToken, tokenHash, tokenPrefix } = generateIntegrationToken();

    expect(rawToken.startsWith('vtf_')).toBe(true);
    expect(tokenPrefix.startsWith('vtf_')).toBe(true);
    expect(tokenHash).toBe(hashIntegrationToken(rawToken));
    expect(tokenHash.length).toBe(64); // SHA-256 hex 64 chars
  });

  it('Trích xuất chính xác Bearer token từ Authorization Header', () => {
    expect(extractBearerToken('Bearer vtf_test_token_123')).toBe('vtf_test_token_123');
    expect(extractBearerToken('Token vtf_test_token_456')).toBe('vtf_test_token_456');
    expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken('')).toBeNull();
  });

  it('Kiểm soát Rate Limit: Cho phép trong hạn mức và chặn khi vượt ngưỡng', () => {
    const testClientId = `client_test_${Date.now()}`;
    const limit = 5;

    // 5 yêu cầu đầu tiên hợp lệ
    for (let i = 1; i <= 5; i++) {
      const check = checkClientRateLimit(testClientId, limit);
      expect(check.isAllowed).toBe(true);
    }

    // Yêu cầu thứ 6 vượt hạn mức
    const overflowCheck = checkClientRateLimit(testClientId, limit);
    expect(overflowCheck.isAllowed).toBe(false);
    expect(overflowCheck.remaining).toBe(0);
    expect(overflowCheck.resetSeconds).toBeGreaterThan(0);
  });

  it('Kiểm tra Idempotency và thứ tự sequence number của snapshot', () => {
    // Snapshot đầu tiên
    const firstCheck = validateSnapshotSequence(1, null);
    expect(firstCheck.isValid).toBe(true);
    expect(firstCheck.isDuplicate).toBe(false);

    // Snapshot kế tiếp hợp lệ
    const nextCheck = validateSnapshotSequence(2, 1);
    expect(nextCheck.isValid).toBe(true);
    expect(nextCheck.isDuplicate).toBe(false);

    // Gửi trùng lặp (Duplicate: sequence = 2 khi đã có 2)
    const duplicateCheck = validateSnapshotSequence(2, 2);
    expect(duplicateCheck.isValid).toBe(false);
    expect(duplicateCheck.isDuplicate).toBe(true);
    expect(duplicateCheck.message).toContain('Duplicate');

    // Đến sai thứ tự (Out-of-order: sequence = 1 khi đã ghi nhận 3)
    const outOfOrderCheck = validateSnapshotSequence(1, 3);
    expect(outOfOrderCheck.isValid).toBe(false);
    expect(outOfOrderCheck.isOutOfOrder).toBe(true);
    expect(outOfOrderCheck.message).toContain('Out-of-order');
  });
});
