export type AppPalette = {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  surfaceAccent: string;
  surfaceOverlay: string;
  header: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textOnDark: string;
  accent: string;
  accentSoft: string;
  accentGlow: string;
  accentText: string;
  primaryChart: string;
  secondaryChart: string;
  chartGrid: string;
  ringTrack: string;
  warningSoft: string;
  warningText: string;
  dangerSoft: string;
  dangerText: string;
  neutralSoft: string;
  shadow: string;
  statusBackground: string;
  statusText: string;
  scrim: string;
  skeleton: string;
};

export const shadcnLime = {
  white: '#ffffff',
  black: '#0a0a0a',
  neutral50: '#fafafa',
  neutral100: '#f5f5f5',
  neutral200: '#e5e5e5',
  neutral300: '#d4d4d4',
  neutral400: '#a3a3a3',
  neutral500: '#737373',
  neutral600: '#525252',
  neutral700: '#404040',
  neutral800: '#262626',
  neutral850: '#1f1f1f',
  neutral900: '#171717',
  zinc900: '#18181b',
  lime300: '#bef264',
  lime400: '#9ae600',
  lime500: '#7ccf00',
  lime650: '#5ea500',
  lime900: '#35530e',
  lime950: '#192e03',
  emerald300: '#5ee9b5',
  emerald500: '#00bc7d',
  emerald600: '#009966',
  emerald700: '#007a55',
  emerald800: '#006045',
  amber300: '#fcd34d',
  amber500: '#f59e0b',
  red500: '#e7000b',
  red400: '#ff6467',
} as const;

export const lightPalette: AppPalette = {
  mode: 'light',
  background: shadcnLime.white,
  surface: shadcnLime.white,
  surfaceRaised: shadcnLime.neutral100,
  surfaceMuted: shadcnLime.neutral100,
  surfaceAccent: '#f7fee7',
  surfaceOverlay: 'rgba(255, 255, 255, 0.96)',
  header: shadcnLime.white,
  border: shadcnLime.neutral200,
  text: shadcnLime.black,
  textMuted: shadcnLime.neutral500,
  textSubtle: shadcnLime.neutral400,
  textOnDark: shadcnLime.white,
  accent: shadcnLime.lime400,
  accentSoft: 'rgba(154, 230, 0, 0.18)',
  accentGlow: 'rgba(154, 230, 0, 0.34)',
  accentText: shadcnLime.lime900,
  primaryChart: shadcnLime.emerald500,
  secondaryChart: shadcnLime.emerald600,
  chartGrid: 'rgba(10, 10, 10, 0.08)',
  ringTrack: 'rgba(10, 10, 10, 0.10)',
  warningSoft: 'rgba(252, 211, 77, 0.20)',
  warningText: shadcnLime.amber500,
  dangerSoft: '#fee2e2',
  dangerText: shadcnLime.red500,
  neutralSoft: shadcnLime.neutral100,
  shadow: '0 18px 48px rgba(10, 10, 10, 0.08)',
  statusBackground: shadcnLime.neutral100,
  statusText: shadcnLime.black,
  scrim: 'rgba(10, 10, 10, 0.42)',
  skeleton: shadcnLime.neutral200,
};

export const darkPalette: AppPalette = {
  mode: 'dark',
  background: shadcnLime.black,
  surface: shadcnLime.neutral900,
  surfaceRaised: shadcnLime.neutral800,
  surfaceMuted: shadcnLime.neutral800,
  surfaceAccent: 'rgba(124, 207, 0, 0.12)',
  surfaceOverlay: 'rgba(23, 23, 23, 0.96)',
  header: shadcnLime.neutral900,
  border: 'rgba(255, 255, 255, 0.10)',
  text: shadcnLime.neutral50,
  textMuted: shadcnLime.neutral400,
  textSubtle: shadcnLime.neutral500,
  textOnDark: shadcnLime.neutral50,
  accent: shadcnLime.lime500,
  accentSoft: 'rgba(124, 207, 0, 0.16)',
  accentGlow: 'rgba(124, 207, 0, 0.32)',
  accentText: shadcnLime.lime950,
  primaryChart: shadcnLime.emerald300,
  secondaryChart: shadcnLime.emerald500,
  chartGrid: 'rgba(255, 255, 255, 0.08)',
  ringTrack: 'rgba(255, 255, 255, 0.12)',
  warningSoft: 'rgba(252, 211, 77, 0.14)',
  warningText: shadcnLime.amber300,
  dangerSoft: 'rgba(255, 100, 103, 0.14)',
  dangerText: shadcnLime.red400,
  neutralSoft: shadcnLime.neutral800,
  shadow: '0 24px 56px rgba(0, 0, 0, 0.42)',
  statusBackground: shadcnLime.neutral800,
  statusText: shadcnLime.neutral50,
  scrim: 'rgba(0, 0, 0, 0.72)',
  skeleton: shadcnLime.neutral800,
};
