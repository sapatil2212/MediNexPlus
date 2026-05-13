-- CreateTable
CREATE TABLE `DoctorAttendance` (
    `id` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE') NOT NULL DEFAULT 'ABSENT',
    `loginTime` DATETIME(3) NULL,
    `logoutTime` DATETIME(3) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DoctorAttendance_doctorId_idx`(`doctorId`),
    INDEX `DoctorAttendance_hospitalId_idx`(`hospitalId`),
    INDEX `DoctorAttendance_date_idx`(`date`),
    UNIQUE INDEX `DoctorAttendance_doctorId_date_key`(`doctorId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DoctorAttendance` ADD CONSTRAINT `DoctorAttendance_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
