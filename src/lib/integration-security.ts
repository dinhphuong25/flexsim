import crypto from 'crypto';

export interface TokenGenerationResult {
  rawToken: string;
  tokenHash: string;
  tokenPrefix: string;
}

/**
 * Tạo token máy-máy an toàn cho client FlexSim
 * Token chỉ được trả về một lần duy nhất lúc tạo, chỉ lưu tokenHash trong database.
 */
export function generateIntegrationToken(prefix: string = 'vtf_'): TokenGenerationResult {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const rawToken = `${prefix}${randomBytes}`;
  const tokenPrefix = rawToken.substring(0, 10);
  const tokenHash = hashIntegrationToken(rawToken);

  return {
    rawToken,
    tokenHash,
    tokenPrefix,
  };
}

/**
 * Băm token bằng SHA-256
 */
export function hashIntegrationToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Trích xuất Bearer token từ Authorization header
 */
export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && (parts[0].toLowerCase() === 'bearer' || parts[0].toLowerCase() === 'token')) {
    return parts[1];
  }
  return null;
}

// In-memory sliding rate limiter per client
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitCheckResult {
  isAllowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Kiểm tra giới hạn tần suất gửi tin (Rate Limit)
 */
export function checkClientRateLimit(
  clientId: string,
  limitPerMinute: number = 60
): RateLimitCheckResult {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const clientWindow = rateLimitMap.get(clientId);

  if (!clientWindow || now > clientWindow.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + windowMs });
    return {
      isAllowed: true,
      remaining: limitPerMinute - 1,
      resetSeconds: 60,
    };
  }

  if (clientWindow.count >= limitPerMinute) {
    const resetSeconds = Math.ceil((clientWindow.resetAt - now) / 1000);
    return {
      isAllowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  clientWindow.count++;
  const resetSeconds = Math.ceil((clientWindow.resetAt - now) / 1000);
  return {
    isAllowed: true,
    remaining: limitPerMinute - clientWindow.count,
    resetSeconds,
  };
}

/**
 * Kiểm tra tính đầy đủ và thứ tự snapshot (Idempotency & Sequence order)
 */
export interface SnapshotSequenceValidation {
  isValid: boolean;
  isDuplicate: boolean;
  isOutOfOrder: boolean;
  message: string;
}

export function validateSnapshotSequence(
  incomingSeq: number | bigint,
  lastRecordedSeq: number | bigint | null
): SnapshotSequenceValidation {
  const incoming = BigInt(incomingSeq);
  const last = lastRecordedSeq !== null ? BigInt(lastRecordedSeq) : null;

  if (last === null) {
    return {
      isValid: true,
      isDuplicate: false,
      isOutOfOrder: false,
      message: 'Snapshot đầu tiên của lượt chạy',
    };
  }

  if (incoming === last) {
    return {
      isValid: false,
      isDuplicate: true,
      isOutOfOrder: false,
      message: `Snapshot sequence ${incoming} đã được tiếp nhận trước đó (Duplicate). Bỏ qua để tránh tính trùng.`,
    };
  }

  if (incoming < last) {
    return {
      isValid: false,
      isDuplicate: false,
      isOutOfOrder: true,
      message: `Snapshot sequence ${incoming} đến sau sequence ${last} đã lưu (Out-of-order).`,
    };
  }

  return {
    isValid: true,
    isDuplicate: false,
    isOutOfOrder: false,
    message: 'Thứ tự snapshot hợp lệ',
  };
}
