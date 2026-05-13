/*
  Warnings:

  - You are about to drop the column `autoAssignToken` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `displayOrder` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `maxPatientsPerDay` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `requiresAppointment` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Supplier` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Department_hospitalId_displayOrder_idx` ON `Department`;

-- AlterTable
ALTER TABLE `Department` DROP COLUMN `autoAssignToken`,
    DROP COLUMN `color`,
    DROP COLUMN `displayOrder`,
    DROP COLUMN `icon`,
    DROP COLUMN `maxPatientsPerDay`,
    DROP COLUMN `metadata`,
    DROP COLUMN `requiresAppointment`,
    DROP COLUMN `workingHours`,
    ADD COLUMN `customTypeName` VARCHAR(191) NULL,
    ADD COLUMN `hodUserId` VARCHAR(191) NULL,
    MODIFY `type` ENUM('OPD', 'IPD', 'CLINICAL', 'DIAGNOSTIC', 'PROCEDURE', 'SUPPORT', 'ADMINISTRATIVE', 'CUSTOM') NOT NULL DEFAULT 'OPD';

-- AlterTable
ALTER TABLE `Doctor` ADD COLUMN `doctorCode` VARCHAR(191) NULL,
    MODIFY `profileImage` TEXT NULL;

-- AlterTable
ALTER TABLE `HospitalSettings` ADD COLUMN `letterhead` TEXT NULL,
    ADD COLUMN `letterheadSize` VARCHAR(191) NULL DEFAULT 'A4',
    ADD COLUMN `letterheadType` VARCHAR(191) NULL DEFAULT 'IMAGE';

-- AlterTable
ALTER TABLE `Prescription` ADD COLUMN `aiProcessedAt` DATETIME(3) NULL,
    ADD COLUMN `transcription` TEXT NULL,
    ADD COLUMN `transcriptionMetadata` TEXT NULL,
    ADD COLUMN `voiceRecordingUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `SubDepartment` ADD COLUMN `accessFeatures` TEXT NULL,
    ADD COLUMN `customName` VARCHAR(191) NULL,
    MODIFY `type` ENUM('PHARMACY', 'PATHOLOGY', 'RADIOLOGY', 'PROCEDURE', 'LABORATORY', 'DENTAL', 'DERMATOLOGY', 'HAIR', 'ONCOLOGY', 'CARDIOLOGY', 'BILLING', 'RECEPTION', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `Supplier` DROP COLUMN `address`,
    ADD COLUMN `accountNumber` VARCHAR(191) NULL,
    ADD COLUMN `address1` TEXT NULL,
    ADD COLUMN `address2` TEXT NULL,
    ADD COLUMN `altPhone` VARCHAR(191) NULL,
    ADD COLUMN `bankName` VARCHAR(191) NULL,
    ADD COLUMN `brandAssociations` TEXT NULL,
    ADD COLUMN `categoriesSupplied` TEXT NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL DEFAULT 'India',
    ADD COLUMN `creditLimit` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `deliveryLeadTime` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `designation` VARCHAR(191) NULL,
    ADD COLUMN `documents` TEXT NULL,
    ADD COLUMN `drugLicense` VARCHAR(191) NULL,
    ADD COLUMN `fssaiLicense` VARCHAR(191) NULL,
    ADD COLUMN `ifscCode` VARCHAR(191) NULL,
    ADD COLUMN `isBlacklisted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPreferred` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `openingBalance` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `panNumber` VARCHAR(191) NULL,
    ADD COLUMN `paymentTerms` VARCHAR(191) NULL DEFAULT 'Immediate',
    ADD COLUMN `pincode` VARCHAR(191) NULL,
    ADD COLUMN `preferredPaymentMode` VARCHAR(191) NULL DEFAULT 'Bank Transfer',
    ADD COLUMN `specialInstructions` TEXT NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    ADD COLUMN `upiId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `userCode` VARCHAR(191) NULL,
    MODIFY `profilePhoto` TEXT NULL;

-- CreateTable
CREATE TABLE `ServiceItem` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NULL,
    `subDeptId` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `cost` DOUBLE NOT NULL DEFAULT 0,
    `duration` INTEGER NOT NULL DEFAULT 30,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceItem_hospitalId_idx`(`hospitalId`),
    INDEX `ServiceItem_hospitalId_type_idx`(`hospitalId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Visit` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NULL,
    `appointmentId` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `visitNumber` VARCHAR(191) NOT NULL,
    `visitType` ENUM('OPD', 'EMERGENCY', 'FOLLOW_UP', 'IPD') NOT NULL DEFAULT 'OPD',
    `status` ENUM('REGISTERED', 'WAITING', 'IN_CONSULTATION', 'ACTIONS_PENDING', 'IN_PROGRESS', 'BILLING_PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    `chiefComplaint` TEXT NULL,
    `diagnosis` TEXT NULL,
    `notes` TEXT NULL,
    `tokenNumber` INTEGER NULL,
    `checkinTime` DATETIME(3) NULL,
    `consultStart` DATETIME(3) NULL,
    `consultEnd` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Visit_hospitalId_idx`(`hospitalId`),
    INDEX `Visit_patientId_idx`(`patientId`),
    INDEX `Visit_doctorId_idx`(`doctorId`),
    INDEX `Visit_hospitalId_status_idx`(`hospitalId`, `status`),
    INDEX `Visit_hospitalId_createdAt_idx`(`hospitalId`, `createdAt`),
    UNIQUE INDEX `Visit_hospitalId_visitNumber_key`(`hospitalId`, `visitNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DoctorAction` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `visitId` VARCHAR(191) NOT NULL,
    `actionType` ENUM('PRESCRIPTION', 'TEST', 'PROCEDURE', 'ADMISSION', 'REFERRAL', 'FOLLOW_UP', 'CONSULTATION_NOTE') NOT NULL,
    `serviceItemId` VARCHAR(191) NULL,
    `targetDeptId` VARCHAR(191) NULL,
    `subDeptType` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `payload` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DoctorAction_hospitalId_idx`(`hospitalId`),
    INDEX `DoctorAction_visitId_idx`(`visitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowTask` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `visitId` VARCHAR(191) NOT NULL,
    `doctorActionId` VARCHAR(191) NULL,
    `taskType` VARCHAR(191) NOT NULL,
    `subDeptType` VARCHAR(191) NULL,
    `serviceItemId` VARCHAR(191) NULL,
    `assignedTo` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `resultNotes` TEXT NULL,
    `reportUrl` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WorkflowTask_doctorActionId_key`(`doctorActionId`),
    INDEX `WorkflowTask_hospitalId_idx`(`hospitalId`),
    INDEX `WorkflowTask_visitId_idx`(`visitId`),
    INDEX `WorkflowTask_hospitalId_taskType_status_idx`(`hospitalId`, `taskType`, `status`),
    INDEX `WorkflowTask_hospitalId_status_idx`(`hospitalId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `targetRole` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_hospitalId_idx`(`hospitalId`),
    INDEX `Notification_hospitalId_isRead_idx`(`hospitalId`, `isRead`),
    INDEX `Notification_hospitalId_targetRole_idx`(`hospitalId`, `targetRole`),
    INDEX `Notification_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_hodUserId_fkey` FOREIGN KEY (`hodUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceItem` ADD CONSTRAINT `ServiceItem_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visit` ADD CONSTRAINT `Visit_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DoctorAction` ADD CONSTRAINT `DoctorAction_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DoctorAction` ADD CONSTRAINT `DoctorAction_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `Visit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowTask` ADD CONSTRAINT `WorkflowTask_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowTask` ADD CONSTRAINT `WorkflowTask_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `Visit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowTask` ADD CONSTRAINT `WorkflowTask_doctorActionId_fkey` FOREIGN KEY (`doctorActionId`) REFERENCES `DoctorAction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowTask` ADD CONSTRAINT `WorkflowTask_serviceItemId_fkey` FOREIGN KEY (`serviceItemId`) REFERENCES `ServiceItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockBatch` ADD CONSTRAINT `StockBatch_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
