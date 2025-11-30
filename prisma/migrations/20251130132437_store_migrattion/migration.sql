-- AlterTable
ALTER TABLE "store" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "store_members" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "store_role_permissions" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "store_roles" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "store_history" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "doerMemberId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "meta" JSONB,

    CONSTRAINT "store_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_id_organizationId_idx" ON "store"("id", "organizationId");

-- CreateIndex
CREATE INDEX "store_id_organizationId_isActive_idx" ON "store"("id", "organizationId", "isActive");

-- CreateIndex
CREATE INDEX "store_members_id_userId_storeId_idx" ON "store_members"("id", "userId", "storeId");

-- CreateIndex
CREATE INDEX "store_members_id_userId_storeId_isActive_idx" ON "store_members"("id", "userId", "storeId", "isActive");

-- CreateIndex
CREATE INDEX "store_roles_id_storeId_idx" ON "store_roles"("id", "storeId");

-- CreateIndex
CREATE INDEX "store_roles_id_storeId_isActive_idx" ON "store_roles"("id", "storeId", "isActive");

-- AddForeignKey
ALTER TABLE "store_history" ADD CONSTRAINT "store_history_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_history" ADD CONSTRAINT "store_history_doerMemberId_fkey" FOREIGN KEY ("doerMemberId") REFERENCES "store_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
