# WattTrack Spec Plan

Last updated: 2026-07-14
Source: WattTrack PRD v1.0
Status: draft source of truth

## Purpose

This document translates the PRD into an implementation-ready spec for the WattTrack MVP.

Use this document to define:

- what the app must do
- how the app should behave
- what data the app stores
- how calculations and warnings work
- what implementation boundaries must be preserved

Use [development-plan.md](C:\Users\kgonz\Documents\GitHub\watt-track-v1\docs\development-plan.md) for sequencing and delivery status. Use this file for the actual build contract.

## Product Summary

WattTrack is an offline-first React Native app for homeowners who manually track residential solar performance and return on investment.

The app must allow the user to:

- record grid, solar, and optional export readings manually
- calculate daily and aggregate energy metrics
- estimate savings using stored utility rates
- track capital and maintenance costs
- estimate ROI and payback progress
- back up and restore data locally without internet access

## Product Principles

- Offline first: core flows must work without internet.
- Manual entry first: no API, inverter, or meter integrations in MVP.
- Fast daily logging: a normal reading should be savable in under one minute.
- Transparent estimates: when a metric depends on assumptions, label it as estimated.
- Local ownership: user data stays on device unless the user exports it.

## MVP Scope

### In scope

- Onboarding and system setup
- Daily reading entry
- Dashboard summaries
- History review and editing
- Insights and ROI
- Cost tracking
- Local settings
- CSV export
- JSON backup export and import
- Optional local reminder

### Out of scope

- User accounts
- Cloud sync
- Smart meter or inverter integration
- Real-time telemetry
- Weather features
- Remote notifications
- AI recommendations
- Multi-user collaboration

## Primary User

The primary user is a homeowner with a grid-tied or hybrid solar system who wants simple manual tracking for production, savings, and payback.

## Navigation Spec

The app must use a five-tab bottom navigation layout:

- Home
- Add
- History
- Insights
- Settings

Navigation rules:

- The Add tab must use a visually prominent plus icon.
- First launch routes to onboarding before tabs are accessible.
- Completing onboarding routes the user to Home.
- Local reminder taps should open the Add tab directly.

## Core Flows

### First launch flow

1. App opens to onboarding.
2. User enters system profile and reading mode configuration.
3. User saves the profile.
4. User may enter the first reading immediately or continue to Home.
5. Tabs become the default app shell after onboarding is complete.

### Daily logging flow

1. User opens the app.
2. User taps Add.
3. User enters a reading for the selected date.
4. App previews derived values before save.
5. App shows warnings if needed.
6. User saves or overrides warnings and saves.
7. Dashboard, history, and insights update immediately.

### Data safety flow

1. User opens Settings.
2. User exports CSV or JSON backup.
3. User may import a JSON backup after validation and confirmation.
4. App warns before replacing existing data.

## Screen Specs

### Onboarding

Purpose:
Collect the minimum setup data required for calculations and persistence.

Required fields:

- system name
- installation date
- currency
- timezone
- initial system cost
- default electricity import rate
- grid input mode
- solar input mode
- export input mode

Optional fields:

- location
- solar array capacity
- battery capacity
- inverter capacity
- export credit rate

Behavior:

- Currency defaults to `PHP`.
- Timezone defaults to `Asia/Manila`.
- Export credit rate becomes required when export tracking is enabled.
- Installation date cannot be later than the device current date.
- User can save without optional fields.

### Home

Purpose:
Surface the most important daily, monthly, and lifetime metrics.

Required sections:

- system header
- today summary cards
- monthly summary
- ROI summary
- last seven days chart
- empty state when no readings exist

Today summary content:

- solar generated today
- grid consumed today
- estimated savings today
- solar contribution today

Monthly summary content:

- solar generated this month
- grid consumed this month
- estimated monthly savings
- estimated grid cost
- month-over-month comparison

ROI summary content:

- total investment
- total estimated savings
- payback progress
- estimated payback date

### Add Reading

Purpose:
Provide a fast entry form for a single daily reading.

Required fields:

- date
- optional time
- grid value
- solar value
- optional export value
- optional import rate override
- optional notes

Preview block must show:

- calculated grid consumption
- calculated solar generation
- estimated self-consumed solar
- estimated household energy usage
- estimated savings

Actions:

- save reading
- save and add another
- cancel

### History

Purpose:
Review and correct prior entries safely.

Required behavior:

- group entries by month
- show warning badge when applicable
- support filters for date range, notes, and warnings
- open entry detail view
- support edit, duplicate, and delete
- require confirmation before delete

Entry detail must show:

- original entered values
- derived daily values
- rates used
- estimated savings
- notes
- created date
- last edited date

### Insights

Purpose:
Explain energy and financial performance over a selected time range.

Required time filters:

- 7 days
- 30 days
- current month
- previous month
- current year
- all time
- custom range

Energy insights:

- total solar generated
- average solar generated per day
- highest day
- lowest day
- total grid consumption
- average grid consumption per day
- estimated household consumption
- solar contribution percentage
- estimated self-consumption percentage
- average daily grid cost

Financial insights:

- total estimated savings
- average daily savings
- average monthly savings
- total capital invested
- additional maintenance expenses
- net financial benefit
- ROI percentage
- payback progress
- remaining amount to recover
- estimated payback date

### Settings

Purpose:
Manage system configuration, display behavior, exports, backup, and destructive actions.

Required sections:

- system settings
- display settings
- data settings
- information

Required actions:

- edit system profile
- export CSV
- export JSON backup
- import JSON backup
- enable or disable reminder
- delete all readings
- reset application

Required warning:

`WattTrack stores information only on this device. Removing the app, clearing application data, or losing the device may permanently delete your records unless you create a backup.`

## Domain Data Spec

### SystemProfile

The system profile must store:

- id
- systemName
- optional location
- installationDate
- currency fixed to `PHP` in MVP
- timezone
- optional solarCapacityKw
- optional inverterCapacityKw
- optional batteryCapacityKwh
- initialSystemCost
- defaultImportRate
- optional defaultExportRate
- gridInputMode
- solarInputMode
- exportInputMode
- createdAt
- updatedAt

### EnergyReading

Each reading record must store:

- id
- date
- optional time
- optional gridReading
- gridConsumptionKwh
- optional solarReading
- solarGenerationKwh
- optional exportReading
- exportedEnergyKwh
- selfConsumedSolarKwh
- estimatedHomeUsageKwh
- importRate
- optional exportRate
- estimatedSavings
- estimatedGridCost
- optional notes
- optional meterReset
- optional warningCodes
- createdAt
- updatedAt

### SystemCost

Each cost record must store:

- id
- date
- category
- description
- amount
- costTreatment
- optional notes
- createdAt
- updatedAt

### AppSettings

App settings must store:

- theme
- decimalPlaces
- defaultDashboardPeriod
- reminderEnabled
- optional reminderTime
- onboardingCompleted

### Backup payload

The JSON backup must store:

- appName
- schemaVersion
- exportedAt
- systemProfile
- energyReadings
- systemCosts
- appSettings

## Calculation Spec

### Grid consumption

- If grid mode is `cumulative`, daily grid consumption equals current grid reading minus previous grid reading.
- If grid mode is `daily`, daily grid consumption equals the entered value.

### Solar generation

- If solar mode is `cumulative`, daily solar generation equals current solar reading minus previous solar reading.
- If solar mode is `daily`, daily solar generation equals the entered value.

### Exported energy

- If export mode is `cumulative`, daily export equals current export reading minus previous export reading.
- If export mode is `daily`, daily export equals the entered value.
- If export mode is `disabled`, daily export equals `0`.

### Self-consumed solar

- If export is tracked, self-consumed solar equals `max(0, solarGeneration - exportedEnergy)`.
- If export is not tracked, estimated self-consumed solar equals solar generation.

### Estimated household energy usage

- Estimated household usage equals `gridConsumption + selfConsumedSolar`.

### Solar contribution percentage

- Solar contribution equals `selfConsumedSolar / estimatedHouseholdUsage * 100`.
- If household usage is `0`, return `0`.

### Savings

- If export tracking is disabled, estimated savings equals `solarGeneration * importRate`.
- If export tracking is enabled, estimated savings equals `(selfConsumedSolar * importRate) + (exportedEnergy * exportRate)`.

### Grid cost

- Estimated grid cost equals `gridConsumption * importRate`.

### Financial totals

- Total capital investment equals initial system cost plus additional capital costs.
- Net savings equals cumulative estimated savings minus cumulative maintenance expenses.
- ROI percentage equals `netSavings / totalCapitalInvestment * 100`.
- Payback progress uses the same percentage but should clamp visually between `0` and `100`.
- Remaining amount equals `max(0, totalCapitalInvestment - netSavings)`.

### Payback forecast

- Default forecast window is the most recent 30 valid days.
- Supported forecast windows are 30 days, 90 days, and all available readings.
- Average daily savings must be based on the selected forecast window.
- If average daily savings is `0`, the app must show that there is not enough savings data to estimate payback.

## Validation and Warning Spec

### Hard validation errors

- negative energy values are not allowed
- system cost cannot be negative
- electricity rates cannot be negative
- solar capacity must be greater than zero when provided
- installation date cannot be in the future
- duplicate primary reading date is blocked unless future multi-entry support is added
- invalid import backup file is blocked

### Warning flows that can be overridden

- cumulative reading lower than prior reading
- unusually high solar generation for the configured array size
- exported energy higher than solar generation
- zero electricity rate
- imported data will replace existing data
- deleting a reading that affects later cumulative calculations

### Meter reset flow

If a cumulative value is lower than the previous value:

1. Show a reset-or-correction warning.
2. Let the user correct the reading.
3. Let the user mark a meter reset or replacement.
4. When a reset is recorded, let the user manually enter consumption or generation since the last reading.

## Storage and Persistence Spec

Storage must be device-local only and pass through one service layer.

Required storage keys:

- `watttrack.systemProfile`
- `watttrack.energyReadings`
- `watttrack.systemCosts`
- `watttrack.appSettings`
- `watttrack.schemaVersion`

Required storage service methods:

- `getSystemProfile()`
- `saveSystemProfile()`
- `getEnergyReadings()`
- `saveEnergyReading()`
- `updateEnergyReading()`
- `deleteEnergyReading()`
- `getSystemCosts()`
- `saveSystemCost()`
- `updateSystemCost()`
- `deleteSystemCost()`
- `exportBackup()`
- `importBackup()`
- `clearAllData()`

Migration requirements:

- schema version must be stored separately
- current schema version for MVP is `1`
- future migrations must be additive where possible

## State Management Spec

The app should separate state by domain:

- system store for profile and onboarding state
- readings store for reading CRUD and recalculation
- costs store for cost CRUD and ROI dependencies
- settings store for display and reminder preferences

State responsibilities:

- hydrate from storage on app load
- expose loading and mutation states
- keep persistence concerns out of screen components
- trigger derived summary refresh after writes

## Implementation Structure

Target structure:

- `src/app/`
- `src/components/`
- `src/features/`
- `src/services/`
- `src/stores/`
- `src/types/`
- `src/utils/`
- `src/constants/`

Implementation notes:

- business calculations should live in services or pure utilities
- forms should use React Hook Form and Zod
- date grouping and range logic should live in utilities
- export and notification logic should be isolated from screens

## Non-Functional Requirements

- Android is the primary target.
- App must remain usable offline after first install.
- App must not require network permission for core flows.
- Empty states must be safe and informative.
- All calculations must run locally.
- Formatting must support Philippine peso display.
- Date behavior must align with Asia/Manila expectations.

## Acceptance Gate

The build is acceptable when:

- all PRD MVP acceptance criteria are met
- all estimated metrics are labeled clearly
- no critical flow depends on internet
- data survives app restart
- export and import have confirmation and validation
- the dashboard answers the core user questions from the PRD

## Open Implementation Decisions

These should be resolved during build and reflected back here when finalized:

- chart library choice for bar and line visualizations
- exact reminder deep-link route into Add Reading
- whether System Costs lives under Insights, Settings, or both
- whether first reading is captured inside onboarding or immediately after onboarding

## Current Repository Gap Summary

As of 2026-07-14, the existing scaffold does not yet satisfy this spec because:

- current reading models are watt-duration based instead of meter-reading based
- current onboarding is a splash CTA instead of setup
- current dashboard is a placeholder summary
- current storage and types do not match the MVP domain model
- current app structure is missing full domain stores and feature modules
