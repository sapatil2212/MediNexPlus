/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hospitalId,email]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `Staff` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Staff` ADD COLUMN `credentialsSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `password` VARCHAR(191) NULL,
    ADD COLUMN `permissions` TEXT NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Staff_userId_key` ON `Staff`(`userId`);

-- CreateIndex
CREATE INDEX `Staff_email_idx` ON `Staff`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `Staff_hospitalId_email_key` ON `Staff`(`hospitalId`, `email`);

-- AddForeignKey
ALTER TABLE `Staff` ADD CONSTRAINT `Staff_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
