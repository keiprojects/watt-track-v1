# WattTrack Development Plan

Last updated: 2026-07-14
Status owner: project repository

## Purpose

This document is the source of truth for how WattTrack will be built from the PRD.

Use it to track:

- what is already implemented
- what is partially implemented
- what must be built next
- what "done" means for each milestone

The PRD defines product requirements. [spec-plan.md](C:\Users\kgonz\Documents\GitHub\watt-track-v1\docs\spec-plan.md) defines the implementation contract. This plan defines execution order, technical direction, and delivery status.

## Current State Snapshot

The repository now contains a PRD-aligned offline-first MVP foundation with onboarding, reading calculations, and baseline dashboard screens, but it still has meaningful gaps before the full acceptance gate is met.

Current implementation observed in `src/`:

- Expo Router root layout and five-tab shell exist with onboarding gating.
- Core types, storage keys, backup payload, and schema versioning align to the PRD entities.
- Onboarding persists a full `SystemProfile` and onboarding completion state.
- Add Reading supports date-based entry, daily or cumulative modes, preview calculations, duplicate-date blocking, and warning overrides.
- Home, History, and Insights provide baseline summaries and empty states.
- System cost CRUD and payback forecasting now exist in Insights.
- Settings now supports display preferences, CSV export, JSON backup export/import, local reminder scheduling, delete-all-readings, and full reset flows.
- Saved decimal precision now drives kWh, currency, rate, and percentage formatting across dashboard, history, detail, insights, settings, and reading preview surfaces.
- Backup import validation now checks the full payload shape before replacing local data, and restored reminder settings are re-applied to the device schedule during import.
- History now supports month grouping, date/note/warning filters, detail view, edit, duplicate, and delete flows with cumulative recalculation safeguards.
- Dashboard period filters, seven-day energy charting, and expanded insights range controls are now implemented.

## Source-of-Truth Rules

1. Build against this plan unless a newer approved document replaces it.
2. Update this file when milestone scope, delivery order, or status changes.
3. Do not add product features outside the PRD future-features boundary unless this plan is updated first.
4. Keep the MVP offline-first, Android-first, and PHP/Asia-Manila aware.
5. Prefer incremental delivery where each milestone leaves the app runnable.

## Product Boundaries

### Must support in MVP

- Offline manual solar and grid tracking
- Daily, monthly, and yearly summaries
- Estimated savings and ROI
- Device-local persistence only
- CSV export and JSON backup/import
- Optional local reminder

### Must not expand into MVP

- Cloud sync
- Inverter or smart-meter integrations
- Real-time monitoring
- Remote services or server-backed features
- AI recommendations

## Architecture Direction

### Platform

- Expo managed workflow
- React Native with TypeScript
- Expo Router navigation

### State and validation

- Zustand for app state
- React Hook Form for data entry
- Zod for form and import validation

### Storage

- AsyncStorage behind a single storage service
- Versioned schema with migration support
- Separate keys for profile, readings, costs, settings, and schema version

### Domain model target

The codebase must align to these PRD entities:

- `SystemProfile`
- `EnergyReading`
- `SystemCost`
- `AppSettings`
- `WattTrackBackup`

### Service boundaries

- `storage.service.ts`: persistence, import/export, schema versioning
- `calculation.service.ts`: daily derivations, savings, ROI, payback forecasting
- `export.service.ts`: CSV and JSON backup generation
- `notification.service.ts`: local reminder scheduling and cancellation

## Gaps Between Current Code and Target Product

These gaps should be treated as the first correction pass before feature expansion:

- Replace generic watt-duration readings with meter-reading and daily-energy models from the PRD.
- Replace USD-oriented cost settings with PHP currency defaults and import/export rate support.
- Expand onboarding into a real system profile setup flow.
- Add missing stores for system profile, settings, and costs.
- Add schema version storage and backup model support.
- Rework dashboard summaries to use solar, grid, savings, and ROI metrics.

## Delivery Strategy

The build will follow seven milestones. Each milestone should end with the app compiling, basic flows manually testable, and status updated in this file.

## Milestone Plan

### Milestone 0: Realign Foundation

Status: completed

Goal:
Bring the scaffold into alignment with the PRD before building new user-facing functionality.

Scope:

- Rename and reshape types to match PRD terminology.
- Introduce `SystemProfile`, `SystemCost`, `AppSettings`, and PRD-compliant `EnergyReading`.
- Replace current storage keys with PRD storage keys.
- Add `CURRENT_SCHEMA_VERSION = 1`.
- Audit folder naming and standardize on the intended app structure.

Definition of done:

- All core types match the PRD.
- Storage service reads and writes the PRD models.
- The app still starts successfully after model refactor.

### Milestone 1: Onboarding and System Profile

Status: completed

Goal:
Collect the minimum setup information required for calculations and unlock the rest of the app.

Scope:

- Build full onboarding form with basic info, solar system details, and reading configuration.
- Add validation for date, costs, rates, and optional export settings.
- Persist the completed system profile and onboarding state.
- Route first-time users into onboarding and returning users into tabs.

Definition of done:

- A user can create and edit a valid system profile.
- Onboarding completion persists across app restarts.
- Default values are editable and not hardcoded business logic.

### Milestone 2: Reading Entry and Calculation Engine

Status: completed

Goal:
Support daily input for grid, solar, export, and rate data using the PRD calculation rules.

Scope:

- Rebuild Add Reading around date-based entries.
- Support cumulative and daily grid input modes.
- Support cumulative and daily solar input modes.
- Support disabled, daily, and cumulative export modes.
- Implement preview calculations before save.
- Add duplicate-date validation and warning flow.
- Add meter reset handling for lower cumulative readings.
- Add unusually high value warnings with override support.

Definition of done:

- A user can save a PRD-compliant reading.
- Daily derived values are computed consistently from prior readings.
- Warnings are shown without forcing data loss.

### Milestone 3: History and Readings Management

Status: completed

Goal:
Make stored readings reviewable, editable, and safe to correct.

Scope:

- Build month-grouped history list.
- Add reading detail view.
- Add edit, duplicate, and delete flows.
- Warn when deleting entries that affect later cumulative calculations.
- Add filters for date range, notes, and warnings.

Definition of done:

- Readings can be reviewed and corrected without corrupting later calculations.
- The app handles empty states and missing days cleanly.

### Milestone 4: Dashboard and Core Insights

Status: completed

Goal:
Turn stored readings into clear daily and monthly understanding.

Scope:

- Build Home dashboard with today, month, and ROI summary cards.
- Add seven-day default chart for solar vs. grid.
- Add dashboard period filters.
- Build Insights screen for totals, averages, contribution, and estimated savings.
- Label estimated metrics clearly when assumptions are used.

Definition of done:

- The dashboard answers the PRD success questions at a glance.
- Empty states do not crash and guide the user to add data.

### Milestone 5: Costs, ROI, and Payback

Status: completed

Goal:
Track investment recovery with clear financial context.

Scope:

- Add system cost entry, editing, and deletion.
- Distinguish capital costs from maintenance expenses.
- Implement cumulative savings, net savings, ROI, payback progress, remaining amount, and payback date.
- Add forecast period selection for payback estimates.

Definition of done:

- ROI and payback calculations use PRD formulas.
- Financial results are labeled as estimated where appropriate.

### Milestone 6: Settings, Backup, Export, and Reminders

Status: partial

Goal:
Finish the offline product loop and protect user data.

Scope:

- Build settings for theme, currency, precision, dashboard defaults, and reading modes.
- Add CSV export for readings.
- Add JSON backup export and import validation flow.
- Add clear-all and reset flows with confirmation.
- Add optional local reminder scheduling to open Add Reading.
- Add privacy and local-storage warning copy.

Definition of done:

- Users can back up and restore data locally.
- Reminder scheduling works without internet.
- Destructive actions require confirmation.

### Milestone 7: QA, Hardening, and Release Readiness

Status: pending

Goal:
Stabilize the MVP against the acceptance criteria before broader polishing.

Scope:

- Manual QA pass across onboarding, add, history, insights, costs, settings, and backup flows.
- Type-safety and validation review.
- Edge-case checks for zero values, missing data, duplicate dates, invalid imports, and reset handling.
- Acceptance-criteria audit against the PRD.

Definition of done:

- The MVP acceptance checklist passes.
- The app works offline without crashing on empty or partial data.

## Cross-Cutting Standards

### UX standards

- Optimize for fast daily entry in under one minute.
- Keep dashboards readable outdoors with strong contrast.
- Use icon plus text, not color alone, for status meaning.
- Keep estimated values visibly labeled.

### Data standards

- Store dates and times in consistent ISO-compatible formats.
- Use Asia/Manila behavior for date-sensitive calculations and display.
- Format money in Philippine peso.
- Preserve original entered readings alongside derived values.

### Engineering standards

- Keep business logic out of screen components.
- Put all persistence behind the storage service.
- Keep calculations deterministic and unit-testable.
- Prefer additive migrations over destructive schema changes.

## Suggested Work Sequence for the Next Build Sessions

1. Complete Milestone 0 before adding new screens.
2. Build Milestone 1 and Milestone 2 together if shared form infrastructure is needed.
3. Finish History before polishing Dashboard charts.
4. Finish ROI only after readings and costs are stable.
5. Add backup/import before any release candidate.

## Acceptance Tracking

Use this section as the release gate. Mark each item only when verified in app behavior.

- [ ] User can create and edit a solar system profile.
- [ ] User can enter cumulative or daily grid readings.
- [ ] User can enter cumulative or daily solar readings.
- [ ] App calculates daily grid consumption automatically.
- [ ] App calculates daily solar generation automatically.
- [ ] App calculates estimated savings from stored rates.
- [x] Dashboard displays daily and monthly summaries.
- [x] History supports view, edit, and delete.
- [x] Insights displays totals, savings, ROI, and payback.
- [ ] Additional system costs can be recorded.
- [ ] Data persists after app close and reopen.
- [ ] App works without internet.
- [ ] User can export readings as CSV.
- [ ] User can export and import JSON backup.
- [ ] Invalid cumulative readings show warning.
- [ ] Missing days are handled correctly.
- [ ] No crash occurs when no readings exist.
- [ ] Philippine peso formatting is supported.
- [ ] Device-local and Asia/Manila date behavior is respected.
- [ ] Estimated results are labeled appropriately.

## Decision Log

### 2026-07-14

- The repository `docs/` folder was established as the planning source of truth.
- The first source-of-truth document is this PRD-aligned development plan.
- The current scaffold will be refactored toward the PRD rather than extended as-is.
- System cost management and forecast-based payback estimation were added in Insights as the next finance-focused delivery slice.
- Settings, local reminder scheduling, CSV export, JSON backup import/export, and destructive reset flows were added as the next offline data-safety delivery slice.
- Display precision settings were wired into shared number formatting, and imported reminder settings now reschedule local notifications after backup restore.
- History filters, reading detail/edit/duplicate/delete flows, and downstream cumulative recalculation safeguards were added as the next readings-management delivery slice.
- Dashboard period filters, seven-day solar-vs-grid charting, and range-based insights summaries were added to complete the dashboard and core insights milestone.
- Insights cost filtering, capital-versus-maintenance breakdowns, and payback date visibility were tightened to complete the costs, ROI, and payback milestone.
