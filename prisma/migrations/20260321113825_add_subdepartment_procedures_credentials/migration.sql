/*
  Warnings:

  - You are about to drop the `Bill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BillItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DoctorAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Visit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkflowTask` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[loginEmail]` on the table `SubDepartment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `SubDepartment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Bill` DROP FOREIGN KEY `Bill_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `Bill` DROP FOREIGN KEY `Bill_visitId_fkey`;

-- DropForeignKey
ALTER TABLE `BillItem` DROP FOREIGN KEY `BillItem_billId_fkey`;

-- DropForeignKey
ALTER TABLE `BillItem` DROP FOREIGN KEY `BillItem_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `BillItem` DROP FOREIGN KEY `BillItem_serviceItemId_fkey`;

-- DropForeignKey
ALTER TABLE `BillItem` DROP FOREIGN KEY `BillItem_workflowTaskId_fkey`;

-- DropForeignKey
ALTER TABLE `DoctorAction` DROP FOREIGN KEY `DoctorAction_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `DoctorAction` DROP FOREIGN KEY `DoctorAction_visitId_fkey`;

-- DropForeignKey
ALTER TABLE `ServiceItem` DROP FOREIGN KEY `ServiceItem_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `Visit` DROP FOREIGN KEY `Visit_doctorId_fkey`;

-- DropForeignKey
ALTER TABLE `Visit` DROP FOREIGN KEY `Visit_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `Visit` DROP FOREIGN KEY `Visit_patientId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkflowTask` DROP FOREIGN KEY `WorkflowTask_doctorActionId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkflowTask` DROP FOREIGN KEY `WorkflowTask_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkflowTask` DROP FOREIGN KEY `WorkflowTask_serviceItemId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkflowTask` DROP FOREIGN KEY `WorkflowTask_visitId_fkey`;

-- AlterTable
ALTER TABLE `SubDepartment` ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `color` VARCHAR(191) NULL DEFAULT '#3b82f6',
    ADD COLUMN `credentialsSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `flow` TEXT NULL,
    ADD COLUMN `hodEmail` VARCHAR(191) NULL,
    ADD COLUMN `hodName` VARCHAR(191) NULL,
    ADD COLUMN `hodPhone` VARCHAR(191) NULL,
    ADD COLUMN `hodStaffId` VARCHAR(191) NULL,
    ADD COLUMN `loginEmail` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `type` ENUM('PHARMACY', 'PATHOLOGY', 'RADIOLOGY', 'PROCEDURE', 'LABORATORY', 'DENTAL', 'DERMATOLOGY', 'HAIR', 'ONCOLOGY', 'CARDIOLOGY', 'BILLING', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'SUB_DEPT_HEAD') NOT NULL;

-- DropTable
DROP TABLE `Bill`;

-- DropTable
DROP TABLE `BillItem`;

-- DropTable
DROP TABLE `DoctorAction`;

-- DropTable
DROP TABLE `ServiceItem`;

-- DropTable
DROP TABLE `Visit`;

-- DropTable
DROP TABLE `WorkflowTask`;

-- CreateTable
CREATE TABLE `Procedure` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `subDepartmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('DIAGNOSTIC', 'TREATMENT', 'CONSULTATION', 'SURGERY', 'THERAPY', 'MEDICATION', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `fee` DOUBLE NULL,
    `duration` INTEGER NULL,
    `sequence` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Procedure_hospitalId_idx`(`hospitalId`),
    INDEX `Procedure_subDepartmentId_idx`(`subDepartmentId`),
    INDEX `Procedure_hospitalId_subDepartmentId_idx`(`hospitalId`, `subDepartmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `SubDepartment_loginEmail_key` ON `SubDepartment`(`loginEmail`);

-- CreateIndex
CREATE UNIQUE INDEX `SubDepartment_userId_key` ON `SubDepartment`(`userId`);

-- AddForeignKey
ALTER TABLE `SubDepartment` ADD CONSTRAINT `SubDepartment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Procedure` ADD CONSTRAINT `Procedure_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Procedure` ADD CONSTRAINT `Procedure_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
