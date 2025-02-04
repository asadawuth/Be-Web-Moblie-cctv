/*
  Warnings:

  - You are about to drop the column `point` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `point`,
    ADD COLUMN `profile` VARCHAR(191) NULL;
