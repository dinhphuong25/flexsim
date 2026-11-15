import React from 'react';
import { repository } from '@/lib/repository';
import { IntegrationManager } from '@/components/integrations/integration-manager';
import { DataQualityValidator } from '@/components/integrations/data-quality-validator';

export default async function IntegrationsPage() {
  const clients = await repository.getAllClients();

  const clientList = clients.map((c) => ({
    id: c.id,
    clientName: c.clientName,
    tokenPrefix: c.tokenPrefix,
    rateLimitPerMin: c.rateLimitPerMin,
    isActive: c.isActive,
    lastUsedAt: c.lastUsedAt,
    createdAt: c.createdAt,
  }));

  return (
    <div className="space-y-6">
      {/* Feature 5: Trung Tâm Kiểm Tra Chất Lượng & Toàn Vẹn Dữ Liệu */}
      <DataQualityValidator />

      {/* Quản lý kết nối & mã bảo mật FlexSim */}
      <IntegrationManager clients={clientList} />
    </div>
  );
}
