# IPD Dashboard - Phase 1 Core Implementation

## Current State
- Basic `IPDPanel.tsx` (772 lines) with bed map + admissions list views
- 3 API routes: `/api/ipd/allocate-bed`, `/api/ipd/bed-status`, `/api/ipd/discharge-bed`
- `BedAllocation` model with basic patient/admission data
- Existing models for `Ward`, `Room`, `Bed`, `Patient`, `Bill`, `LabOrder`, `Notification`, `Prescription`

## Architecture Decision
- **New route**: `/hospitaladmin/dashboard?tab=ipd` will render a new `IPDDashboardPanel.tsx` (replaces `IPDPanel.tsx` import)
- **Sub-tabs**: The IPD panel itself will have internal tabs: Overview, Admissions, Bed Map, Clinical, Medications, Lab Orders, Billing, Discharge, Transfers, Alerts
- **Tailwind CSS**: Set up Tailwind config and use utility classes for all new components
- **API pattern**: Follow existing pattern using `requireHospitalAdmin` middleware + Zod validation + service/repo layers

---

## Task 1: Set Up Tailwind CSS
- Create `tailwind.config.ts` with content paths pointing to `src/` and custom teal brand colors
- Create `postcss.config.mjs` 
- Add `@tailwind base; @tailwind components; @tailwind utilities;` to top of `src/app/globals.css`
- Verify existing styles don't break

## Task 2: Add New Prisma Models
Add to `prisma/schema.prisma`:

**IPDAdmission** (extends BedAllocation concept with richer data):
- `id`, `hospitalId`, `allocationId` (FK to BedAllocation), `patientId` (FK to Patient)
- `ipdNumber` (auto-generated like "IPD-00001"), `admissionType` (EMERGENCY/PLANNED/TRANSFER)
- `assignedDoctorId` (FK to Doctor), `departmentId`
- `insuranceProvider`, `insuranceId`, `corporateName`
- `admissionNotes` (Text), `status` (ADMITTED/DISCHARGED/TRANSFERRED)
- `createdAt`, `updatedAt`

**IPDVitals**:
- `id`, `hospitalId`, `admissionId` (FK to IPDAdmission)
- `recordedAt`, `recordedBy`
- `bloodPressureSystolic`, `bloodPressureDiastolic`, `pulse`, `temperature`, `respiratoryRate`, `oxygenSaturation`, `bloodSugar`, `weight`
- `notes`

**IPDClinicalNote**:
- `id`, `hospitalId`, `admissionId` (FK to IPDAdmission)
- `type` enum: DOCTOR_ROUND, PROGRESS_NOTE, NURSING_NOTE, TREATMENT_PLAN, DIAGNOSIS
- `content` (Text), `authorName`, `authorRole`
- `createdAt`

**IPDMedicationOrder**:
- `id`, `hospitalId`, `admissionId`
- `medicationName`, `dosage`, `frequency`, `route` (ORAL/IV/IM/SC/TOPICAL)
- `startDate`, `endDate`, `status` (ACTIVE/COMPLETED/DISCONTINUED)
- `prescribedBy`, `notes`

**IPDMedicationAdministration** (MAR):
- `id`, `hospitalId`, `orderId` (FK to IPDMedicationOrder)
- `scheduledTime`, `administeredAt`, `administeredBy`
- `status` (GIVEN/MISSED/HELD/REFUSED), `notes`

**IPDBedTransfer**:
- `id`, `hospitalId`, `admissionId`
- `fromBedId`, `toBedId`, `fromWardId`, `toWardId`
- `reason`, `transferredBy`, `transferredAt`

**IPDDischargeSummary**:
- `id`, `hospitalId`, `admissionId`
- `finalDiagnosis` (Text), `conditionAtDischarge`, `dischargeMedications` (Text/JSON)
- `followUpInstructions` (Text), `dietaryInstructions`
- `billingCleared` (Boolean), `dischargedBy`, `dischargedAt`

Run `npx prisma migrate dev` after schema changes.

## Task 3: Create IPD Backend Services & Repositories

**`backend/repositories/ipd.repo.ts`** - All IPD database queries:
- `createIPDAdmission()`, `findIPDAdmission()`, `findAllIPDAdmissions()`, `updateIPDAdmission()`
- `generateIPDNumber()` 
- `createVitals()`, `findVitalsForAdmission()`, `getLatestVitals()`
- `createClinicalNote()`, `findNotesForAdmission()`
- `createMedicationOrder()`, `findMedicationsForAdmission()`, `updateMedicationOrder()`
- `createMedicationAdmin()`, `findMARForOrder()`
- `createBedTransfer()`, `findTransfersForAdmission()`
- `createDischargeSummary()`, `findDischargeSummary()`
- `getIPDDashboardStats()` - aggregated statistics

**`backend/services/ipd.service.ts`** - Business logic:
- `admitPatientIPD()` - creates BedAllocation + IPDAdmission + notification
- `recordVitals()`, `getVitalsHistory()`
- `addClinicalNote()`, `getClinicalNotes()`
- `orderMedication()`, `administerMedication()`, `getMedicationChart()`
- `transferBed()` - handles bed swap, status updates, transfer record
- `dischargePatientIPD()` - creates discharge summary, generates final bill, updates bed
- `getIPDOverview()` - dashboard stats (occupancy, department-wise, critical list, ALOS)
- `getIPDAdmissions()` - paginated list with filters
- `generateIPDBill()` - calculates room charges, medication, procedures

## Task 4: Create IPD API Routes

All under `src/app/api/ipd/`:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/ipd/admissions` | GET, POST | List/create IPD admissions |
| `/api/ipd/admissions/[id]` | GET, PATCH | Get/update single admission |
| `/api/ipd/vitals` | GET, POST | Record & fetch vitals |
| `/api/ipd/clinical-notes` | GET, POST | Record & fetch clinical notes |
| `/api/ipd/medications` | GET, POST, PATCH | Medication orders & MAR |
| `/api/ipd/medications/administer` | POST | Record medication administration |
| `/api/ipd/transfers` | GET, POST | Bed/ward transfers |
| `/api/ipd/discharge` | POST | Full discharge with summary |
| `/api/ipd/dashboard` | GET | IPD dashboard aggregated stats |
| `/api/ipd/billing/[admissionId]` | GET, POST | IPD billing per admission |

Keep existing 3 routes (`allocate-bed`, `bed-status`, `discharge-bed`) for backward compatibility.

## Task 5: Build IPD Dashboard Component

**`src/components/IPDDashboardPanel.tsx`** - Main component with sub-tabs:

### Sub-tab: Overview
- KPI cards: Total admitted, Bed occupancy %, Average LOS, Discharges today, Critical patients
- Department-wise patient count chart
- Ward occupancy bars
- Recent admissions list
- Alerts feed (critical vitals, overdue discharges, pending meds)

### Sub-tab: Admissions  
- Table of all IPD admissions with status filters (Admitted/Discharged/Transferred)
- Search by patient name, IPD number, bed number
- "New Admission" button (enhanced modal with admission type, insurance, doctor assignment)
- Click row to expand patient detail panel

### Sub-tab: Bed Map
- Existing bed map from IPDPanel (migrated to Tailwind)
- Enhanced with transfer capability (drag or button to move patient between beds)

### Sub-tab: Clinical (Patient Detail View)
- Patient selector dropdown (from admitted list)
- Vitals chart (line graph of BP, pulse, temp over time)
- Vitals recording form
- Clinical notes timeline (doctor rounds, progress notes, nursing notes)
- Add note form with type selector

### Sub-tab: Medications
- Patient selector
- Active medication orders list
- Medication Administration Record (MAR) - time-based grid
- "Add Medication Order" form
- "Administer" button per scheduled dose

### Sub-tab: Lab Orders
- Link to existing lab order system with IPD context
- Order lab tests for admitted patients
- View pending/completed lab results

### Sub-tab: Billing
- Per-patient IPD billing view
- Auto-calculated room charges (days * bed rate)
- Procedure charges, medication charges
- Generate interim bill / final bill buttons

### Sub-tab: Discharge
- Patient selector (admitted patients only)
- Discharge summary form: final diagnosis, condition, medications, follow-up
- Billing clearance check
- "Discharge Patient" button (triggers discharge flow)

### Sub-tab: Transfers
- Transfer history table
- "Transfer Patient" form: select patient, new ward/bed, reason

### Sub-tab: Alerts
- Real-time alert feed: critical vitals, overdue meds, pending lab results, expected discharge overdue
- Mark as read/acknowledged

## Task 6: Wire Up Dashboard Integration
- Update `src/app/hospitaladmin/dashboard/page.tsx` to import `IPDDashboardPanel` instead of `IPDPanel`
- Ensure `tab=ipd` routes to new component

## Task 7: Verify & Test
- Run `npx prisma migrate dev` to apply schema
- Verify all API routes return correct data
- Test admission -> vitals -> notes -> medications -> transfer -> billing -> discharge flow
- Verify existing dashboard tabs still work

---

## File Summary

### New Files (~15):
- `tailwind.config.ts`, `postcss.config.mjs`
- `backend/repositories/ipd.repo.ts`
- `backend/services/ipd.service.ts`  
- `src/app/api/ipd/admissions/route.ts`
- `src/app/api/ipd/admissions/[id]/route.ts`
- `src/app/api/ipd/vitals/route.ts`
- `src/app/api/ipd/clinical-notes/route.ts`
- `src/app/api/ipd/medications/route.ts`
- `src/app/api/ipd/medications/administer/route.ts`
- `src/app/api/ipd/transfers/route.ts`
- `src/app/api/ipd/discharge/route.ts` (enhanced version)
- `src/app/api/ipd/dashboard/route.ts`
- `src/app/api/ipd/billing/[admissionId]/route.ts`
- `src/components/IPDDashboardPanel.tsx`

### Modified Files (~3):
- `prisma/schema.prisma` (add 7 new models + enums)
- `src/app/globals.css` (add Tailwind directives)
- `src/app/hospitaladmin/dashboard/page.tsx` (swap IPDPanel import)
