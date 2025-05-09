/*
  Warnings:

  - You are about to drop the column `createdAt` on the `measurements` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `measurements` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `photos` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `photos` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `angle` on the `photos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "measurements" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "photos" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "angle",
ADD COLUMN     "angle" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- DropEnum
DROP TYPE "PhotoAngle";

-- DropEnum
DROP TYPE "Role";
