/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Doctor` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `agreementDoc` VARCHAR(191) NULL,
    ADD COLUMN `bloodGroup` VARCHAR(191) NULL,
    ADD COLUMN `credentialsSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `govtIdCard` VARCHAR(191) NULL,
    ADD COLUMN `hospitalStamp` VARCHAR(191) NULL,
    ADD COLUMN `licenseNo` VARCHAR(191) NULL,
    ADD COLUMN `registrationNo` VARCHAR(191) NULL,
    ADD COLUMN `signature` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Doctor_userId_key` ON `Doctor`(`userId`);

-- AddForeignKey
ALTER TABLE `Doctor` ADD CONSTRAINT `Doctor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
