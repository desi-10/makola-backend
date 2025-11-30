/*
  Warnings:

  - You are about to drop the column `role` on the `store_members` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `store_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "store_members" DROP COLUMN "role",
ADD COLUMN     "roleId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "store_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
