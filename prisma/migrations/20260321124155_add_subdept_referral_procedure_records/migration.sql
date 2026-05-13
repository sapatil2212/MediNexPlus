-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `subDepartmentId` VARCHAR(191) NULL,
    ADD COLUMN `subDeptNote` TEXT NULL;

-- CreateTable
CREATE TABLE `ProcedureRecord` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `subDepartmentId` VARCHAR(191) NOT NULL,
    `procedureId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DOUBLE NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
    `performedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcedureRecord_hospitalId_idx`(`hospitalId`),
    INDEX `ProcedureRecord_subDepartmentId_idx`(`subDepartmentId`),
    INDEX `ProcedureRecord_patientId_idx`(`patientId`),
    INDEX `ProcedureRecord_appointmentId_idx`(`appointmentId`),
    INDEX `ProcedureRecord_procedureId_idx`(`procedureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Appointment_subDepartmentId_idx` ON `Appointment`(`subDepartmentId`);

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcedureRecord` ADD CONSTRAINT `ProcedureRecord_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcedureRecord` ADD CONSTRAINT `ProcedureRecord_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcedureRecord` ADD CONSTRAINT `ProcedureRecord_procedureId_fkey` FOREIGN KEY (`procedureId`) REFERENCES `Procedure`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcedureRecord` ADD CONSTRAINT `ProcedureRecord_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcedureRecord` ADD CONSTRAINT `ProcedureRecord_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
