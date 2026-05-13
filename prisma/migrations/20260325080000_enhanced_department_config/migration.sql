-- Enhanced Department Configuration System
-- Adds: Service Packages, Permissions, Treatment Plans, Department Metadata

-- ============================================================================
-- 1. SERVICE PACKAGES (Multi-session treatments like PRP, Laser courses)
-- ============================================================================
CREATE TABLE `Service` (
  `id` VARCHAR(191) NOT NULL,
  `hospitalId` VARCHAR(191) NOT NULL,
  `departmentId` VARCHAR(191) NULL,
  `subDepartmentId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `category` VARCHAR(191) NOT NULL DEFAULT 'PACKAGE',
  `sessionCount` INT NOT NULL DEFAULT 1,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `pricePerSession` DOUBLE NOT NULL DEFAULT 0,
  `duration` INT NULL COMMENT 'Duration in minutes per session',
  `validityDays` INT NULL COMMENT 'Package validity in days',
  `requiresPharmacy` BOOLEAN NOT NULL DEFAULT false,
  `requiresLab` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `metadata` TEXT NULL COMMENT 'JSON: {prerequisites, contraindications, aftercare}',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  INDEX `Service_hospitalId_idx` (`hospitalId`),
  INDEX `Service_departmentId_idx` (`departmentId`),
  INDEX `Service_subDepartmentId_idx` (`subDepartmentId`),
  INDEX `Service_hospitalId_category_idx` (`hospitalId`, `category`),
  UNIQUE INDEX `Service_hospitalId_code_key` (`hospitalId`, `code`),
  
  CONSTRAINT `Service_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Service_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Service_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. PATIENT TREATMENT PLANS (Track multi-session treatments)
-- ============================================================================
CREATE TABLE `TreatmentPlan` (
  `id` VARCHAR(191) NOT NULL,
  `hospitalId` VARCHAR(191) NOT NULL,
  `patientId` VARCHAR(191) NOT NULL,
  `serviceId` VARCHAR(191) NULL,
  `procedureId` VARCHAR(191) NULL,
  `departmentId` VARCHAR(191) NULL,
  `subDepartmentId` VARCHAR(191) NULL,
  `doctorId` VARCHAR(191) NULL,
  `planName` VARCHAR(191) NOT NULL,
  `totalSessions` INT NOT NULL DEFAULT 1,
  `completedSessions` INT NOT NULL DEFAULT 0,
  `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD') NOT NULL DEFAULT 'ACTIVE',
  `startDate` DATETIME(3) NULL,
  `endDate` DATETIME(3) NULL,
  `totalCost` DOUBLE NOT NULL DEFAULT 0,
  `paidAmount` DOUBLE NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `billingStatus` ENUM('PENDING', 'PARTIAL', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  INDEX `TreatmentPlan_hospitalId_idx` (`hospitalId`),
  INDEX `TreatmentPlan_patientId_idx` (`patientId`),
  INDEX `TreatmentPlan_serviceId_idx` (`serviceId`),
  INDEX `TreatmentPlan_departmentId_idx` (`departmentId`),
  INDEX `TreatmentPlan_subDepartmentId_idx` (`subDepartmentId`),
  INDEX `TreatmentPlan_doctorId_idx` (`doctorId`),
  INDEX `TreatmentPlan_hospitalId_status_idx` (`hospitalId`, `status`),
  
  CONSTRAINT `TreatmentPlan_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TreatmentPlan_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TreatmentPlan_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `TreatmentPlan_procedureId_fkey` FOREIGN KEY (`procedureId`) REFERENCES `Procedure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `TreatmentPlan_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `TreatmentPlan_subDepartmentId_fkey` FOREIGN KEY (`subDepartmentId`) REFERENCES `SubDepartment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `TreatmentPlan_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. TREATMENT SESSIONS (Individual session records)
-- ============================================================================
CREATE TABLE `TreatmentSession` (
  `id` VARCHAR(191) NOT NULL,
  `hospitalId` VARCHAR(191) NOT NULL,
  `treatmentPlanId` VARCHAR(191) NOT NULL,
  `sessionNumber` INT NOT NULL,
  `appointmentId` VARCHAR(191) NULL,
  `scheduledDate` DATETIME(3) NULL,
  `completedDate` DATETIME(3) NULL,
  `status` ENUM('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED', 'RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
  `performedBy` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `beforePhotos` TEXT NULL COMMENT 'JSON array of photo URLs',
  `afterPhotos` TEXT NULL COMMENT 'JSON array of photo URLs',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  INDEX `TreatmentSession_hospitalId_idx` (`hospitalId`),
  INDEX `TreatmentSession_treatmentPlanId_idx` (`treatmentPlanId`),
  INDEX `TreatmentSession_appointmentId_idx` (`appointmentId`),
  INDEX `TreatmentSession_hospitalId_status_idx` (`hospitalId`, `status`),
  UNIQUE INDEX `TreatmentSession_treatmentPlanId_sessionNumber_key` (`treatmentPlanId`, `sessionNumber`),
  
  CONSTRAINT `TreatmentSession_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TreatmentSession_treatmentPlanId_fkey` FOREIGN KEY (`treatmentPlanId`) REFERENCES `TreatmentPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TreatmentSession_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. PERMISSIONS (Granular RBAC)
-- ============================================================================
CREATE TABLE `Permission` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `module` VARCHAR(191) NOT NULL COMMENT 'e.g., DEPARTMENT, PATIENT, BILLING',
  `action` VARCHAR(191) NOT NULL COMMENT 'e.g., CREATE, READ, UPDATE, DELETE',
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Permission_code_key` (`code`),
  INDEX `Permission_module_idx` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. ROLE PERMISSIONS (Many-to-Many)
-- ============================================================================
CREATE TABLE `RolePermission` (
  `id` VARCHAR(191) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF', 'SUB_DEPT_HEAD', 'FINANCE_HEAD') NOT NULL,
  `permissionId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `RolePermission_role_idx` (`role`),
  INDEX `RolePermission_permissionId_idx` (`permissionId`),
  UNIQUE INDEX `RolePermission_role_permissionId_key` (`role`, `permissionId`),
  
  CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. USER CUSTOM PERMISSIONS (Override role permissions)
-- ============================================================================
CREATE TABLE `UserPermission` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `permissionId` VARCHAR(191) NOT NULL,
  `granted` BOOLEAN NOT NULL DEFAULT true COMMENT 'true=grant, false=revoke',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `UserPermission_userId_idx` (`userId`),
  INDEX `UserPermission_permissionId_idx` (`permissionId`),
  UNIQUE INDEX `UserPermission_userId_permissionId_key` (`userId`, `permissionId`),
  
  CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserPermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. DEPARTMENT METADATA (Enhanced department configuration)
-- ============================================================================
ALTER TABLE `Department` 
  ADD COLUMN `color` VARCHAR(191) NULL DEFAULT '#3b82f6',
  ADD COLUMN `icon` VARCHAR(191) NULL,
  ADD COLUMN `displayOrder` INT NOT NULL DEFAULT 0,
  ADD COLUMN `requiresAppointment` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `autoAssignToken` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `maxPatientsPerDay` INT NULL,
  ADD COLUMN `workingHours` TEXT NULL COMMENT 'JSON: {days, startTime, endTime}',
  ADD COLUMN `metadata` TEXT NULL COMMENT 'JSON: custom fields per department type';

CREATE INDEX `Department_hospitalId_displayOrder_idx` ON `Department`(`hospitalId`, `displayOrder`);

-- ============================================================================
-- 8. SUBDEPARTMENT ENHANCEMENTS
-- ============================================================================
ALTER TABLE `SubDepartment`
  ADD COLUMN `requiresPharmacy` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `requiresLab` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `displayOrder` INT NOT NULL DEFAULT 0,
  ADD COLUMN `icon` VARCHAR(191) NULL,
  ADD COLUMN `workflowSteps` TEXT NULL COMMENT 'JSON: array of workflow steps';

CREATE INDEX `SubDepartment_hospitalId_displayOrder_idx` ON `SubDepartment`(`hospitalId`, `displayOrder`);

-- ============================================================================
-- 9. PROCEDURE ENHANCEMENTS
-- ============================================================================
ALTER TABLE `Procedure`
  ADD COLUMN `requiresPharmacy` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `requiresLab` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `requiresConsent` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `consentFormUrl` VARCHAR(191) NULL,
  ADD COLUMN `estimatedDuration` INT NULL COMMENT 'Duration in minutes',
  ADD COLUMN `preparationInstructions` TEXT NULL,
  ADD COLUMN `aftercareInstructions` TEXT NULL,
  ADD COLUMN `contraindications` TEXT NULL,
  ADD COLUMN `displayOrder` INT NOT NULL DEFAULT 0;

CREATE INDEX `Procedure_hospitalId_subDepartmentId_displayOrder_idx` ON `Procedure`(`hospitalId`, `subDepartmentId`, `displayOrder`);

-- ============================================================================
-- 10. SEED DEFAULT PERMISSIONS
-- ============================================================================
INSERT INTO `Permission` (`id`, `name`, `code`, `module`, `action`, `description`) VALUES
-- Department Management
(UUID(), 'View Departments', 'DEPT_VIEW', 'DEPARTMENT', 'READ', 'View department list and details'),
(UUID(), 'Create Department', 'DEPT_CREATE', 'DEPARTMENT', 'CREATE', 'Create new departments'),
(UUID(), 'Edit Department', 'DEPT_UPDATE', 'DEPARTMENT', 'UPDATE', 'Edit department configuration'),
(UUID(), 'Delete Department', 'DEPT_DELETE', 'DEPARTMENT', 'DELETE', 'Delete departments'),
(UUID(), 'Manage Sub-Departments', 'SUBDEPT_MANAGE', 'DEPARTMENT', 'MANAGE', 'Full sub-department management'),
(UUID(), 'Manage Procedures', 'PROCEDURE_MANAGE', 'DEPARTMENT', 'MANAGE', 'Manage procedures and services'),

-- Patient Management
(UUID(), 'View Patients', 'PATIENT_VIEW', 'PATIENT', 'READ', 'View patient records'),
(UUID(), 'Create Patient', 'PATIENT_CREATE', 'PATIENT', 'CREATE', 'Register new patients'),
(UUID(), 'Edit Patient', 'PATIENT_UPDATE', 'PATIENT', 'UPDATE', 'Edit patient information'),
(UUID(), 'Delete Patient', 'PATIENT_DELETE', 'PATIENT', 'DELETE', 'Delete patient records'),
(UUID(), 'View Patient History', 'PATIENT_HISTORY', 'PATIENT', 'READ', 'View full patient medical history'),

-- Appointment Management
(UUID(), 'View Appointments', 'APPT_VIEW', 'APPOINTMENT', 'READ', 'View appointment schedule'),
(UUID(), 'Book Appointment', 'APPT_CREATE', 'APPOINTMENT', 'CREATE', 'Book new appointments'),
(UUID(), 'Edit Appointment', 'APPT_UPDATE', 'APPOINTMENT', 'UPDATE', 'Modify appointments'),
(UUID(), 'Cancel Appointment', 'APPT_CANCEL', 'APPOINTMENT', 'DELETE', 'Cancel appointments'),

-- Billing & Finance
(UUID(), 'View Bills', 'BILL_VIEW', 'BILLING', 'READ', 'View billing records'),
(UUID(), 'Create Bill', 'BILL_CREATE', 'BILLING', 'CREATE', 'Generate bills'),
(UUID(), 'Edit Bill', 'BILL_UPDATE', 'BILLING', 'UPDATE', 'Modify bills'),
(UUID(), 'Process Payment', 'PAYMENT_PROCESS', 'BILLING', 'CREATE', 'Collect payments'),
(UUID(), 'View Financial Reports', 'FINANCE_REPORTS', 'FINANCE', 'READ', 'Access financial dashboards'),

-- Prescription & Clinical
(UUID(), 'Create Prescription', 'RX_CREATE', 'PRESCRIPTION', 'CREATE', 'Write prescriptions'),
(UUID(), 'View Prescriptions', 'RX_VIEW', 'PRESCRIPTION', 'READ', 'View prescription history'),
(UUID(), 'Perform Procedure', 'PROCEDURE_PERFORM', 'CLINICAL', 'CREATE', 'Perform and record procedures'),

-- Inventory
(UUID(), 'View Inventory', 'INV_VIEW', 'INVENTORY', 'READ', 'View inventory items'),
(UUID(), 'Manage Inventory', 'INV_MANAGE', 'INVENTORY', 'MANAGE', 'Full inventory management'),

-- Staff Management
(UUID(), 'View Staff', 'STAFF_VIEW', 'STAFF', 'READ', 'View staff list'),
(UUID(), 'Manage Staff', 'STAFF_MANAGE', 'STAFF', 'MANAGE', 'Full staff management'),

-- System Configuration
(UUID(), 'System Settings', 'SYS_SETTINGS', 'SYSTEM', 'MANAGE', 'Configure system settings'),
(UUID(), 'View Reports', 'REPORTS_VIEW', 'REPORTS', 'READ', 'Access system reports'),
(UUID(), 'Export Data', 'DATA_EXPORT', 'SYSTEM', 'EXPORT', 'Export system data');

-- ============================================================================
-- 11. ASSIGN DEFAULT PERMISSIONS TO ROLES
-- ============================================================================

-- HOSPITAL_ADMIN: Full access
INSERT INTO `RolePermission` (`id`, `role`, `permissionId`)
SELECT UUID(), 'HOSPITAL_ADMIN', `id` FROM `Permission`;

-- DOCTOR: Clinical + Patient access
INSERT INTO `RolePermission` (`id`, `role`, `permissionId`)
SELECT UUID(), 'DOCTOR', `id` FROM `Permission` 
WHERE `code` IN ('PATIENT_VIEW', 'PATIENT_CREATE', 'PATIENT_UPDATE', 'PATIENT_HISTORY', 
                 'APPT_VIEW', 'RX_CREATE', 'RX_VIEW', 'PROCEDURE_PERFORM', 'REPORTS_VIEW');

-- RECEPTIONIST: Front desk operations
INSERT INTO `RolePermission` (`id`, `role`, `permissionId`)
SELECT UUID(), 'RECEPTIONIST', `id` FROM `Permission` 
WHERE `code` IN ('PATIENT_VIEW', 'PATIENT_CREATE', 'PATIENT_UPDATE', 
                 'APPT_VIEW', 'APPT_CREATE', 'APPT_UPDATE', 'APPT_CANCEL',
                 'BILL_VIEW', 'BILL_CREATE', 'PAYMENT_PROCESS');

-- SUB_DEPT_HEAD: Department-specific access
INSERT INTO `RolePermission` (`id`, `role`, `permissionId`)
SELECT UUID(), 'SUB_DEPT_HEAD', `id` FROM `Permission` 
WHERE `code` IN ('PATIENT_VIEW', 'PATIENT_HISTORY', 'PROCEDURE_PERFORM', 
                 'RX_VIEW', 'REPORTS_VIEW', 'INV_VIEW');

-- FINANCE_HEAD: Financial access
INSERT INTO `RolePermission` (`id`, `role`, `permissionId`)
SELECT UUID(), 'FINANCE_HEAD', `id` FROM `Permission` 
WHERE `code` IN ('BILL_VIEW', 'BILL_CREATE', 'BILL_UPDATE', 'PAYMENT_PROCESS', 
                 'FINANCE_REPORTS', 'REPORTS_VIEW', 'DATA_EXPORT');

-- STAFF: Basic access
INSERT INTO `RolePermission` (`id`, `role`, `permissionId`)
SELECT UUID(), 'STAFF', `id` FROM `Permission` 
WHERE `code` IN ('PATIENT_VIEW', 'APPT_VIEW', 'INV_VIEW');
