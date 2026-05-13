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
CREATE TABLE `Bill` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `visitId` VARCHAR(191) NOT NULL,
    `billNumber` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PENDING', 'PARTIAL', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `paymentMethod` ENUM('CASH', 'CARD', 'UPI', 'INSURANCE', 'OTHER') NULL,
    `paymentRef` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Bill_hospitalId_idx`(`hospitalId`),
    INDEX `Bill_visitId_idx`(`visitId`),
    INDEX `Bill_patientId_idx`(`patientId`),
    INDEX `Bill_hospitalId_status_idx`(`hospitalId`, `status`),
    UNIQUE INDEX `Bill_hospitalId_billNumber_key`(`hospitalId`, `billNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillItem` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NOT NULL,
    `visitId` VARCHAR(191) NOT NULL,
    `workflowTaskId` VARCHAR(191) NULL,
    `serviceItemId` VARCHAR(191) NULL,
    `type` ENUM('CONSULTATION', 'TEST', 'PROCEDURE', 'PHARMACY', 'ADMISSION', 'ROOM_CHARGE', 'OTHER') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DOUBLE NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BillItem_workflowTaskId_key`(`workflowTaskId`),
    INDEX `BillItem_hospitalId_idx`(`hospitalId`),
    INDEX `BillItem_billId_idx`(`billId`),
    INDEX `BillItem_visitId_idx`(`visitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_visitId_fkey` FOREIGN KEY (`visitId`) REFERENCES `Visit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillItem` ADD CONSTRAINT `BillItem_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillItem` ADD CONSTRAINT `BillItem_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `Bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillItem` ADD CONSTRAINT `BillItem_workflowTaskId_fkey` FOREIGN KEY (`workflowTaskId`) REFERENCES `WorkflowTask`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillItem` ADD CONSTRAINT `BillItem_serviceItemId_fkey` FOREIGN KEY (`serviceItemId`) REFERENCES `ServiceItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
