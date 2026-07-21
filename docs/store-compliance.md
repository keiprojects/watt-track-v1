# Watt Track Store Compliance Worksheet

Last updated: July 21, 2026

This worksheet prepares the store compliance answers for the current Watt Track implementation. Re-check these answers before each release, especially if analytics, crash reporting, accounts, cloud sync, ads, subscriptions, or new third-party SDKs are added.

## Source Requirements Checked

- Google Play requires a Data Safety form for every app and expects the answers to match the privacy policy: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play policy requires accurate data collection, use, and sharing disclosures, including SDK behavior: https://support.google.com/googleplay/android-developer/answer/17190352
- Apple App Store Connect requires App Privacy details and a Privacy Policy URL for all apps: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- Apple explains App Privacy labels, including when transmitted data is considered collected: https://developer.apple.com/app-store/app-privacy-details/
- Apple App Review expects support and privacy links to be functional: https://developer.apple.com/distribute/app-review/
- EAS Submit uploads binaries but does not manage Google Play listing metadata, screenshots, or release notes: https://docs.expo.dev/submit/introduction/

## Privacy Policy URL

Required before store submission.

Recommended action:

- Publish `docs/privacy-policy.md` as a public webpage.
- Use a stable URL such as `https://keiprojects.com/watt-track/privacy` or a GitHub Pages URL.
- Use the same URL in Google Play Console and App Store Connect.

Temporary local source:

- `docs/privacy-policy.md`

## Support URL

Required or strongly expected for store review.

Recommended action:

- Publish a simple support page with contact email, app name, version, troubleshooting notes, and privacy policy link.
- Suggested URL: `https://keiprojects.com/watt-track/support`
- Suggested email: `support@keiprojects.com`

## Google Play Data Safety Draft

Use these answers for the current app, subject to final review in Play Console.

### Data Collection

Recommended answer: The app collects user data.

Reason: the app can transmit user-entered location text or manually saved site coordinates to Open-Meteo for weather lookup. The core energy, cost, settings, and reminder data is stored locally and is not sent to Watt Track servers.

Data types to declare:

- Location > Approximate location, or precise location if exact coordinates remain user-enterable at release.

Collection details:

- Optional: Yes. Weather can fail gracefully, and the core app still works without internet.
- Purpose: App functionality.
- Shared: Review Play Console's current service-provider definitions. Conservative answer: Yes, shared with Open-Meteo for weather lookup only.
- Processed ephemerally: Recommended to answer based on current Play Console wording and Open-Meteo terms at submission time.

Do not declare these unless the implementation changes:

- Personal info
- Financial info
- Health and fitness
- Messages
- Photos and videos
- Audio files
- Files and docs, except user-selected backup import handling if Play Console asks about file access rather than developer collection
- Calendar
- Contacts
- App activity
- Web browsing
- App info and performance
- Device or other IDs

### Security Practices

Suggested answers:

- Data is encrypted in transit: Yes for weather HTTPS requests.
- Users can request data deletion: Not applicable for developer-held app data because Watt Track does not maintain a server account or cloud copy. In-app local reset deletes device-local app data.
- Independent security review: No, unless completed before submission.

### Notes for Reviewer

Suggested note:

Watt Track is a local-first manual solar tracking app. System profile, readings, costs, settings, and local backup restore points are stored on the user's device. The app may call Open-Meteo over HTTPS using a user-entered location string or manually saved site coordinates to display weather. Users can export CSV/JSON files through the device share sheet.

## Apple App Privacy Draft

Use these answers for the current app, subject to final review in App Store Connect.

### Data Used to Track

Recommended answer: No.

Watt Track does not use advertising SDKs, tracking SDKs, or cross-app tracking.

### Data Linked to the User

Recommended answer: No, assuming there are no accounts, analytics identifiers, crash-reporting identifiers, or cloud sync added before release.

### Data Not Linked to the User

Recommended conservative answer if weather remains enabled:

- Location > Coarse Location, or Precise Location if exact coordinates remain user-enterable at release
- Purpose: App Functionality
- Linked to user: No
- Used for tracking: No

If weather lookup is removed or made fully disabled before release, the App Privacy answer may become "Data Not Collected."

### Privacy Policy URL

Required:

- Use the published URL for `docs/privacy-policy.md`.

### User Privacy Choices URL

Optional:

- Can be the same support/privacy page explaining local reset and exported file deletion.

## Android Permissions and Disclosures

Expected permissions from current dependencies may include notifications and file/document access flows.

Store copy should explain:

- Notifications are used only for optional daily reading reminders.
- File picker access is used only when the user imports a Watt Track backup.
- Sharing/file creation is used only when the user exports CSV or JSON backups. Local restore points remain in device-local app storage.

## iOS Review Notes

Suggested App Review note:

Watt Track does not require an account. On first launch, complete onboarding with any system name, installation date, import rate, and reading modes. Add readings from the center Add tab. Optional local reminders can be enabled in app settings. Backup and export are local device flows.

## Remaining Before Submission

- Publish privacy policy URL.
- Publish support URL.
- Confirm support email mailbox is active.
- Verify Play Console Data Safety answers against final release binary.
- Verify App Store Connect App Privacy answers against final release binary.
- Re-test native notification permission, share sheet export, and document picker import on production or internal builds.
