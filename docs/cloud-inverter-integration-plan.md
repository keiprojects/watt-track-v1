# WattTrack Cloud Inverter Integration Plan

Last updated: 2026-07-22
Status: future-feature planning

## Purpose

This document defines the planned v1 approach for optional inverter cloud imports in WattTrack.

It is intentionally separate from `spec-plan.md` and `development-plan.md` because the current MVP remains offline-first and manual-entry first. This plan should be treated as future scope until the MVP release gate is complete and the provider API access model has been verified.

## Summary

WattTrack will add optional cloud imports for common residential inverter platforms while preserving local ownership of readings.

The first planned provider set is:

- Deye Cloud
- SolisCloud
- Growatt
- GoodWe SEMS
- Huawei FusionSolar
- Sungrow iSolarCloud

Additional app-backed inverter candidates to validate:

- SRNE
- PowMr via Solar of Things / SiSeLi
- Zamdon

Cloud data will be manually previewed and imported as local WattTrack readings. The feature will not add automatic server sync, real-time monitoring, or a WattTrack user account in v1.

## Product Behavior

### v1 user flow

1. User opens Settings or Data.
2. User selects Cloud inverter import.
3. User chooses a provider.
4. User connects the provider using the provider-supported credential or authorization flow.
5. WattTrack lists available plants or devices.
6. User selects a plant or device and a date range.
7. WattTrack previews normalized daily reading candidates.
8. User reviews duplicates or conflicts.
9. User imports selected days into local reading history.
10. Imported readings appear in dashboard, history, insights, export, and backup flows like manual readings.

### Out of scope for v1

- WattTrack accounts
- Cross-device cloud sync
- Scheduled server-side importing
- Real-time telemetry
- Remote notifications
- Writing data back to inverter clouds
- Silent overwrite of manual readings

## Architecture

### Backend broker

Use Expo Router API routes hosted on EAS Hosting as the provider broker. Use Supabase for encrypted connector metadata and import job state.

The broker is required because provider integrations may need server-side secrets, OAuth token exchange, token refresh, provider-specific signing, rate limiting, and error normalization.

Planned API routes:

- `GET /api/cloud/providers`
- `POST /api/cloud/connect`
- `GET /api/cloud/connections`
- `POST /api/cloud/preview`
- `POST /api/cloud/import`
- `POST /api/cloud/disconnect`

### Identity model

Use a device-bound install identity in v1.

- Generate a local install id and install secret.
- Store the local secret with `expo-secure-store`.
- Store provider connection summaries and encrypted provider credentials in Supabase.
- Do not require a WattTrack account.
- Do not include provider secrets or tokens in JSON backups.

### Client networking

Use the existing Expo app networking direction:

- Use `fetch`, not Axios.
- Use abort controllers for cancellation.
- Apply request timeouts.
- Detect offline state with `@react-native-community/netinfo`.
- Keep manual readings and imported readings usable offline after import.

## Data Model Changes

### Provider ids

Add a provider id union:

```ts
type InverterProviderId =
  | 'deye'
  | 'soliscloud'
  | 'growatt'
  | 'goodwe-sems'
  | 'huawei-fusionsolar'
  | 'sungrow-isolarcloud'
  | 'solar-of-things'
  | 'srne'
  | 'powmr'
  | 'zamdon';
```

### Cloud connection summary

Add a client-safe connection summary type:

```ts
type CloudConnectionSummary = {
  id: string;
  providerId: InverterProviderId;
  providerDisplayName: string;
  plantName?: string;
  plantExternalId?: string;
  connectedAt: string;
  lastPreviewedAt?: string;
  lastImportedAt?: string;
  status: 'connected' | 'expired' | 'error';
};
```

### Daily reading candidate

Normalize provider responses before they touch the readings store:

```ts
type CloudDailyReadingCandidate = {
  providerId: InverterProviderId;
  connectionId: string;
  externalPlantId?: string;
  externalDeviceId?: string;
  externalReadingId: string;
  date: string;
  solarGenerationKwh?: number;
  exportedEnergyKwh?: number;
  gridConsumptionKwh?: number;
  importedFields: Array<'solarGenerationKwh' | 'exportedEnergyKwh' | 'gridConsumptionKwh'>;
  providerObservedAt?: string;
};
```

### EnergyReading metadata

Extend `EnergyReading` with backward-compatible source metadata:

```ts
type ReadingSource = 'manual' | 'cloud';

type CloudReadingMetadata = {
  providerId: InverterProviderId;
  connectionId: string;
  externalPlantId?: string;
  externalDeviceId?: string;
  externalReadingId: string;
  importedAt: string;
  importedFields: Array<'solarGenerationKwh' | 'exportedEnergyKwh' | 'gridConsumptionKwh'>;
};
```

Add these optional fields to readings:

- `source?: ReadingSource`
- `cloudMetadata?: CloudReadingMetadata`

Existing readings should default to `source: 'manual'` during schema reads or migration.

## Import Rules

Cloud imports must preserve user control and local calculations.

- Imported readings are stored locally through the readings store.
- Manual readings are never overwritten silently.
- Same-date conflicts must be previewed before import.
- Duplicate cloud imports are detected by provider, connection, external reading id, and date.
- A same-date manual reading may be skipped or imported as a separate timed reading.
- Imported values should use daily mode semantics wherever possible.
- If a provider only returns cumulative totals, normalize them into WattTrack daily values before import.
- Savings and ROI continue to use WattTrack's local rates and calculation service.

## Provider Notes

### Deye

Use DeyeCloud Developer API as the first path. Also account for legacy Solarman-linked Deye installs because some Deye systems have historically depended on Solarman data centers or account flows.

References:

- [DeyeCloud Developer Portal](https://developer.deyecloud.com/)
- [DeyeCloud API Documentation](https://developer.deyecloud.com/api)
- [Deye Cloud account transfer notice](https://www.deyeinverter.com/news/company-news/deye-cloud-account-transfer.html)
- [Solarman OpenAPI documentation](https://doc.solarmanpv.com/en/Documentation%20and%20Quick%20Guide)

### SolisCloud

Plan against official SolisCloud API documentation. Verify account requirements, app key provisioning, signing rules, and daily energy field names before implementation.

### Growatt

Include as a target with a validation spike. Public API access appears less consistent than some providers and may require account-level API enablement or partner access.

### GoodWe SEMS

Include as a target with a validation spike. SEMS/OpenAPI access may be gated by account type, organization approval, or regional availability.

### Huawei FusionSolar

Plan against FusionSolar OpenAPI or northbound API documentation. Verify regional endpoint, account role requirements, token expiry, and plant/device permissions.

### Sungrow iSolarCloud

Plan against iSolarCloud Developer API. Verify application approval, token flow, rate limits, and daily production/export/import field mapping.

### SRNE

Include as an app-backed validation candidate. SRNE publishes monitoring products and an SRNE Monitoring app, including Bluetooth-based real-time device monitoring and app-based system monitoring for some product lines. Before adapter work, verify whether a cloud API exists, whether the target inverter models are app-cloud or Bluetooth/local-only, and whether daily historical production/export/import values are available.

References:

- [SRNE monitoring products](https://www.srnesolar.com/product/Monitoring.html)
- [SRNE Monitoring on Google Play](https://play.google.com/store/apps/details?id=com.srne.androidapp)

### PowMr

Include as an app-backed validation candidate, with WIFI-RELAB treated as a Solar of Things / SiSeLi cloud path rather than a PowMr-owned cloud path. PowMr's pairing guide lists WIFI-RELAB for POW-RELAB and related HVM models using RS232 with Solar of Things for remote monitoring, parameter programming, and system status viewing.

Before adapter work, verify whether Solar of Things has official API access, whether the public SiSeLi portal exposes stable authenticated endpoints, and whether daily historical energy totals are available without relying on private mobile-app scraping. If no official API is available, keep this path as unsupported for direct cloud import and evaluate a local bridge through RS232/RS485, Home Assistant, Solar Assistant, or MQTT.

References:

- [PowMr solar inverter WiFi module pairing guide](https://powmr.com/blogs/accessories/solar-inverter-wifi-module-pairing-guide)
- [PowMr WIFI-VM monitoring module manual](https://manuals.plus/ae/1005009331761462)
- [Solar of Things web portal](https://solar.siseli.com/)
- [Solar of Things on Google Play](https://play.google.com/store/apps/details?id=com.ssli.sise_solar)
- [Solar of Things on the App Store](https://apps.apple.com/us/app/solar-of-things/id6445806075)

### Zamdon

Include as an app-backed validation candidate. Zamdon publishes inverter products and manuals, and some installs use Wi-Fi logger/app-style monitoring, but a public cloud API is not confirmed. Before adapter work, verify the monitoring app name, cloud platform, API availability, and whether the supported data is historical daily energy or only real-time device status.

References:

- [Zamdon official site](https://www.zamdon.com/)
- [Zamdon downloads and inverter manuals](https://www.zamdon.com/pages/download)

## Implementation Sequence

1. Add schema v2 and reading source metadata without changing current manual flows.
2. Add cloud integration types, provider registry, and provider adapter interface.
3. Add install id and secure local install secret.
4. Add Supabase schema for encrypted connection metadata and import audit state.
5. Add EAS API routes for provider list, connection, preview, import, and disconnect.
6. Run provider-access validation spikes for Growatt, GoodWe, SRNE, PowMr, and Zamdon before committing adapter work.
7. Implement one provider end to end, preferably Deye or SolisCloud after API access is confirmed.
8. Add Cloud inverter import UI under Settings or Data.
9. Add conflict preview and import confirmation.
10. Add remaining provider adapters behind the same normalized interface.
11. Harden offline, expired-token, rate-limit, app-only, local-only, and provider-outage behavior.

## Test Plan

- Unit test provider normalization into WattTrack daily kWh fields.
- Unit test Deye and Solarman-linked account-path handling.
- Unit test app-backed provider candidates as unsupported/unavailable until official API access is confirmed.
- Unit test schema v1-to-v2 migration and default `source: 'manual'` behavior.
- Unit test backup export to confirm provider secrets and tokens are excluded.
- Unit test duplicate detection for provider, connection, date, and external id.
- Integration test EAS API route validation, authentication, provider error mapping, and Supabase writes.
- App test offline state, failed credentials, preview import, conflict skip/import, disconnect, and manual readings remaining editable.
- Regression test calculation, storage, backup/import, CSV export, dashboard, history, and insights behavior after imported readings are added.

## Assumptions

- v1 remains device-bound and does not introduce WattTrack accounts.
- v1 imports are manually triggered by the user.
- EAS Hosting and Supabase are acceptable backend dependencies for this future feature.
- Imported readings become local WattTrack records and remain available offline.
- Provider API credentials, pricing, quotas, approval requirements, and regional availability must be verified per brand before implementation starts.
