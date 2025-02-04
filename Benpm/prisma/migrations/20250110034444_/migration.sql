/*
  Warnings:

  - You are about to drop the `gpsdata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `gpsdata`;

-- CreateTable
CREATE TABLE `requestwatchcctv` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` TEXT NOT NULL,
    `lastName` TEXT NOT NULL,
    `tel` TEXT NOT NULL,
    `nationalId` VARCHAR(13) NOT NULL,
    `numDocument` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `point` TEXT NOT NULL,
    `status` TEXT NOT NULL,
    `remark` TEXT NULL,
    `image` TEXT NOT NULL,
    `userId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sosvoiceorvdo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `statustell` TEXT NULL,
    `file` TEXT NULL,
    `fileType` TEXT NULL,
    `process` TEXT NULL,
    `callStatus` TEXT NULL,
    `startTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NULL,
    `adminId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `requestwatchcctv` ADD CONSTRAINT `requestwatchcctv_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sosvoiceorvdo` ADD CONSTRAINT `sosvoiceorvdo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sosvoiceorvdo` ADD CONSTRAINT `sosvoiceorvdo_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
