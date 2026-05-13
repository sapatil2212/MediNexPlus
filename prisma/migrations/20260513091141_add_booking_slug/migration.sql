/*
  Warnings:

  - The values [NURSING] on the enum `Department_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [NURSING_ADMIN,STAFF_NURSE,DUTY_NURSE] on the enum `RolePermission_role` will be removed. If these variants are still used in the database, this will fail.
  - The values [NURSING_ADMIN,STAFF_NURSE,DUTY_NURSE] on the enum `RolePermission_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Admission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Alert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DepartmentTransfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DoctorOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicationLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicationSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NursingNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VitalsLog` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bookingSlug]` on the table `HospitalSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Admission` DROP FOREIGN KEY `Admission_admittingDoctorId_fkey`;

-- DropForeignKey
ALTER TABLE `Admission` DROP FOREIGN KEY `Admission_bedId_fkey`;

-- DropForeignKey
ALTER TABLE `Admission` DROP FOREIGN KEY `Admission_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `Admission` DROP FOREIGN KEY `Admission_patientId_fkey`;

-- DropForeignKey
ALTER TABLE `Admission` DROP FOREIGN KEY `Admission_wardId_fkey`;

-- DropForeignKey
ALTER TABLE `Alert` DROP FOREIGN KEY `Alert_admissionId_fkey`;

-- DropForeignKey
ALTER TABLE `Alert` DROP FOREIGN KEY `Alert_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `Alert` DROP FOREIGN KEY `Alert_resolvedBy_fkey`;

-- DropForeignKey
ALTER TABLE `Appointment` DROP FOREIGN KEY `Appointment_doctorId_fkey`;

-- DropForeignKey
ALTER TABLE `DepartmentTransfer` DROP FOREIGN KEY `DepartmentTransfer_admissionId_fkey`;

-- DropForeignKey
ALTER TABLE `DepartmentTransfer` DROP FOREIGN KEY `DepartmentTransfer_fromDepartmentId_fkey`;

-- DropForeignKey
ALTER TABLE `DepartmentTransfer` DROP FOREIGN KEY `DepartmentTransfer_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `DepartmentTransfer` DROP FOREIGN KEY `DepartmentTransfer_initiatedBy_fkey`;

-- DropForeignKey
ALTER TABLE `DepartmentTransfer` DROP FOREIGN KEY `DepartmentTransfer_toDepartmentId_fkey`;

-- DropForeignKey
ALTER TABLE `DoctorOrder` DROP FOREIGN KEY `DoctorOrder_admissionId_fkey`;

-- DropForeignKey
ALTER TABLE `DoctorOrder` DROP FOREIGN KEY `DoctorOrder_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `DoctorOrder` DROP FOREIGN KEY `DoctorOrder_orderingDoctorId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationLog` DROP FOREIGN KEY `MedicationLog_administeringNurseId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationLog` DROP FOREIGN KEY `MedicationLog_admissionId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationLog` DROP FOREIGN KEY `MedicationLog_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationLog` DROP FOREIGN KEY `MedicationLog_medicationScheduleId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationSchedule` DROP FOREIGN KEY `MedicationSchedule_admissionId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationSchedule` DROP FOREIGN KEY `MedicationSchedule_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationSchedule` DROP FOREIGN KEY `MedicationSchedule_itemId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationSchedule` DROP FOREIGN KEY `MedicationSchedule_prescribingDoctorId_fkey`;

-- DropForeignKey
ALTER TABLE `NursingNote` DROP FOREIGN KEY `NursingNote_admissionId_fkey`;

-- DropForeignKey
ALTER TABLE `NursingNote` DROP FOREIGN KEY `NursingNote_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `NursingNote` DROP FOREIGN KEY `NursingNote_nurseId_fkey`;

-- DropForeignKey
ALTER TABLE `VitalsLog` DROP FOREIGN KEY `VitalsLog_admissionId_fkey`;

-- DropForeignKey
ALTER TABLE `VitalsLog` DROP FOREIGN KEY `VitalsLog_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `VitalsLog` DROP FOREIGN KEY `VitalsLog_nurseId_fkey`;

-- DropIndex
DROP INDEX `Patient_hospitalId_phone_key` ON `Patient`;

-- AlterTable
ALTER TABLE `Appointment` MODIFY `doctorId` VARCHAR(191) NULL,
    MODIFY `timeSlot` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Department` MODIFY `type` ENUM('OPD', 'IPD', 'CLINICAL', 'DIAGNOSTIC', 'PROCEDURE', 'SUPPORT', 'ADMINISTRATIVE', 'CUSTOM') NOT NULL DEFAULT 'OPD';

-- AlterTable
ALTER TABLE `DoctorAttendance` ADD COLUMN `loginIp` VARCHAR(191) NULL,
    ADD COLUMN `loginLocation` TEXT NULL,
    ADD COLUMN `logoutIp` VARCHAR(191) NULL,
    ADD COLUMN `logoutLocation` TEXT NULL,
    ADD COLUMN `totalWorkHours` DOUBLE NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Expense` ADD COLUMN `addedByName` VARCHAR(191) NULL,
    ADD COLUMN `department` VARCHAR(191) NULL,
    MODIFY `category` ENUM('SALARY', 'EQUIPMENT', 'MAINTENANCE', 'UTILITY', 'MEDICINE', 'INVENTORY', 'HOUSEKEEPING', 'MARKETING', 'INSURANCE_EXPENSE', 'OTHER') NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE `HospitalSettings` ADD COLUMN `bookingSlug` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Patient` ADD COLUMN `whatsapp` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Prescription` MODIFY `appointmentId` VARCHAR(191) NULL,
    MODIFY `doctorId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('DRAFT', 'COMPLETED', 'IN_WORKFLOW', 'BILLING_PENDING', 'BILLED', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `PrescriptionWorkflow` MODIFY `subDepartmentId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'HOLD') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `Purchase` ADD COLUMN `amountPaid` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `discount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `grandTotal` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `invoiceDate` DATETIME(3) NULL,
    ADD COLUMN `invoiceNumber` VARCHAR(191) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `paymentType` VARCHAR(191) NOT NULL DEFAULT 'CREDIT',
    ADD COLUMN `reminderSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `subDepartmentId` VARCHAR(191) NULL,
    ADD COLUMN `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `taxPercent` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `transactionId` VARCHAR(191) NULL,
    MODIFY `supplierId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Revenue` ADD COLUMN `addedBy` VARCHAR(191) NULL,
    ADD COLUMN `department` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `RolePermission` MODIFY `role` ENUM('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'DEPT_HEAD', 'SUB_DEPT_HEAD', 'FINANCE_HEAD') NOT NULL;

-- AlterTable
ALTER TABLE `SubDepartment` ADD COLUMN `loginPasswordPlain` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'DEPT_HEAD', 'SUB_DEPT_HEAD', 'FINANCE_HEAD') NOT NULL;

-- AlterTable
ALTER TABLE `WorkflowTask` MODIFY `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'HOLD') NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE `Admission`;

-- DropTable
DROP TABLE `Alert`;

-- DropTable
DROP TABLE `DepartmentTransfer`;

-- DropTable
DROP TABLE `DoctorOrder`;

-- DropTable
DROP TABLE `MedicationLog`;

-- DropTable
DROP TABLE `MedicationSchedule`;

-- DropTable
DROP TABLE `NursingNote`;

-- DropTable
DROP TABLE `VitalsLog`;

-- CreateTable
CREATE TABLE `BedAllocation` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `bedId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `entryType` VARCHAR(191) NULL DEFAULT 'PATIENT',
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
    INDEX `BedAllocation_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockLocation` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'CENTRAL',
    `subDepartmentId` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockLocation_hospitalId_idx`(`hospitalId`),
    INDEX `StockLocation_subDepartmentId_idx`(`subDepartmentId`),
    INDEX `StockLocation_departmentId_idx`(`departmentId`),
    UNIQUE INDEX `StockLocation_hospitalId_code_key`(`hospitalId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockTransfer` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `transferNo` VARCHAR(191) NOT NULL,
    `fromLocationId` VARCHAR(191) NOT NULL,
    `toLocationId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `requestedBy` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `transferredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockTransfer_hospitalId_idx`(`hospitalId`),
    INDEX `StockTransfer_fromLocationId_idx`(`fromLocationId`),
    INDEX `StockTransfer_toLocationId_idx`(`toLocationId`),
    INDEX `StockTransfer_status_idx`(`status`),
    UNIQUE INDEX `StockTransfer_hospitalId_transferNo_key`(`hospitalId`, `transferNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockTransferItem` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `transferId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `receivedQty` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,

    INDEX `StockTransferItem_transferId_idx`(`transferId`),
    INDEX `StockTransferItem_itemId_idx`(`itemId`),
    INDEX `StockTransferItem_hospitalId_idx`(`hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockReturn` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `returnNo` VARCHAR(191) NOT NULL,
    `fromLocationId` VARCHAR(191) NOT NULL,
    `toLocationId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'EXCESS',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `requestedBy` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `returnedAt` DATETIME(3) NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockReturn_hospitalId_idx`(`hospitalId`),
    INDEX `StockReturn_fromLocationId_idx`(`fromLocationId`),
    INDEX `StockReturn_toLocationId_idx`(`toLocationId`),
    INDEX `StockReturn_status_idx`(`status`),
    UNIQUE INDEX `StockReturn_hospitalId_returnNo_key`(`hospitalId`, `returnNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabTest` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `subDepartmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `specimenType` VARCHAR(191) NOT NULL DEFAULT 'BLOOD',
    `price` DOUBLE NOT NULL DEFAULT 0,
    `unit` VARCHAR(191) NULL,
    `normalRangeMin` DOUBLE NULL,
    `normalRangeMax` DOUBLE NULL,
    `normalRangeText` VARCHAR(191) NULL,
    `method` VARCHAR(191) NULL,
    `turnaroundHrs` INTEGER NOT NULL DEFAULT 24,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `machineId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LabTest_hospitalId_idx`(`hospitalId`),
    INDEX `LabTest_subDepartmentId_idx`(`subDepartmentId`),
    INDEX `LabTest_hospitalId_category_idx`(`hospitalId`, `category`),
    UNIQUE INDEX `LabTest_hospitalId_code_key`(`hospitalId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabPanel` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `subDepartmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LabPanel_hospitalId_idx`(`hospitalId`),
    INDEX `LabPanel_subDepartmentId_idx`(`subDepartmentId`),
    UNIQUE INDEX `LabPanel_hospitalId_code_key`(`hospitalId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabPanelItem` (
    `id` VARCHAR(191) NOT NULL,
    `panelId` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `sequence` INTEGER NOT NULL DEFAULT 0,

    INDEX `LabPanelItem_panelId_idx`(`panelId`),
    INDEX `LabPanelItem_testId_idx`(`testId`),
    UNIQUE INDEX `LabPanelItem_panelId_testId_key`(`panelId`, `testId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabOrder` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `subDepartmentId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `doctorId` VARCHAR(191) NULL,
    `orderNo` VARCHAR(191) NOT NULL,
    `priority` ENUM('ROUTINE', 'URGENT', 'STAT') NOT NULL DEFAULT 'ROUTINE',
    `status` ENUM('PENDING', 'SAMPLE_COLLECTED', 'IN_PROCESS', 'RESULT_ENTERED', 'VERIFIED', 'REPORTED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `orderType` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `clinicalNotes` TEXT NULL,
    `referralNotes` TEXT NULL,
    `isHomeCollection` BOOLEAN NOT NULL DEFAULT false,
    `collectionAddress` TEXT NULL,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `interpretation` TEXT NULL,
    `impression` TEXT NULL,
    `pathologistRemarks` TEXT NULL,
    `recommendation` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LabOrder_hospitalId_idx`(`hospitalId`),
    INDEX `LabOrder_subDepartmentId_idx`(`subDepartmentId`),
    INDEX `LabOrder_patientId_idx`(`patientId`),
    INDEX `LabOrder_appointmentId_idx`(`appointmentId`),
    INDEX `LabOrder_hospitalId_status_idx`(`hospitalId`, `status`),
    INDEX `LabOrder_hospitalId_createdAt_idx`(`hospitalId`, `createdAt`),
    UNIQUE INDEX `LabOrder_hospitalId_orderNo_key`(`hospitalId`, `orderNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabOrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NULL,
    `panelId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'IN_PROCESS', 'RESULT_ENTERED', 'VERIFIED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `result` TEXT NULL,
    `unit` VARCHAR(191) NULL,
    `normalRange` VARCHAR(191) NULL,
    `isAbnormal` BOOLEAN NOT NULL DEFAULT false,
    `isCritical` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `enteredBy` VARCHAR(191) NULL,
    `enteredAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LabOrderItem_orderId_idx`(`orderId`),
    INDEX `LabOrderItem_testId_idx`(`testId`),
    INDEX `LabOrderItem_panelId_idx`(`panelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabSample` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `barcodeId` VARCHAR(191) NOT NULL,
    `specimenType` VARCHAR(191) NOT NULL DEFAULT 'BLOOD',
    `collectedBy` VARCHAR(191) NULL,
    `collectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `receivedAt` DATETIME(3) NULL,
    `receivedBy` VARCHAR(191) NULL,
    `status` ENUM('COLLECTED', 'RECEIVED', 'IN_PROCESS', 'REJECTED', 'DISPOSED') NOT NULL DEFAULT 'COLLECTED',
    `rejectionReason` VARCHAR(191) NULL,
    `notes` TEXT NULL,

    UNIQUE INDEX `LabSample_orderId_key`(`orderId`),
    INDEX `LabSample_hospitalId_idx`(`hospitalId`),
    INDEX `LabSample_hospitalId_status_idx`(`hospitalId`, `status`),
    UNIQUE INDEX `LabSample_hospitalId_barcodeId_key`(`hospitalId`, `barcodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabReport` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `reportData` LONGTEXT NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `deliveryMethod` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'VERIFIED', 'DELIVERED') NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LabReport_orderId_key`(`orderId`),
    INDEX `LabReport_hospitalId_idx`(`hospitalId`),
    INDEX `LabReport_hospitalId_status_idx`(`hospitalId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IPDAdmission` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `allocationId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NULL,
    `ipdNumber` VARCHAR(191) NOT NULL,
    `admissionType` ENUM('EMERGENCY', 'PLANNED', 'TRANSFER') NOT NULL DEFAULT 'PLANNED',
    `assignedDoctorId` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `insuranceProvider` VARCHAR(191) NULL,
    `insuranceId` VARCHAR(191) NULL,
    `corporateName` VARCHAR(191) NULL,
    `admissionNotes` TEXT NULL,
    `status` ENUM('ADMITTED', 'DISCHARGED', 'TRANSFERRED') NOT NULL DEFAULT 'ADMITTED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IPDAdmission_allocationId_key`(`allocationId`),
    INDEX `IPDAdmission_hospitalId_idx`(`hospitalId`),
    INDEX `IPDAdmission_hospitalId_status_idx`(`hospitalId`, `status`),
    INDEX `IPDAdmission_patientId_idx`(`patientId`),
    UNIQUE INDEX `IPDAdmission_hospitalId_ipdNumber_key`(`hospitalId`, `ipdNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IPDVitals` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordedBy` VARCHAR(191) NULL,
    `bloodPressureSystolic` INTEGER NULL,
    `bloodPressureDiastolic` INTEGER NULL,
    `pulse` INTEGER NULL,
    `temperature` DOUBLE NULL,
    `respiratoryRate` INTEGER NULL,
    `oxygenSaturation` DOUBLE NULL,
    `bloodSugar` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `notes` TEXT NULL,

    INDEX `IPDVitals_admissionId_idx`(`admissionId`),
    INDEX `IPDVitals_hospitalId_idx`(`hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IPDClinicalNote` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `type` ENUM('DOCTOR_ROUND', 'PROGRESS_NOTE', 'NURSING_NOTE', 'TREATMENT_PLAN', 'DIAGNOSIS') NOT NULL DEFAULT 'PROGRESS_NOTE',
    `content` TEXT NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorRole` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `IPDClinicalNote_admissionId_idx`(`admissionId`),
    INDEX `IPDClinicalNote_hospitalId_idx`(`hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IPDMedicationOrder` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `medicationName` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `route` ENUM('ORAL', 'IV', 'IM', 'SC', 'TOPICAL', 'INHALATION', 'OTHER') NOT NULL DEFAULT 'ORAL',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    `prescribedBy` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `IPDMedicationOrder_admissionId_idx`(`admissionId`),
    INDEX `IPDMedicationOrder_hospitalId_idx`(`hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IPDMedicationAdministration` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `scheduledTime` DATETIME(3) NOT NULL,
    `administeredAt` DATETIME(3) NULL,
    `administeredBy` VARCHAR(191) NULL,
    `status` ENUM('GIVEN', 'MISSED', 'HELD', 'REFUSED') NOT NULL DEFAULT 'GIVEN',
    `notes` VARCHAR(191) NULL,

    INDEX `IPDMedicationAdministration_orderId_idx`(`orderId`),
    INDEX `IPDMedicationAdministration_hospitalId_idx`(`hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IPDBedTransfer` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `fromBedId` VARCHAR(191) NULL,
    `toBedId` VARCHAR(191) NULL,
    `fromWardId` VARCHAR(191) NULL,
    `toWardId` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `transferredBy` VARCHAR(191) NULL,
    `transferredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `IPDBedTransfer_admissionId_idx`(`admissionId`),
    INDEX `IPDBedTransfer_hospitalId_idx`(`hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IPDDischargeSummary` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `finalDiagnosis` TEXT NULL,
    `conditionAtDischarge` VARCHAR(191) NULL,
    `dischargeMedications` LONGTEXT NULL,
    `followUpInstructions` TEXT NULL,
    `dietaryInstructions` TEXT NULL,
    `billingCleared` BOOLEAN NOT NULL DEFAULT false,
    `dischargedBy` VARCHAR(191) NULL,
    `dischargedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `IPDDischargeSummary_admissionId_key`(`admissionId`),
    INDEX `IPDDischargeSummary_hospitalId_idx`(`hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `HospitalSettings_bookingSlug_key` ON `HospitalSettings`(`bookingSlug`);

-- CreateIndex
CREATE INDEX `Purchase_paymentStatus_idx` ON `Purchase`(`paymentStatus`);

-- CreateIndex
CREATE INDEX `Purchase_dueDate_idx` ON `Purchase`(`dueDate`);

-- AddForeignKey
ALTER TABLE `BedAllocation` ADD CONSTRAINT `BedAllocation_bedId_fkey` FOREIGN KEY (`bedId`) REFERENCES `Bed`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BedAllocation` ADD CONSTRAINT `BedAllocation_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BedAllocation` ADD CONSTRAINT `BedAllocation_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockLocation` ADD CONSTRAINT `StockLocation_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockLocation` ADD CONSTRAINT `StockLocation_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockLocation` ADD CONSTRAINT `StockLocation_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransfer` ADD CONSTRAINT `StockTransfer_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransfer` ADD CONSTRAINT `StockTransfer_fromLocationId_fkey` FOREIGN KEY (`fromLocationId`) REFERENCES `StockLocation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransfer` ADD CONSTRAINT `StockTransfer_toLocationId_fkey` FOREIGN KEY (`toLocationId`) REFERENCES `StockLocation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransferItem` ADD CONSTRAINT `StockTransferItem_transferId_fkey` FOREIGN KEY (`transferId`) REFERENCES `StockTransfer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransferItem` ADD CONSTRAINT `StockTransferItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `InventoryItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransferItem` ADD CONSTRAINT `StockTransferItem_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `StockBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransferItem` ADD CONSTRAINT `StockTransferItem_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReturn` ADD CONSTRAINT `StockReturn_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReturn` ADD CONSTRAINT `StockReturn_fromLocationId_fkey` FOREIGN KEY (`fromLocationId`) REFERENCES `StockLocation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReturn` ADD CONSTRAINT `StockReturn_toLocationId_fkey` FOREIGN KEY (`toLocationId`) REFERENCES `StockLocation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReturn` ADD CONSTRAINT `StockReturn_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `InventoryItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockReturn` ADD CONSTRAINT `StockReturn_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `StockBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabTest` ADD CONSTRAINT `LabTest_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabTest` ADD CONSTRAINT `LabTest_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabPanel` ADD CONSTRAINT `LabPanel_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabPanel` ADD CONSTRAINT `LabPanel_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabPanelItem` ADD CONSTRAINT `LabPanelItem_panelId_fkey` FOREIGN KEY (`panelId`) REFERENCES `LabPanel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabPanelItem` ADD CONSTRAINT `LabPanelItem_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `LabTest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabOrder` ADD CONSTRAINT `LabOrder_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabOrder` ADD CONSTRAINT `LabOrder_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabOrder` ADD CONSTRAINT `LabOrder_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabOrder` ADD CONSTRAINT `LabOrder_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabOrder` ADD CONSTRAINT `LabOrder_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabOrderItem` ADD CONSTRAINT `LabOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `LabOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabOrderItem` ADD CONSTRAINT `LabOrderItem_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `LabTest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabOrderItem` ADD CONSTRAINT `LabOrderItem_panelId_fkey` FOREIGN KEY (`panelId`) REFERENCES `LabPanel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabSample` ADD CONSTRAINT `LabSample_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `LabOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabSample` ADD CONSTRAINT `LabSample_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabReport` ADD CONSTRAINT `LabReport_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `LabOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabReport` ADD CONSTRAINT `LabReport_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDAdmission` ADD CONSTRAINT `IPDAdmission_allocationId_fkey` FOREIGN KEY (`allocationId`) REFERENCES `BedAllocation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDAdmission` ADD CONSTRAINT `IPDAdmission_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDAdmission` ADD CONSTRAINT `IPDAdmission_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDVitals` ADD CONSTRAINT `IPDVitals_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `IPDAdmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDVitals` ADD CONSTRAINT `IPDVitals_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDClinicalNote` ADD CONSTRAINT `IPDClinicalNote_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `IPDAdmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDClinicalNote` ADD CONSTRAINT `IPDClinicalNote_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDMedicationOrder` ADD CONSTRAINT `IPDMedicationOrder_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `IPDAdmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDMedicationOrder` ADD CONSTRAINT `IPDMedicationOrder_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDMedicationAdministration` ADD CONSTRAINT `IPDMedicationAdministration_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `IPDMedicationOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDMedicationAdministration` ADD CONSTRAINT `IPDMedicationAdministration_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDBedTransfer` ADD CONSTRAINT `IPDBedTransfer_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `IPDAdmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDBedTransfer` ADD CONSTRAINT `IPDBedTransfer_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDDischargeSummary` ADD CONSTRAINT `IPDDischargeSummary_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `IPDAdmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IPDDischargeSummary` ADD CONSTRAINT `IPDDischargeSummary_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
