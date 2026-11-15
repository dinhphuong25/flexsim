-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('FRONT_BODY', 'BACK_BODY', 'POST_R01', 'WAISTBAND', 'POST_R02', 'PAGET', 'POST_R03');

-- CreateEnum
CREATE TYPE "ObjectType" AS ENUM ('SOURCE', 'QUEUE', 'PROCESSOR', 'COMBINER', 'SINK', 'OPERATOR', 'TRANSPORTER', 'OTHER');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('FLOW', 'SUPPORT', 'RESOURCE');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'STOPPED_EARLY', 'ERROR', 'RESET');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('SIMULATION', 'ACTUAL', 'PLAN', 'MEASURED', 'ASSUMPTION', 'TEST_SIMULATION');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACCEPTED', 'DUPLICATE', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "AuditConclusion" AS ENUM ('CON_TON', 'HET_TON_TRONG_PHAM_VI', 'CHUA_DU_DU_LIEU', 'HET_TON_TOAN_CHUYEN');

-- CreateEnum
CREATE TYPE "AuditItemStatus" AS ENUM ('EMPTY', 'HAS_WIP', 'MISSING_DATA');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PREVIEWED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT 'Công ty TNHH May Xuất Khẩu Việt Thành',
    "targetOutput" INTEGER NOT NULL DEFAULT 5500,
    "runTimeSeconds" DOUBLE PRECISION NOT NULL DEFAULT 171000,
    "plannedWorkers" INTEGER NOT NULL DEFAULT 34,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelVersion" (
    "id" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "versionCode" TEXT NOT NULL,
    "description" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "stageCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" "BranchType" NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "parallelStationCount" INTEGER NOT NULL DEFAULT 1,
    "standardProcessTime" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelObject" (
    "id" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "stageId" TEXT,
    "flexsimName" TEXT NOT NULL,
    "objectType" "ObjectType" NOT NULL,
    "branch" "BranchType",
    "isInventoryAudited" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelConnection" (
    "id" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "fromObjectId" TEXT NOT NULL,
    "toObjectId" TEXT NOT NULL,
    "connectionType" "ConnectionType" NOT NULL DEFAULT 'FLOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerResource" (
    "id" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "workerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isFloating" BOOLEAN NOT NULL DEFAULT false,
    "primaryStation" TEXT,
    "secondaryStation" TEXT,
    "transferRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "shiftName" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioConfiguration" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "processTimeFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "processTimeDistribution" TEXT,
    "transferThreshold" DOUBLE PRECISION,
    "queueCapacitiesJson" TEXT,
    "materialReleaseScheduleJson" TEXT,
    "assumptionsBasis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "runCode" TEXT NOT NULL,
    "replicationIndex" INTEGER,
    "randomSeed" BIGINT,
    "runTimeSeconds" DOUBLE PRECISION NOT NULL DEFAULT 171000,
    "warmupSeconds" DOUBLE PRECISION,
    "status" "RunStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "dataSource" "DataSource" NOT NULL DEFAULT 'SIMULATION',
    "sourceDescription" TEXT,
    "finishedCount" INTEGER,
    "targetCount" INTEGER NOT NULL DEFAULT 5500,
    "isLineCleared" BOOLEAN,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectMetric" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "modelObjectId" TEXT NOT NULL,
    "inputCount" INTEGER,
    "outputCount" INTEGER,
    "currentContent" INTEGER,
    "avgContent" DOUBLE PRECISION,
    "maxContent" INTEGER,
    "avgStaytime" DOUBLE PRECISION,
    "processingPct" DOUBLE PRECISION,
    "idlePct" DOUBLE PRECISION,
    "blockedPct" DOUBLE PRECISION,
    "stateAtSample" TEXT,
    "simulationTimeSeconds" DOUBLE PRECISION NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObjectMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageMetric" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "inputCount" INTEGER,
    "outputCount" INTEGER,
    "currentWip" INTEGER,
    "avgWip" DOUBLE PRECISION,
    "maxWip" INTEGER,
    "avgStaytime" DOUBLE PRECISION,
    "processingPct" DOUBLE PRECISION,
    "bottleneckScore" DOUBLE PRECISION,
    "simulationTimeSeconds" DOUBLE PRECISION NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSeriesMetric" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "simulationTimeSeconds" DOUBLE PRECISION NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeSeriesMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionPlan" (
    "id" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "targetOutput" INTEGER NOT NULL DEFAULT 5500,
    "plannedRunTime" DOUBLE PRECISION NOT NULL DEFAULT 171000,
    "totalPlannedWorkers" INTEGER NOT NULL DEFAULT 34,
    "fixedWorkers" INTEGER NOT NULL DEFAULT 30,
    "floatingWorkers" INTEGER NOT NULL DEFAULT 4,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRelease" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "branch" "BranchType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "plannedQuantity" INTEGER NOT NULL,
    "generatedQuantity" INTEGER,
    "releasedQuantity" INTEGER,
    "heldQuantity" INTEGER,
    "completedQuantity" INTEGER,
    "lastBatchReleaseTime" DOUBLE PRECISION,
    "isReleaseCompleted" BOOLEAN NOT NULL DEFAULT false,
    "releaseScheduleJson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationClient" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "permissionsJson" TEXT NOT NULL DEFAULT '{"allLines":true}',
    "rateLimitPerMin" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionBatch" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sequenceNumber" BIGINT NOT NULL,
    "clientTimestamp" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACCEPTED',
    "errorMessage" TEXT,

    CONSTRAINT "IngestionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAudit" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "auditTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "simulationTimeSeconds" DOUBLE PRECISION NOT NULL,
    "conclusion" "AuditConclusion" NOT NULL,
    "totalScopeItems" INTEGER NOT NULL,
    "totalRemainingWip" INTEGER NOT NULL,
    "isMaterialReleaseComplete" BOOLEAN NOT NULL DEFAULT false,
    "isTransportCleared" BOOLEAN NOT NULL DEFAULT false,
    "inspectedScopeSummary" TEXT,
    "notes" TEXT,
    "auditedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAuditItem" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "modelObjectId" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "branch" TEXT,
    "currentContent" INTEGER,
    "isAudited" BOOLEAN NOT NULL DEFAULT true,
    "status" "AuditItemStatus" NOT NULL DEFAULT 'EMPTY',
    "notes" TEXT,

    CONSTRAINT "InventoryAuditItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "targetTable" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "importedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "columnName" TEXT,
    "rawValue" TEXT,
    "errorMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "detailsJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLine_code_key" ON "ProductionLine"("code");

-- CreateIndex
CREATE INDEX "ModelVersion_lineId_idx" ON "ModelVersion"("lineId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelVersion_lineId_versionCode_key" ON "ModelVersion"("lineId", "versionCode");

-- CreateIndex
CREATE INDEX "Stage_lineId_sequenceOrder_idx" ON "Stage"("lineId", "sequenceOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_lineId_stageCode_key" ON "Stage"("lineId", "stageCode");

-- CreateIndex
CREATE INDEX "ModelObject_modelVersionId_objectType_idx" ON "ModelObject"("modelVersionId", "objectType");

-- CreateIndex
CREATE UNIQUE INDEX "ModelObject_modelVersionId_flexsimName_key" ON "ModelObject"("modelVersionId", "flexsimName");

-- CreateIndex
CREATE INDEX "ModelConnection_modelVersionId_idx" ON "ModelConnection"("modelVersionId");

-- CreateIndex
CREATE INDEX "ModelConnection_fromObjectId_idx" ON "ModelConnection"("fromObjectId");

-- CreateIndex
CREATE INDEX "ModelConnection_toObjectId_idx" ON "ModelConnection"("toObjectId");

-- CreateIndex
CREATE INDEX "WorkerResource_lineId_isFloating_idx" ON "WorkerResource"("lineId", "isFloating");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerResource_lineId_workerCode_key" ON "WorkerResource"("lineId", "workerCode");

-- CreateIndex
CREATE INDEX "Assignment_workerId_idx" ON "Assignment"("workerId");

-- CreateIndex
CREATE INDEX "Scenario_lineId_idx" ON "Scenario"("lineId");

-- CreateIndex
CREATE INDEX "Scenario_modelVersionId_idx" ON "Scenario"("modelVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_lineId_code_key" ON "Scenario"("lineId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioConfiguration_scenarioId_key" ON "ScenarioConfiguration"("scenarioId");

-- CreateIndex
CREATE INDEX "SimulationRun_scenarioId_status_idx" ON "SimulationRun"("scenarioId", "status");

-- CreateIndex
CREATE INDEX "SimulationRun_modelVersionId_idx" ON "SimulationRun"("modelVersionId");

-- CreateIndex
CREATE INDEX "SimulationRun_dataSource_idx" ON "SimulationRun"("dataSource");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationRun_scenarioId_runCode_key" ON "SimulationRun"("scenarioId", "runCode");

-- CreateIndex
CREATE INDEX "ObjectMetric_runId_modelObjectId_idx" ON "ObjectMetric"("runId", "modelObjectId");

-- CreateIndex
CREATE INDEX "ObjectMetric_runId_simulationTimeSeconds_idx" ON "ObjectMetric"("runId", "simulationTimeSeconds");

-- CreateIndex
CREATE INDEX "StageMetric_runId_stageId_idx" ON "StageMetric"("runId", "stageId");

-- CreateIndex
CREATE INDEX "StageMetric_runId_simulationTimeSeconds_idx" ON "StageMetric"("runId", "simulationTimeSeconds");

-- CreateIndex
CREATE INDEX "TimeSeriesMetric_runId_simulationTimeSeconds_idx" ON "TimeSeriesMetric"("runId", "simulationTimeSeconds");

-- CreateIndex
CREATE INDEX "TimeSeriesMetric_targetType_targetId_idx" ON "TimeSeriesMetric"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ProductionPlan_lineId_status_idx" ON "ProductionPlan"("lineId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionPlan_lineId_planCode_key" ON "ProductionPlan"("lineId", "planCode");

-- CreateIndex
CREATE INDEX "MaterialRelease_planId_branch_idx" ON "MaterialRelease"("planId", "branch");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationClient_tokenHash_key" ON "IntegrationClient"("tokenHash");

-- CreateIndex
CREATE INDEX "IntegrationClient_tokenPrefix_idx" ON "IntegrationClient"("tokenPrefix");

-- CreateIndex
CREATE INDEX "IntegrationClient_isActive_idx" ON "IntegrationClient"("isActive");

-- CreateIndex
CREATE INDEX "IngestionBatch_clientId_idx" ON "IngestionBatch"("clientId");

-- CreateIndex
CREATE INDEX "IngestionBatch_receivedAt_idx" ON "IngestionBatch"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IngestionBatch_runId_sequenceNumber_key" ON "IngestionBatch"("runId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "InventoryAudit_runId_idx" ON "InventoryAudit"("runId");

-- CreateIndex
CREATE INDEX "InventoryAudit_conclusion_idx" ON "InventoryAudit"("conclusion");

-- CreateIndex
CREATE INDEX "InventoryAuditItem_auditId_idx" ON "InventoryAuditItem"("auditId");

-- CreateIndex
CREATE INDEX "InventoryAuditItem_status_idx" ON "InventoryAuditItem"("status");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ImportError_importJobId_idx" ON "ImportError"("importJobId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ModelVersion" ADD CONSTRAINT "ModelVersion_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "ProductionLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "ProductionLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelObject" ADD CONSTRAINT "ModelObject_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelObject" ADD CONSTRAINT "ModelObject_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelConnection" ADD CONSTRAINT "ModelConnection_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelConnection" ADD CONSTRAINT "ModelConnection_fromObjectId_fkey" FOREIGN KEY ("fromObjectId") REFERENCES "ModelObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelConnection" ADD CONSTRAINT "ModelConnection_toObjectId_fkey" FOREIGN KEY ("toObjectId") REFERENCES "ModelObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerResource" ADD CONSTRAINT "WorkerResource_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "ProductionLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "ProductionLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioConfiguration" ADD CONSTRAINT "ScenarioConfiguration_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectMetric" ADD CONSTRAINT "ObjectMetric_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SimulationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectMetric" ADD CONSTRAINT "ObjectMetric_modelObjectId_fkey" FOREIGN KEY ("modelObjectId") REFERENCES "ModelObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageMetric" ADD CONSTRAINT "StageMetric_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SimulationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageMetric" ADD CONSTRAINT "StageMetric_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSeriesMetric" ADD CONSTRAINT "TimeSeriesMetric_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SimulationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "ProductionLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRelease" ADD CONSTRAINT "MaterialRelease_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationClient" ADD CONSTRAINT "IntegrationClient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionBatch" ADD CONSTRAINT "IngestionBatch_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "IntegrationClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionBatch" ADD CONSTRAINT "IngestionBatch_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SimulationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAudit" ADD CONSTRAINT "InventoryAudit_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SimulationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAudit" ADD CONSTRAINT "InventoryAudit_auditedById_fkey" FOREIGN KEY ("auditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "InventoryAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAuditItem" ADD CONSTRAINT "InventoryAuditItem_modelObjectId_fkey" FOREIGN KEY ("modelObjectId") REFERENCES "ModelObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

