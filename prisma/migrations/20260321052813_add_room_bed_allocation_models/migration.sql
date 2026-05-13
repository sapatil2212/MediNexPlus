/*
  Warnings:

  - You are about to drop the column `capacity` on the `Ward` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomId,bedNumber]` on the table `Bed` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Bed_wardId_bedNumber_key` ON `Bed`;

-- AlterTable
ALTER TABLE `Bed` ADD COLUMN `bedType` ENUM('NORMAL', 'ICU', 'VENTILATOR', 'ELECTRIC', 'PEDIATRIC') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `roomId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Ward` DROP COLUMN `capacity`,
    ADD COLUMN `description` TEXT NULL;

-- CreateTable
CREATE TABLE `Room` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `wardId` VARCHAR(191) NOT NULL,
    `roomNumber` VARCHAR(191) NOT NULL,
    `roomType` ENUM('SHARED', 'PRIVATE', 'SEMI_PRIVATE', 'ICU', 'ISOLATION') NOT NULL DEFAULT 'SHARED',
    `capacity` INTEGER NOT NULL DEFAULT 1,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Room_hospitalId_idx`(`hospitalId`),
    INDEX `Room_wardId_idx`(`wardId`),
    UNIQUE INDEX `Room_wardId_roomNumber_key`(`wardId`, `roomNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BedAllocation` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `bedId` VARCHAR(191) NOT NULL,
    `patientName` VARCHAR(191) NOT NULL,
    `patientAge` INTEGER NULL,
    `patientGender` VARCHAR(191) NULL,
    `patientPhone` VARCHAR(191) NULL,
    `attendantName` VARCHAR(191) NULL,
    `attendantPhone` VARCHAR(191) NULL,
    `diagnosis` TEXT NULL,
    `admittingDoctorName` VARCHAR(191) NULL,
    `admissionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedDischargeDate` DATETIME(3) NULL,
    `actualDischargeDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'DISCHARGED', 'TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BedAllocation_hospitalId_idx`(`hospitalId`),
    INDEX `BedAllocation_bedId_idx`(`bedId`),
    INDEX `BedAllocation_status_idx`(`status`),
    INDEX `BedAllocation_hospitalId_status_idx`(`hospitalId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Bed_roomId_idx` ON `Bed`(`roomId`);

-- CreateIndex
CREATE INDEX `Bed_status_idx` ON `Bed`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `Bed_roomId_bedNumber_key` ON `Bed`(`roomId`, `bedNumber`);

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_wardId_fkey` FOREIGN KEY (`wardId`) REFERENCES `Ward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bed` ADD CONSTRAINT `Bed_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BedAllocation` ADD CONSTRAINT `BedAllocation_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BedAllocation` ADD CONSTRAINT `BedAllocation_bedId_fkey` FOREIGN KEY (`bedId`) REFERENCES `Bed`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
