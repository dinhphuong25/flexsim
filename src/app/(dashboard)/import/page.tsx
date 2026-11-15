import React from 'react';
import { repository } from '@/lib/repository';
import { ImportWizard } from '@/components/import/import-wizard';

export default async function ImportPage() {
  const jobs = await repository.getAllImportJobs();

  const history = jobs.map((j) => ({
    id: j.id,
    fileName: j.fileName,
    fileType: j.fileType,
    recordCount: j.recordCount,
    successCount: j.successCount,
    errorCount: j.errorCount,
    status: j.status,
    createdAt: j.createdAt,
  }));

  return <ImportWizard history={history} />;
}
