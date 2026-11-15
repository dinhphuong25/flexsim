import React from 'react';
import { repository } from '@/lib/repository';
import { IntegrationManager } from '@/components/integrations/integration-manager';

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

  return <IntegrationManager clients={clientList} />;
}
