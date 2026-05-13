-- CreateTable
CREATE TABLE `Prescription` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `prescriptionNo` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `vitals` TEXT NULL,
    `chiefComplaint` TEXT NULL,
    `diagnosis` TEXT NULL,
    `icdCodes` TEXT NULL,
    `medications` TEXT NULL,
    `labTests` TEXT NULL,
    `referrals` TEXT NULL,
    `advice` TEXT NULL,
    `followUpDate` DATETIME(3) NULL,
    `followUpNotes` TEXT NULL,
    `consultationFee` DOUBLE NULL,
    `aiSuggestions` TEXT NULL,
    `status` ENUM('DRAFT', 'COMPLETED', 'IN_WORKFLOW', 'BILLING_PENDING', 'BILLED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `currentDeptId` VARCHAR(191) NULL,
    `doctorNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Prescription_appointmentId_key`(`appointmentId`),
    INDEX `Prescription_hospitalId_idx`(`hospitalId`),
    INDEX `Prescription_patientId_idx`(`patientId`),
    INDEX `Prescription_doctorId_idx`(`doctorId`),
    INDEX `Prescription_appointmentId_idx`(`appointmentId`),
    INDEX `Prescription_hospitalId_status_idx`(`hospitalId`, `status`),
    UNIQUE INDEX `Prescription_hospitalId_prescriptionNo_key`(`hospitalId`, `prescriptionNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrescriptionWorkflow` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `prescriptionId` VARCHAR(191) NOT NULL,
    `subDepartmentId` VARCHAR(191) NOT NULL,
    `sequence` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `completedAt` DATETIME(3) NULL,
    `completedBy` VARCHAR(191) NULL,
    `charges` TEXT NULL,
    `totalCharge` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PrescriptionWorkflow_prescriptionId_idx`(`prescriptionId`),
    INDEX `PrescriptionWorkflow_subDepartmentId_idx`(`subDepartmentId`),
    INDEX `PrescriptionWorkflow_hospitalId_idx`(`hospitalId`),
    INDEX `PrescriptionWorkflow_hospitalId_status_idx`(`hospitalId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bill` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `billNo` VARCHAR(191) NOT NULL,
    `prescriptionId` VARCHAR(191) NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `items` TEXT NOT NULL,
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `tax` DOUBLE NOT NULL DEFAULT 0,
    `total` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATETIME(3) NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Bill_prescriptionId_key`(`prescriptionId`),
    INDEX `Bill_hospitalId_idx`(`hospitalId`),
    INDEX `Bill_patientId_idx`(`patientId`),
    INDEX `Bill_hospitalId_status_idx`(`hospitalId`, `status`),
    UNIQUE INDEX `Bill_hospitalId_billNo_key`(`hospitalId`, `billNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrescriptionWorkflow` ADD CONSTRAINT `PrescriptionWorkflow_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrescriptionWorkflow` ADD CONSTRAINT `PrescriptionWorkflow_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrescriptionWorkflow` ADD CONSTRAINT `PrescriptionWorkflow_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_prescriptionId_fkey` FOREIGN KEY (`prescriptionId`) REFERENCES `Prescription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
