# Watt Track Native QA Checklist

Last updated: July 22, 2026

Use this checklist against an Android preview APK or production-equivalent internal build. Expo Go is not sufficient for reminder, share sheet, document picker, or app lifecycle release validation.

## Build Under Test

- Build profile: `preview` or `production`
- Platform: Android
- App version: 1.0.0
- Package: `com.keiprojects.watttrack`

## Required Passes

- Fresh install opens onboarding and saves a valid system profile.
- App closes and reopens to Home with the saved profile still present.
- Add Reading saves daily and cumulative grid/solar readings.
- Invalid lower cumulative readings show a warning and allow explicit override paths.
- History list, detail, edit, duplicate, and delete flows render and preserve recalculated values.
- Additional system costs can be created, edited, deleted, and reflected in ROI.
- Airplane mode launch opens existing local data without crashing.
- Weather failure while offline is contained to the weather card and does not block core app usage.
- CSV export opens the Android share sheet and produces a readable CSV.
- JSON backup export opens the Android share sheet and produces a readable JSON file.
- JSON backup import through the Android document picker restores profile, readings, costs, and settings.
- Merge restore keeps newer local records and includes backup-only records.
- Replace restore removes current records and restores only the selected backup.
- Daily reminder permission prompt appears when reminders are enabled.
- Scheduled reminder appears at the selected local time and deep-links to Add Reading.
- Reset all data clears profile, readings, costs, settings, local backups, and reminder schedule.

## Store Submission Gate

- Privacy URL returns HTTP 200: `https://support.keiprojects.dev/privacy/`
- Support URL returns HTTP 200: `https://support.keiprojects.dev/support/`
- Google Play Data Safety answers match the final binary.
- App Store Connect App Privacy answers match the final binary if iOS is submitted.
