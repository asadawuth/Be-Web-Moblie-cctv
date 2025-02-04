/*
  Warnings:

  - Added the required column `province` to the `cctv` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `cctv` ADD COLUMN `province` VARCHAR(50) NOT NULL,
    MODIFY `type` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `employee` ADD COLUMN `province` VARCHAR(50) NOT NULL,
    MODIFY `type` VARCHAR(50) NULL;
