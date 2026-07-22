export const APP_NAME = 'Watt Track';
export const APP_VERSION = '1.0.0';
export const SUPPORT_EMAIL = 'support@keiprojects.dev';

export const OPEN_SOURCE_LICENSES = [
  { name: 'Expo', license: 'MIT', purpose: 'App runtime, native APIs, and development tooling.' },
  { name: 'Expo Router', license: 'MIT', purpose: 'File-based navigation and app routing.' },
  { name: 'React', license: 'MIT', purpose: 'User interface rendering.' },
  { name: 'React Native', license: 'MIT', purpose: 'Native mobile interface framework.' },
  { name: 'Zustand', license: 'MIT', purpose: 'Local app state management.' },
  { name: 'Zod', license: 'MIT', purpose: 'Backup and form data validation.' },
  { name: 'React Hook Form', license: 'MIT', purpose: 'Form state and validation workflow.' },
  { name: 'NativeWind', license: 'MIT', purpose: 'Styling support.' },
  { name: 'React Native Gifted Charts', license: 'MIT', purpose: 'Charts and data visualization.' },
  { name: '@expo/vector-icons', license: 'MIT', purpose: 'Interface icons.' },
  { name: '@react-native-async-storage/async-storage', license: 'MIT', purpose: 'Device-local persistence.' },
  { name: '@react-native-community/datetimepicker', license: 'MIT', purpose: 'Native date and time inputs.' },
] as const;

export const PRIVACY_POLICY_SECTIONS = [
  {
    title: 'Local data',
    body:
      'Watt Track stores your solar profile, readings, costs, settings, reminders, local restore points, and calculated estimates on this device.',
  },
  {
    title: 'No account required',
    body:
      'The app does not require an account and does not sync your energy data to a Watt Track server.',
  },
  {
    title: 'Weather lookup',
    body:
      'If weather is shown, Watt Track may send your saved location text, saved site coordinates, or a default location to Open-Meteo over HTTPS to retrieve current weather.',
  },
  {
    title: 'Backups and exports',
    body:
      'Backup and export files are created only when you choose to create them. After export, those files are controlled by where you save or share them.',
  },
] as const;

export const TERMS_OF_USE_SECTIONS = [
  {
    title: 'Personal tracking tool',
    body:
      'Watt Track is provided as a household solar tracking tool for manual readings, estimates, and personal record keeping.',
  },
  {
    title: 'Estimates',
    body:
      'Savings, costs, ROI, payback, and usage values are estimates based on the readings and rates you enter. They are not financial, utility, or engineering advice.',
  },
  {
    title: 'User responsibility',
    body:
      'You are responsible for entering accurate data, reviewing calculations, and keeping backup files if you need to preserve records outside this device.',
  },
  {
    title: 'Local storage',
    body:
      'Removing the app, clearing app data, losing the device, or replacing the device may delete local records unless you created an external backup file.',
  },
] as const;
