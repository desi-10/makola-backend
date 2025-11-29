/*
  Warnings:

  - You are about to drop the column `browser` on the `organization_history` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `organization_history` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `organization_history` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `organization_history` table. All the data in the column will be lost.
  - You are about to drop the column `device` on the `organization_history` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `organization_history` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `organization_history` table. All the data in the column will be lost.
  - You are about to drop the column `os` on the `organization_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organization_history" DROP COLUMN "browser",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "data",
DROP COLUMN "device",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "os",
ADD COLUMN     "reason" TEXT;
