/*
  Warnings:

  - You are about to drop the column `adminId` on the `sosvoiceorvdo` table. All the data in the column will be lost.
  - You are about to drop the column `callStatus` on the `sosvoiceorvdo` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `sosvoiceorvdo` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `sosvoiceorvdo` table. All the data in the column will be lost.
  - You are about to drop the column `process` on the `sosvoiceorvdo` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `sosvoiceorvdo` table. All the data in the column will be lost.
  - You are about to drop the column `statustell` on the `sosvoiceorvdo` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `requestwatchcctv` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `sosvoiceorvdo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `sosvoiceorvdo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `sosvoiceorvdo` DROP FOREIGN KEY `sosvoiceorvdo_adminId_fkey`;

-- AlterTable
ALTER TABLE `postuserreport` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `requestwatchcctv` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `sosvoiceorvdo` DROP COLUMN `adminId`,
    DROP COLUMN `callStatus`,
    DROP COLUMN `endTime`,
    DROP COLUMN `fileType`,
    DROP COLUMN `process`,
    DROP COLUMN `startTime`,
    DROP COLUMN `statustell`,
    ADD COLUMN `latitude` VARCHAR(191) NULL,
    ADD COLUMN `longtitude` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
