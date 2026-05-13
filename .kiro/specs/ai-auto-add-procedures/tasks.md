# Implementation Plan: AI Auto-Add Procedures

## Overview

Implement a single-click "AI Auto-Add" button on the subdepartment procedures tab that calls a new API route, generates clinically relevant procedures via Gemini/OpenRouter, deduplicates against existing entries, and bulk-inserts the results with live UI feedback.

## Tasks

- [x] 1. Create the API route skeleton and auth guard
  - Create `src/app/api/subdept/procedures/ai-suggest/route.ts` with a `POST` handler
  - Apply `authMiddleware` and return `403` if the caller's role is not `SUB_DEPT_HEAD`
  - Call `getSubDeptProfile(userId)` to retrieve `{id, name, type, hospitalId}`; propagate any service error
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Implement pure helper functions
  - [x] 2.1 Implement `buildProcedurePrompt(deptType, deptName, existingNames)`
    - Include dept type, dept name, existing names, count range 10–20, INR fees, minutes duration, valid type list, and "raw JSON array only" instruction
    - _Requirements: 2.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 2.2 Write property test for `buildProcedurePrompt` — Property 6
    - **Property 6: Prompt always contains subdepartment context**
    - **Validates: Requirements 2.4, 5.1**

  - [x] 2.3 Implement `stripFences(text)`
    - Strip ` ```json ... ``` ` and ` ``` ... ``` ` wrappers; return unchanged string if no fences present
    - _Requirements: 2.8_

  - [ ]* 2.4 Write property test for `stripFences` — Property 3
    - **Property 3: Fence stripping preserves JSON equivalence**
    - **Validates: Requirements 2.8**

  - [x] 2.5 Implement `filterDuplicates(suggestions, existingNames)`
    - Case-insensitive name comparison; return only non-duplicate entries
    - Drop items missing a `name` field; coerce invalid `type` values to `"OTHER"`
    - _Requirements: 3.1, 5.5_

  - [ ]* 2.6 Write property tests for `filterDuplicates` — Properties 1, 2, 4
    - **Property 1: Duplicate-free insertion** — **Validates: Requirements 3.1, 3.3**
    - **Property 2: Added + skipped = total valid AI suggestions** — **Validates: Requirements 3.4**
    - **Property 4: All inserted procedures have valid PROC_TYPES** — **Validates: Requirements 5.5**

- [x] 3. Implement AI call helpers
  - [x] 3.1 Implement `tryGemini(prompt)` following the pattern in `/api/chat/route.ts`
    - Return the raw text string on success, `null` on error or empty result
    - _Requirements: 2.5_

  - [x] 3.2 Implement `tryOpenRouter(prompt)` following the pattern in `/api/chat/route.ts`
    - Iterate `OPENROUTER_MODELS`; return first successful raw text, `null` if all fail
    - _Requirements: 2.5_

  - [ ]* 3.3 Write unit test for Gemini-first fallback
    - Mock Gemini to fail; assert `tryOpenRouter` is called and its result is used
    - _Requirements: 2.5_

- [x] 4. Wire AI call, parsing, and DB insertion into the route handler
  - Call `tryGemini` then `tryOpenRouter` as fallback; return `502` if both return `null`
  - Apply `stripFences` then `JSON.parse`; return `502` on parse failure
  - Call `filterDuplicates` to separate new from duplicate procedures
  - If no new procedures, return `200` with `{ added: 0, skipped }`
  - Call `prisma.procedure.createMany` with `hospitalId`, `subDepartmentId`, `sequence: 0`, `isActive: true`; return `201` with `{ added, skipped }` on success; return `500` and log on DB error
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.1 Write property test for malformed AI response — Property 8
    - **Property 8: Malformed AI response always produces 502**
    - **Validates: Requirements 2.7**

  - [ ]* 4.2 Write unit test for DB error → 500
    - Mock `prisma.procedure.createMany` to throw; assert `500` response and error logged
    - _Requirements: 3.5_

- [x] 5. Checkpoint — Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add AI Auto-Add button and state to the procedures panel UI
  - In `src/app/subdept/dashboard/page.tsx`, add `aiAdding` and `aiMsg` state variables
  - Render the Auto-Add button in the procedures toolbar alongside "Add Procedure" and "Export"
  - Use a sparkle/wand icon and label "AI Auto-Add"; disable and show spinner while `aiAdding` is `true`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Implement `handleAiAutoAdd` and result feedback
  - Set `aiAdding = true`, POST to `/api/subdept/procedures/ai-suggest`, handle all response shapes
  - On success (`added > 0`): reload procedures list, set `aiMsg` to success text with count
  - On zero-add (`added === 0`): set `aiMsg` to informational message
  - On error response or network throw: set `aiMsg` to user-readable error; always clear `aiAdding` in `finally`
  - Auto-dismiss `aiMsg` after 5 seconds via `setTimeout`; clear timer on unmount
  - _Requirements: 2.1, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.1 Write property test for UI loading state — Property 5
    - **Property 5: UI loading state is always cleared after completion**
    - **Validates: Requirements 1.4, 4.4**

  - [ ]* 7.2 Write unit test for button click sends correct fetch
    - Simulate click; assert `POST /api/subdept/procedures/ai-suggest` is called
    - _Requirements: 2.1_

  - [ ]* 7.3 Write unit test for auto-dismiss
    - Use fake timers; assert `aiMsg` is `null` after 5000 ms
    - _Requirements: 4.5_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** (`npm install --save-dev fast-check`) with a minimum of 100 iterations
- Each property test references the property number and requirements clause from the design document
- Pure helpers (`buildProcedurePrompt`, `stripFences`, `filterDuplicates`) should be extracted into a separate module (e.g., `src/app/api/subdept/procedures/ai-suggest/helpers.ts`) to make them independently testable
- No schema changes are required; the feature writes to the existing `procedure` table
