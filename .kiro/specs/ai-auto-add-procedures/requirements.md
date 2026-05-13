# Requirements Document

## Introduction

This feature adds an "AI Auto-Add Procedures" capability to the subdepartment procedures dashboard. A single button click triggers an AI call that analyzes the subdepartment's type and name, then automatically generates and saves a relevant set of procedures into the department's procedure catalog. This eliminates the manual effort of adding procedures one by one when setting up a new subdepartment or expanding an existing catalog.

The AI uses the existing Gemini / OpenRouter infrastructure already present in the project. The feature is scoped to the `procedures` tab of the subdepartment dashboard (e.g., `/subdept/derma-procedures/dashboard?tab=procedures`).

## Glossary

- **AI_Service**: The server-side module that calls Gemini or OpenRouter to generate procedure suggestions.
- **Procedure**: A medical or clinical service record stored in the `procedure` table, belonging to a specific subdepartment.
- **SubDept_Head**: The authenticated user with role `SUB_DEPT_HEAD` who manages the subdepartment.
- **Procedures_Panel**: The UI section rendered when `tab=procedures` is active on the subdepartment dashboard.
- **Auto-Add_Button**: The single-click UI control that initiates the AI procedure generation flow.
- **Generation_Result**: The structured list of procedure objects returned by the AI_Service.
- **Duplicate**: A procedure whose `name` (case-insensitive) already exists in the subdepartment's catalog.
- **AI_Procedures_API**: The new Next.js API route `POST /api/subdept/procedures/ai-suggest` that orchestrates AI generation and bulk insertion.

## Requirements

---

### Requirement 1: Auto-Add Button in Procedures Panel

**User Story:** As a SubDept_Head, I want a single-click "AI Auto-Add" button on the procedures tab, so that I can populate my procedure catalog instantly without manual data entry.

#### Acceptance Criteria

1. THE Procedures_Panel SHALL render an Auto-Add_Button in the toolbar alongside the existing "Add Procedure" and "Export" controls.
2. WHEN the `tab` query parameter equals `"procedures"`, THE Procedures_Panel SHALL display the Auto-Add_Button regardless of whether any procedures already exist.
3. THE Auto-Add_Button SHALL be visually distinct from the manual "Add Procedure" button, using a sparkle or wand icon and a label such as "AI Auto-Add".
4. WHILE the AI generation is in progress, THE Auto-Add_Button SHALL display a loading spinner and be disabled to prevent duplicate submissions.

---

### Requirement 2: AI Procedure Generation API

**User Story:** As a SubDept_Head, I want the system to call an AI model with my department's context, so that the generated procedures are relevant to my specialty.

#### Acceptance Criteria

1. WHEN the Auto-Add_Button is clicked, THE Procedures_Panel SHALL send a `POST` request to `/api/subdept/procedures/ai-suggest` with no request body (the server derives context from the authenticated session).
2. THE AI_Procedures_API SHALL authenticate the request and return `403` if the caller's role is not `SUB_DEPT_HEAD`.
3. THE AI_Procedures_API SHALL retrieve the subdepartment's `name`, `type`, and existing procedure names from the database before calling the AI_Service.
4. THE AI_Procedures_API SHALL construct a prompt that includes the subdepartment `type`, `name`, and the list of existing procedure names, instructing the AI_Service to return only procedures not already present.
5. THE AI_Service SHALL call Gemini first and fall back to OpenRouter if Gemini returns an error or empty result, matching the pattern used in `/api/chat/route.ts`.
6. THE AI_Procedures_API SHALL instruct the AI_Service to return a JSON array of procedure objects, each containing: `name` (string), `type` (one of the valid PROC_TYPES), `fee` (number or null), `duration` (number in minutes or null), and `description` (string or null).
7. IF the AI_Service returns a malformed or non-parseable response, THEN THE AI_Procedures_API SHALL return a `502` error with a descriptive message.
8. THE AI_Procedures_API SHALL parse the AI_Service response and extract the JSON array, stripping any markdown code fences if present.

---

### Requirement 3: Duplicate Prevention and Bulk Insertion

**User Story:** As a SubDept_Head, I want the system to skip procedures I already have, so that AI auto-add never creates duplicates in my catalog.

#### Acceptance Criteria

1. BEFORE inserting, THE AI_Procedures_API SHALL filter out any Generation_Result entries whose `name` matches an existing procedure name (case-insensitive comparison).
2. THE AI_Procedures_API SHALL insert all non-duplicate procedures in a single database operation using `prisma.procedure.createMany`.
3. WHEN all suggested procedures already exist, THE AI_Procedures_API SHALL return a `200` response with `added: 0` and a message indicating no new procedures were needed.
4. THE AI_Procedures_API SHALL return a `201` response containing `added` (count of inserted procedures) and `skipped` (count of duplicates) upon successful insertion.
5. IF the database insertion fails, THEN THE AI_Procedures_API SHALL return a `500` error and SHALL NOT leave partial data without logging the error.

---

### Requirement 4: User Feedback and Result Display

**User Story:** As a SubDept_Head, I want clear feedback after the AI runs, so that I know how many procedures were added and can review them immediately.

#### Acceptance Criteria

1. WHEN the AI_Procedures_API returns a success response, THE Procedures_Panel SHALL reload the procedures list to display the newly added entries.
2. WHEN `added` is greater than 0, THE Procedures_Panel SHALL display a success message stating how many procedures were added (e.g., "12 procedures added by AI").
3. WHEN `added` equals 0, THE Procedures_Panel SHALL display an informational message indicating all suggested procedures already exist.
4. IF the AI_Procedures_API returns an error, THEN THE Procedures_Panel SHALL display a user-readable error message and SHALL NOT leave the UI in a loading state.
5. THE Procedures_Panel SHALL dismiss the feedback message automatically after 5 seconds or when the user interacts with the panel.

---

### Requirement 5: AI Prompt Quality

**User Story:** As a SubDept_Head, I want the AI to generate medically appropriate procedures for my department type, so that the suggestions are clinically relevant and ready to use.

#### Acceptance Criteria

1. THE AI_Procedures_API SHALL include the subdepartment `type` (e.g., `DERMATOLOGY`) and `name` (e.g., `Derma Procedures`) in the prompt sent to the AI_Service.
2. THE AI_Procedures_API SHALL instruct the AI_Service to generate between 10 and 20 procedures appropriate for the given department type.
3. THE AI_Procedures_API SHALL instruct the AI_Service to assign realistic fee values in Indian Rupees (INR) appropriate for the procedure type.
4. THE AI_Procedures_API SHALL instruct the AI_Service to assign realistic duration values in minutes for each procedure.
5. THE AI_Procedures_API SHALL instruct the AI_Service to use only the following valid `type` values: `CONSULTATION`, `PROCEDURE`, `SURGERY`, `DIAGNOSTIC`, `THERAPY`, `VACCINATION`, `OTHER`.
6. THE AI_Procedures_API SHALL instruct the AI_Service to respond with a raw JSON array only, with no additional explanation text, to ensure reliable parsing.
