/*
  Warnings:

  - You are about to drop the `cctv` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employee` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `cctv`;

-- DropTable
DROP TABLE `employee`;

-- CreateTable
CREATE TABLE `postuserreport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `texttitle` TEXT NOT NULL,
    `image` TEXT NULL,
    `textstory` TEXT NULL,
    `map` TEXT NULL,
    `vdo` TEXT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commentinpostuserreport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `text` TEXT NOT NULL,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL,
    `vdo` TEXT NULL,
    `userId` INTEGER NULL,
    `postuserreportId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `postuserreport` ADD CONSTRAINT `postuserreport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentinpostuserreport` ADD CONSTRAINT `commentinpostuserreport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentinpostuserreport` ADD CONSTRAINT `commentinpostuserreport_postuserreportId_fkey` FOREIGN KEY (`postuserreportId`) REFERENCES `postuserreport`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
