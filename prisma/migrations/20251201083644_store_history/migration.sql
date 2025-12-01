/*
  Warnings:

  - You are about to drop the column `doerMemberId` on the `store_history` table. All the data in the column will be lost.
  - Added the required column `userId` to the `store_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "store_history" DROP CONSTRAINT "store_history_doerMemberId_fkey";

-- AlterTable
ALTER TABLE "store_history" DROP COLUMN "doerMemberId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "store_history" ADD CONSTRAINT "store_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
