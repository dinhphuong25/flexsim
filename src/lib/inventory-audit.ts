/**
 * Module Kiểm tra điều kiện hết tồn toàn chuyền theo chuẩn Phần 16
 */

export type AuditConclusionType =
  | 'CON_TON'                     // 1. Còn tồn
  | 'HET_TON_TRONG_PHAM_VI'       // 2. Hết tồn trong phạm vi đã kiểm tra
  | 'CHUA_DU_DU_LIEU'             // 3. Chưa đủ dữ liệu kết luận toàn chuyền
  | 'HET_TON_TOAN_CHUYEN';        // 4. Hết tồn toàn chuyền cuối kỳ khi đủ mọi điều kiện

export interface ObjectAuditInput {
  flexsimName: string;
  objectType: string;
  branch?: string;
  isMandatoryScope: boolean;
  currentContent: number | null | undefined;
  sampleTimeSeconds?: number;
}

export interface LineInventoryAuditResult {
  conclusion: AuditConclusionType;
  conclusionTitle: string;
  conclusionDescription: string;
  badgeVariant: 'destructive' | 'warning' | 'secondary' | 'success';
  totalScopeObjects: number;
  inspectedObjectsCount: number;
  missingDataObjectsCount: number;
  objectsWithWipCount: number;
  totalRemainingFlowItems: number;
  isMaterialReleaseComplete: boolean;
  isTransportCleared: boolean;
  isAllMandatoryInspected: boolean;
  itemsWithWip: { flexsimName: string; objectType: string; content: number }[];
  missingDataItems: string[];
}

export interface InventoryAuditCriteria {
  objects: ObjectAuditInput[];
  runEndTimeSeconds: number;
  isMaterialReleaseComplete?: boolean;
  isTransportCleared?: boolean;
  hasUnreleasedMandatoryFeed?: boolean;
}

/**
 * Thực hiện đánh giá hết tồn toàn chuyền
 */
export function performInventoryAudit(
  criteria: InventoryAuditCriteria
): LineInventoryAuditResult {
  const {
    objects,
    runEndTimeSeconds,
    isMaterialReleaseComplete = false,
    isTransportCleared = false,
    hasUnreleasedMandatoryFeed = false,
  } = criteria;

  const mandatoryObjects = objects.filter((o) => o.isMandatoryScope);
  const totalScopeObjects = mandatoryObjects.length;

  let inspectedCount = 0;
  let missingCount = 0;
  let remainingWipTotal = 0;
  const itemsWithWip: { flexsimName: string; objectType: string; content: number }[] = [];
  const missingDataItems: string[] = [];

  for (const obj of mandatoryObjects) {
    if (obj.currentContent === null || obj.currentContent === undefined || isNaN(obj.currentContent)) {
      missingCount++;
      missingDataItems.push(obj.flexsimName);
    } else {
      inspectedCount++;
      if (obj.currentContent > 0) {
        remainingWipTotal += obj.currentContent;
        itemsWithWip.push({
          flexsimName: obj.flexsimName,
          objectType: obj.objectType,
          content: obj.currentContent,
        });
      }
    }
  }

  const isAllMandatoryInspected = missingCount === 0 && inspectedCount === totalScopeObjects && totalScopeObjects > 0;
  const hasRemainingWip = itemsWithWip.length > 0;

  let conclusion: AuditConclusionType;
  let conclusionTitle: string;
  let conclusionDescription: string;
  let badgeVariant: 'destructive' | 'warning' | 'secondary' | 'success';

  // 1. Trường hợp còn tồn
  if (hasRemainingWip) {
    conclusion = 'CON_TON';
    conclusionTitle = 'Còn tồn BTP trên chuyền';
    conclusionDescription = `Phát hiện ${itemsWithWip.length} vị trí còn ứ đọng tổng cộng ${remainingWipTotal} FlowItem (BTP/chi tiết rời). Chưa hết tồn.`;
    badgeVariant = 'destructive';
  }
  // 2. Không thấy tồn ở các vị trí đã kiểm tra, nhưng thiếu dữ liệu một số trạm
  else if (!isAllMandatoryInspected) {
    conclusion = 'CHUA_DU_DU_LIEU';
    conclusionTitle = 'Chưa đủ dữ liệu kết luận toàn chuyền';
    conclusionDescription = `Có ${missingCount}/${totalScopeObjects} đối tượng thuộc phạm vi bắt buộc chưa có dữ liệu đo (ví dụ: ${missingDataItems.slice(0, 3).join(', ')}${missingDataItems.length > 3 ? '...' : ''}). Không thể kết luận toàn chuyền.`;
    badgeVariant = 'warning';
  }
  // 3. Đã kiểm tra đủ các trạm, tồn = 0, nhưng chưa thỏa điều kiện cấp liệu hoặc vận chuyển
  else if (!isMaterialReleaseComplete || !isTransportCleared || hasUnreleasedMandatoryFeed) {
    conclusion = 'HET_TON_TRONG_PHAM_VI';
    conclusionTitle = 'Hết tồn trong phạm vi các trạm đã kiểm tra';
    conclusionDescription = 'Các máy và hàng chờ hiện tại có Current Content = 0, nhưng chưa hoàn tất xác nhận: ' +
      (!isMaterialReleaseComplete ? 'Lịch cấp liệu chưa đóng; ' : '') +
      (!isTransportCleared ? 'Chưa kiểm tra vị trí hàng đang di chuyển (Transporter); ' : '') +
      (hasUnreleasedMandatoryFeed ? 'Còn nguyên liệu bắt buộc chưa tạo tại Source.' : '');
    badgeVariant = 'secondary';
  }
  // 4. Thỏa mãn tuyệt đối tất cả 7 điều kiện kiểm định hết tồn toàn chuyền
  else {
    conclusion = 'HET_TON_TOAN_CHUYEN';
    conclusionTitle = 'Hết tồn toàn chuyền cuối kỳ';
    conclusionDescription = `Xác nhận toàn bộ ${totalScopeObjects} đối tượng thuộc phạm vi mô hình đều có tồn cuối kỳ bằng 0 tại thời điểm kết thúc (${runEndTimeSeconds}s), lịch cấp liệu đã kết thúc và không còn hàng dở dang.`;
    badgeVariant = 'success';
  }

  return {
    conclusion,
    conclusionTitle,
    conclusionDescription,
    badgeVariant,
    totalScopeObjects,
    inspectedObjectsCount: inspectedCount,
    missingDataObjectsCount: missingCount,
    objectsWithWipCount: itemsWithWip.length,
    totalRemainingFlowItems: remainingWipTotal,
    isMaterialReleaseComplete,
    isTransportCleared,
    isAllMandatoryInspected,
    itemsWithWip,
    missingDataItems,
  };
}
