-- AlterTable
ALTER TABLE `DoctorAvailability` ADD COLUMN `breaks` TEXT NULL,
    ADD COLUMN `bufferTime` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `generatedSlots` TEXT NULL,
    ADD COLUMN `maxPatientsPerSlot` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `DoctorScheduleTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `scheduleData` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DoctorScheduleTemplate_hospitalId_idx`(`hospitalId`),
    INDEX `DoctorScheduleTemplate_doctorId_idx`(`doctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DoctorScheduleTemplate` ADD CONSTRAINT `DoctorScheduleTemplate_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
