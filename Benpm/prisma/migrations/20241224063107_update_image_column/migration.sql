/*
  Warnings:

  - You are about to drop the column `postuserreportId` on the `commentinpostuserreport` table. All the data in the column will be lost.
  - Added the required column `reportId` to the `commentinpostuserreport` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `commentinpostuserreport` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `commentinpostuserreport` DROP FOREIGN KEY `commentinpostuserreport_postuserreportId_fkey`;

-- DropForeignKey
ALTER TABLE `commentinpostuserreport` DROP FOREIGN KEY `commentinpostuserreport_userId_fkey`;

-- AlterTable
ALTER TABLE `commentinpostuserreport` DROP COLUMN `postuserreportId`,
    ADD COLUMN `reportId` INTEGER NOT NULL,
    MODIFY `userId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `gpsdata` (
    `zone_number` INTEGER NOT NULL,
    `latitude` VARCHAR(191) NULL,
    `longtitude` VARCHAR(191) NULL,
    `gps_link` VARCHAR(191) NULL,
    `details` VARCHAR(191) NULL,

    PRIMARY KEY (`zone_number`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `datashop` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `image` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `details` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `latitude` VARCHAR(191) NULL,
    `longtitude` VARCHAR(191) NULL,
    `userId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commentshop` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment` TEXT NOT NULL,
    `image` TEXT NOT NULL,
    `score` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL,
    `datashopId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `commentinpostuserreport` ADD CONSTRAINT `commentinpostuserreport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentinpostuserreport` ADD CONSTRAINT `commentinpostuserreport_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `postuserreport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `datashop` ADD CONSTRAINT `datashop_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentshop` ADD CONSTRAINT `commentshop_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentshop` ADD CONSTRAINT `commentshop_datashopId_fkey` FOREIGN KEY (`datashopId`) REFERENCES `datashop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
