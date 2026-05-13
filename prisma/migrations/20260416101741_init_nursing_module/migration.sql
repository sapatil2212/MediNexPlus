/*
  Warnings:

  - You are about to drop the `BedAllocation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[loginEmail]` on the table `Department` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `BedAllocation` DROP FOREIGN KEY `BedAllocation_bedId_fkey`;

-- DropForeignKey
ALTER TABLE `BedAllocation` DROP FOREIGN KEY `BedAllocation_hospitalId_fkey`;

-- DropForeignKey
ALTER TABLE `TreatmentPlan` DROP FOREIGN KEY `TreatmentPlan_patientId_fkey`;

-- AlterTable
ALTER TABLE `Department` ADD COLUMN `credentialsSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `loginEmail` VARCHAR(191) NULL,
    MODIFY `type` ENUM('OPD', 'IPD', 'CLINICAL', 'DIAGNOSTIC', 'PROCEDURE', 'SUPPORT', 'ADMINISTRATIVE', 'CUSTOM', 'NURSING') NOT NULL DEFAULT 'OPD';

-- AlterTable
ALTER TABLE `Patient` ADD COLUMN `allergies` TEXT NULL,
    ADD COLUMN `documents` TEXT NULL,
    ADD COLUMN `emergencyName` VARCHAR(191) NULL,
    ADD COLUMN `emergencyPhone` VARCHAR(191) NULL,
    ADD COLUMN `emergencyRelation` VARCHAR(191) NULL,
    ADD COLUMN `patientType` VARCHAR(191) NULL DEFAULT 'NEW',
    ADD COLUMN `profilePhoto` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `RolePermission` MODIFY `role` ENUM('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'DEPT_HEAD', 'SUB_DEPT_HEAD', 'FINANCE_HEAD', 'NURSING_ADMIN', 'STAFF_NURSE', 'DUTY_NURSE') NOT NULL;

-- AlterTable
ALTER TABLE `SubDepartment` MODIFY `type` ENUM('PHARMACY', 'PATHOLOGY', 'RADIOLOGY', 'PROCEDURE', 'LABORATORY', 'DENTAL', 'DERMATOLOGY', 'HAIR', 'ONCOLOGY', 'CARDIOLOGY', 'BILLING', 'RECEPTION', 'OTHER', 'HR', 'ACCOUNTS', 'NURSING', 'HOUSEKEEPING', 'AMBULANCE', 'BIOMEDICAL', 'OT', 'DIALYSIS', 'PHYSIOTHERAPY', 'COSMETIC', 'ENDOSCOPY', 'BLOOD_BANK', 'ECG', 'OPD', 'IPD', 'EMERGENCY', 'ICU', 'GENERAL_MEDICINE', 'SURGERY', 'GYNECOLOGY', 'PEDIATRICS', 'CLINICAL_PROCEDURE', 'CUSTOM') NOT NULL;

-- AlterTable
ALTER TABLE `TreatmentPlan` MODIFY `patientId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'DEPT_HEAD', 'SUB_DEPT_HEAD', 'FINANCE_HEAD', 'NURSING_ADMIN', 'STAFF_NURSE', 'DUTY_NURSE') NOT NULL;

-- DropTable
DROP TABLE `BedAllocation`;

-- CreateTable
CREATE TABLE `DoctorDateOverride` (
    `id` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `isOff` BOOLEAN NOT NULL DEFAULT false,
    `startTime` VARCHAR(191) NULL,
    `endTime` VARCHAR(191) NULL,
    `slotDuration` INTEGER NULL,
    `bufferTime` INTEGER NULL,
    `maxPatientsPerSlot` INTEGER NULL,
    `breaks` TEXT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DoctorDateOverride_hospitalId_idx`(`hospitalId`),
    INDEX `DoctorDateOverride_doctorId_date_idx`(`doctorId`, `date`),
    UNIQUE INDEX `DoctorDateOverride_doctorId_date_key`(`doctorId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admission` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `wardId` VARCHAR(191) NOT NULL,
    `bedId` VARCHAR(191) NOT NULL,
    `admittingDoctorId` VARCHAR(191) NOT NULL,
    `admissionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dischargeDate` DATETIME(3) NULL,
    `diagnosis` TEXT NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'DISCHARGED', 'TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
    `admissionType` ENUM('IPD', 'EMERGENCY') NOT NULL DEFAULT 'IPD',
    `criticalStatus` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Admission_hospitalId_idx`(`hospitalId`),
    INDEX `Admission_patientId_idx`(`patientId`),
    INDEX `Admission_wardId_idx`(`wardId`),
    INDEX `Admission_bedId_idx`(`bedId`),
    INDEX `Admission_admittingDoctorId_idx`(`admittingDoctorId`),
    INDEX `Admission_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VitalsLog` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `nurseId` VARCHAR(191) NOT NULL,
    `logTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bloodPressure` VARCHAR(191) NULL,
    `pulse` INTEGER NULL,
    `temperature` DOUBLE NULL,
    `spo2` INTEGER NULL,
    `respiratoryRate` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VitalsLog_hospitalId_idx`(`hospitalId`),
    INDEX `VitalsLog_admissionId_idx`(`admissionId`),
    INDEX `VitalsLog_nurseId_idx`(`nurseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicationSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `prescribingDoctorId` VARCHAR(191) NOT NULL,
    `medicationName` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NOT NULL,
    `route` ENUM('IV', 'ORAL', 'INJECTION', 'TOPICAL', 'OTHER') NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MedicationSchedule_hospitalId_idx`(`hospitalId`),
    INDEX `MedicationSchedule_admissionId_idx`(`admissionId`),
    INDEX `MedicationSchedule_prescribingDoctorId_idx`(`prescribingDoctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicationLog` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `medicationScheduleId` VARCHAR(191) NOT NULL,
    `administeringNurseId` VARCHAR(191) NOT NULL,
    `logTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('GIVEN', 'MISSED', 'DELAYED') NOT NULL,
    `reason` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MedicationLog_hospitalId_idx`(`hospitalId`),
    INDEX `MedicationLog_admissionId_idx`(`admissionId`),
    INDEX `MedicationLog_medicationScheduleId_idx`(`medicationScheduleId`),
    INDEX `MedicationLog_administeringNurseId_idx`(`administeringNurseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DoctorOrder` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `orderingDoctorId` VARCHAR(191) NOT NULL,
    `orderType` ENUM('MEDICATION', 'PROCEDURE', 'TEST', 'OTHER') NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `executionNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DoctorOrder_hospitalId_idx`(`hospitalId`),
    INDEX `DoctorOrder_admissionId_idx`(`admissionId`),
    INDEX `DoctorOrder_orderingDoctorId_idx`(`orderingDoctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NursingNote` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `nurseId` VARCHAR(191) NOT NULL,
    `noteTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `patientCondition` VARCHAR(191) NULL,
    `symptoms` TEXT NULL,
    `painScale` INTEGER NULL,
    `specialNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NursingNote_hospitalId_idx`(`hospitalId`),
    INDEX `NursingNote_admissionId_idx`(`admissionId`),
    INDEX `NursingNote_nurseId_idx`(`nurseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alert` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `alertType` ENUM('CRITICAL_VITALS', 'MISSED_MEDICATION', 'EMERGENCY_FLAG', 'OTHER') NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `message` TEXT NOT NULL,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Alert_hospitalId_idx`(`hospitalId`),
    INDEX `Alert_admissionId_idx`(`admissionId`),
    INDEX `Alert_isResolved_idx`(`isResolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DepartmentTransfer` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `admissionId` VARCHAR(191) NOT NULL,
    `fromDepartmentId` VARCHAR(191) NOT NULL,
    `toDepartmentId` VARCHAR(191) NOT NULL,
    `transferDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` TEXT NULL,
    `notes` TEXT NULL,
    `initiatedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DepartmentTransfer_hospitalId_idx`(`hospitalId`),
    INDEX `DepartmentTransfer_admissionId_idx`(`admissionId`),
    INDEX `DepartmentTransfer_fromDepartmentId_idx`(`fromDepartmentId`),
    INDEX `DepartmentTransfer_toDepartmentId_idx`(`toDepartmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enquiry` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NOT NULL,
    `altContact` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `enquiryType` VARCHAR(191) NULL,
    `details` TEXT NULL,
    `status` ENUM('NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `notes` TEXT NULL,
    `assignedTo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Enquiry_hospitalId_idx`(`hospitalId`),
    INDEX `Enquiry_hospitalId_status_idx`(`hospitalId`, `status`),
    INDEX `Enquiry_hospitalId_createdAt_idx`(`hospitalId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blog` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NULL,
    `coverImage` TEXT NULL,
    `category` VARCHAR(191) NULL,
    `tags` TEXT NULL,
    `author` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `metaTitle` VARCHAR(191) NULL,
    `metaDesc` TEXT NULL,
    `readTime` INTEGER NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Blog_hospitalId_idx`(`hospitalId`),
    INDEX `Blog_hospitalId_status_idx`(`hospitalId`, `status`),
    INDEX `Blog_hospitalId_category_idx`(`hospitalId`, `category`),
    INDEX `Blog_hospitalId_publishedAt_idx`(`hospitalId`, `publishedAt`),
    UNIQUE INDEX `Blog_hospitalId_slug_key`(`hospitalId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Department_loginEmail_key` ON `Department`(`loginEmail`);

-- AddForeignKey
ALTER TABLE `DoctorDateOverride` ADD CONSTRAINT `DoctorDateOverride_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admission` ADD CONSTRAINT `Admission_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admission` ADD CONSTRAINT `Admission_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admission` ADD CONSTRAINT `Admission_wardId_fkey` FOREIGN KEY (`wardId`) REFERENCES `Ward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admission` ADD CONSTRAINT `Admission_bedId_fkey` FOREIGN KEY (`bedId`) REFERENCES `Bed`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admission` ADD CONSTRAINT `Admission_admittingDoctorId_fkey` FOREIGN KEY (`admittingDoctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VitalsLog` ADD CONSTRAINT `VitalsLog_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VitalsLog` ADD CONSTRAINT `VitalsLog_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `Admission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VitalsLog` ADD CONSTRAINT `VitalsLog_nurseId_fkey` FOREIGN KEY (`nurseId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationSchedule` ADD CONSTRAINT `MedicationSchedule_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationSchedule` ADD CONSTRAINT `MedicationSchedule_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `Admission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationSchedule` ADD CONSTRAINT `MedicationSchedule_prescribingDoctorId_fkey` FOREIGN KEY (`prescribingDoctorId`) REFERENCES `Doctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationLog` ADD CONSTRAINT `MedicationLog_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationLog` ADD CONSTRAINT `MedicationLog_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `Admission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationLog` ADD CONSTRAINT `MedicationLog_medicationScheduleId_fkey` FOREIGN KEY (`medicationScheduleId`) REFERENCES `MedicationSchedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationLog` ADD CONSTRAINT `MedicationLog_administeringNurseId_fkey` FOREIGN KEY (`administeringNurseId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DoctorOrder` ADD CONSTRAINT `DoctorOrder_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DoctorOrder` ADD CONSTRAINT `DoctorOrder_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `Admission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DoctorOrder` ADD CONSTRAINT `DoctorOrder_orderingDoctorId_fkey` FOREIGN KEY (`orderingDoctorId`) REFERENCES `Doctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NursingNote` ADD CONSTRAINT `NursingNote_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NursingNote` ADD CONSTRAINT `NursingNote_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `Admission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NursingNote` ADD CONSTRAINT `NursingNote_nurseId_fkey` FOREIGN KEY (`nurseId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `Admission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_resolvedBy_fkey` FOREIGN KEY (`resolvedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DepartmentTransfer` ADD CONSTRAINT `DepartmentTransfer_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DepartmentTransfer` ADD CONSTRAINT `DepartmentTransfer_admissionId_fkey` FOREIGN KEY (`admissionId`) REFERENCES `Admission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DepartmentTransfer` ADD CONSTRAINT `DepartmentTransfer_fromDepartmentId_fkey` FOREIGN KEY (`fromDepartmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DepartmentTransfer` ADD CONSTRAINT `DepartmentTransfer_toDepartmentId_fkey` FOREIGN KEY (`toDepartmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DepartmentTransfer` ADD CONSTRAINT `DepartmentTransfer_initiatedBy_fkey` FOREIGN KEY (`initiatedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreatmentPlan` ADD CONSTRAINT `TreatmentPlan_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enquiry` ADD CONSTRAINT `Enquiry_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blog` ADD CONSTRAINT `Blog_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
