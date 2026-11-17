import React from 'react';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { UserAndSettingsManager } from '@/components/settings/user-and-settings-manager';

export default async function SettingsPage() {
  const users = await repository.getAllUsers();
  const logs = await repository.getRecentAuditLogs(40);
  const currentUser = await getCurrentUser();

  const userSummaries = users.map((u) => ({
    id: u.id,
    username: u.username || u.email.split('@')[0],
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));

  const logSummaries = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    detailsJson: l.detailsJson,
    createdAt: l.createdAt,
  }));

  return (
    <UserAndSettingsManager
      users={userSummaries}
      logs={logSummaries}
      currentUserRole={currentUser?.role || 'ADMIN'}
    />
  );
}
