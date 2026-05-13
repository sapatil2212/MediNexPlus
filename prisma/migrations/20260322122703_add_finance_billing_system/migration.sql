/*
  Warnings:

  - You are about to drop the column `pricePerUnit` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `supplier` on the `InventoryItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bill` ADD COLUMN `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `visitId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Doctor` ADD COLUMN `prescriptionSettings` TEXT NULL;

-- AlterTable
ALTER TABLE `InventoryItem` DROP COLUMN `pricePerUnit`,
    DROP COLUMN `stock`,
    DROP COLUMN `supplier`,
    ADD COLUMN `maxStock` INTEGER NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `subCategory` VARCHAR(191) NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'SUB_DEPT_HEAD', 'FINANCE_HEAD') NOT NULL;

-- CreateTable
CREATE TABLE `StockBatch` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `batchNumber` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `remainingQty` INTEGER NOT NULL,
    `purchasePrice` DOUBLE NOT NULL,
    `sellingPrice` DOUBLE NULL,
    `expiryDate` DATETIME(3) NULL,
    `supplierId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StockBatch_hospitalId_idx`(`hospitalId`),
    INDEX `StockBatch_itemId_idx`(`itemId`),
    INDEX `StockBatch_expiryDate_idx`(`expiryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockMovement` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `performedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockMovement_hospitalId_idx`(`hospitalId`),
    INDEX `StockMovement_itemId_idx`(`itemId`),
    INDEX `StockMovement_batchId_idx`(`batchId`),
    INDEX `StockMovement_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Supplier` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `gstNumber` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Supplier_hospitalId_idx`(`hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Purchase` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NOT NULL,
    `purchaseNo` VARCHAR(191) NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Purchase_hospitalId_idx`(`hospitalId`),
    INDEX `Purchase_supplierId_idx`(`supplierId`),
    UNIQUE INDEX `Purchase_hospitalId_purchaseNo_key`(`hospitalId`, `purchaseNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseItem` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `purchaseId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `batchNumber` VARCHAR(191) NULL,
    `expiryDate` DATETIME(3) NULL,

    INDEX `PurchaseItem_hospitalId_idx`(`hospitalId`),
    INDEX `PurchaseItem_purchaseId_idx`(`purchaseId`),
    INDEX `PurchaseItem_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceDepartment` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Finance Department',
    `hodName` VARCHAR(191) NULL,
    `hodEmail` VARCHAR(191) NULL,
    `hodPhone` VARCHAR(191) NULL,
    `loginEmail` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `credentialsSent` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FinanceDepartment_hospitalId_key`(`hospitalId`),
    UNIQUE INDEX `FinanceDepartment_loginEmail_key`(`loginEmail`),
    UNIQUE INDEX `FinanceDepartment_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillItem` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NOT NULL,
    `type` ENUM('CONSULTATION', 'PROCEDURE', 'LAB_TEST', 'BED_CHARGE', 'PHARMACY', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `referenceId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BillItem_billId_idx`(`billId`),
    INDEX `BillItem_hospitalId_idx`(`hospitalId`),
    INDEX `BillItem_hospitalId_type_idx`(`hospitalId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `method` ENUM('CASH', 'UPI', 'CARD', 'INSURANCE', 'CHEQUE', 'ONLINE') NOT NULL DEFAULT 'CASH',
    `transactionId` VARCHAR(191) NULL,
    `status` ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'SUCCESS',
    `notes` TEXT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Payment_billId_idx`(`billId`),
    INDEX `Payment_hospitalId_idx`(`hospitalId`),
    INDEX `Payment_hospitalId_paidAt_idx`(`hospitalId`, `paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` ENUM('SALARY', 'EQUIPMENT', 'MAINTENANCE', 'UTILITY', 'MEDICINE', 'HOUSEKEEPING', 'MARKETING', 'INSURANCE_EXPENSE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `amount` DOUBLE NOT NULL,
    `date` DATE NOT NULL,
    `description` TEXT NULL,
    `receipt` VARCHAR(191) NULL,
    `addedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Expense_hospitalId_idx`(`hospitalId`),
    INDEX `Expense_hospitalId_date_idx`(`hospitalId`, `date`),
    INDEX `Expense_hospitalId_category_idx`(`hospitalId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Revenue` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `sourceType` ENUM('CONSULTATION', 'PROCEDURE', 'BED_CHARGE', 'PHARMACY', 'LAB_TEST', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `referenceId` VARCHAR(191) NULL,
    `referenceType` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Revenue_hospitalId_idx`(`hospitalId`),
    INDEX `Revenue_hospitalId_sourceType_idx`(`hospitalId`, `sourceType`),
    INDEX `Revenue_hospitalId_createdAt_idx`(`hospitalId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Bill_hospitalId_createdAt_idx` ON `Bill`(`hospitalId`, `createdAt`);

-- AddForeignKey
ALTER TABLE `StockBatch` ADD CONSTRAINT `StockBatch_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `InventoryItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockBatch` ADD CONSTRAINT `StockBatch_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `InventoryItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `StockBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `Purchase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `InventoryItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceDepartment` ADD CONSTRAINT `FinanceDepartment_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceDepartment` ADD CONSTRAINT `FinanceDepartment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillItem` ADD CONSTRAINT `BillItem_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillItem` ADD CONSTRAINT `BillItem_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `Bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `Bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Revenue` ADD CONSTRAINT `Revenue_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
