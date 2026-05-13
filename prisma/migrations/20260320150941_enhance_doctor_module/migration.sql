/*
  Warnings:

  - You are about to drop the column `leaveFrom` on the `DoctorAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `leaveReason` on the `DoctorAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `leaveTo` on the `DoctorAvailability` table. All the data in the column will be lost.
  - Added the required column `hospitalId` to the `DoctorAvailability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DoctorAvailability` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Doctor` ADD COLUMN `experience` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `followUpFee` DOUBLE NULL,
    ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `profileImage` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `DoctorAvailability` DROP COLUMN `leaveFrom`,
    DROP COLUMN `leaveReason`,
    DROP COLUMN `leaveTo`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `hospitalId` VARCHAR(191) NOT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `slotDuration` INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `DoctorLeave` (
    `id` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `leaveFrom` DATETIME(3) NOT NULL,
    `leaveTo` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `isApproved` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DoctorLeave_doctorId_idx`(`doctorId`),
    INDEX `DoctorLeave_hospitalId_idx`(`hospitalId`),
    INDEX `DoctorLeave_doctorId_leaveFrom_leaveTo_idx`(`doctorId`, `leaveFrom`, `leaveTo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Doctor_hospitalId_departmentId_idx` ON `Doctor`(`hospitalId`, `departmentId`);

-- CreateIndex
CREATE INDEX `DoctorAvailability_hospitalId_idx` ON `DoctorAvailability`(`hospitalId`);

-- AddForeignKey
ALTER TABLE `DoctorLeave` ADD CONSTRAINT `DoctorLeave_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
