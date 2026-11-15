import React from 'react';
import { repository } from '@/lib/repository';
import { getCurrentUser } from '@/lib/auth';
import { WorkforceManager } from '@/components/workers/workforce-manager';

export const metadata = {
  title: 'Nhân lực & Phân công công việc | Nhóm 2 - Quản trị Chuyền may',
  description: 'Quản lý 34 vị trí nhân lực, phân công công việc, điều chuyển hỗ trợ và ma trận kỹ năng chuyền may.',
};

export default async function WorkersPage() {
  const positions = await repository.getAllWorkforcePositions();
  const skillMatrix = await repository.getSkillMatrix();
  const checklists = await repository.getAllChecklists();
  const currentUser = await getCurrentUser();

  return (
    <WorkforceManager
      initialPositions={positions}
      initialSkillMatrix={skillMatrix}
      initialChecklists={checklists}
      userRole={currentUser?.role || 'ADMIN'}
    />
  );
}
