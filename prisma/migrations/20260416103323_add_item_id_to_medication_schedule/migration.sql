-- AlterTable
ALTER TABLE `MedicationSchedule` ADD COLUMN `itemId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `MedicationSchedule_itemId_idx` ON `MedicationSchedule`(`itemId`);

-- AddForeignKey
ALTER TABLE `MedicationSchedule` ADD CONSTRAINT `MedicationSchedule_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `InventoryItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
