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

export const shadcnZinc = {
  white: '#ffffff',
  black: '#09090b',
  zinc50: '#fafafa',
  zinc100: '#f4f4f5',
  zinc200: '#e4e4e7',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717b',
  zinc600: '#52525c',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
  zinc900: '#18181b',
  red500: '#e7000b',
  red400: '#ff6467',
  blue700: '#1447e6',
} as const;

export const lightPalette: AppPalette = {
  mode: 'light',
  background: shadcnZinc.white,
  surface: shadcnZinc.white,
  surfaceRaised: shadcnZinc.zinc100,
  surfaceMuted: shadcnZinc.zinc100,
  surfaceAccent: shadcnZinc.zinc100,
  surfaceOverlay: 'rgba(255, 255, 255, 0.96)',
  header: shadcnZinc.white,
  border: shadcnZinc.zinc200,
  text: shadcnZinc.black,
  textMuted: shadcnZinc.zinc500,
  textSubtle: shadcnZinc.zinc400,
  textOnDark: shadcnZinc.zinc50,
  accent: shadcnZinc.zinc900,
  accentSoft: 'rgba(24, 24, 27, 0.08)',
  accentGlow: 'rgba(24, 24, 27, 0.12)',
  accentText: shadcnZinc.zinc900,
  primaryChart: shadcnZinc.zinc600,
  secondaryChart: shadcnZinc.zinc500,
  chartGrid: 'rgba(9, 9, 11, 0.08)',
  ringTrack: 'rgba(9, 9, 11, 0.10)',
  warningSoft: '#fef3c7',
  warningText: '#92400e',
  dangerSoft: '#fee2e2',
  dangerText: shadcnZinc.red500,
  neutralSoft: shadcnZinc.zinc100,
  shadow: '0 10px 28px rgba(9, 9, 11, 0.07)',
  statusBackground: shadcnZinc.zinc100,
  statusText: shadcnZinc.zinc900,
  scrim: 'rgba(9, 9, 11, 0.42)',
  skeleton: shadcnZinc.zinc200,
};

export const darkPalette: AppPalette = {
  mode: 'dark',
  background: shadcnZinc.black,
  surface: shadcnZinc.zinc900,
  surfaceRaised: shadcnZinc.zinc800,
  surfaceMuted: shadcnZinc.zinc800,
  surfaceAccent: shadcnZinc.zinc800,
  surfaceOverlay: 'rgba(24, 24, 27, 0.96)',
  header: shadcnZinc.zinc900,
  border: 'rgba(255, 255, 255, 0.10)',
  text: shadcnZinc.zinc50,
  textMuted: shadcnZinc.zinc400,
  textSubtle: shadcnZinc.zinc500,
  textOnDark: shadcnZinc.zinc50,
  accent: shadcnZinc.zinc200,
  accentSoft: 'rgba(228, 228, 231, 0.10)',
  accentGlow: 'rgba(228, 228, 231, 0.16)',
  accentText: shadcnZinc.zinc200,
  primaryChart: shadcnZinc.zinc300,
  secondaryChart: shadcnZinc.zinc500,
  chartGrid: 'rgba(255, 255, 255, 0.08)',
  ringTrack: 'rgba(255, 255, 255, 0.10)',
  warningSoft: 'rgba(251, 191, 36, 0.14)',
  warningText: '#fbbf24',
  dangerSoft: 'rgba(255, 100, 103, 0.14)',
  dangerText: shadcnZinc.red400,
  neutralSoft: shadcnZinc.zinc800,
  shadow: '0 16px 36px rgba(0, 0, 0, 0.32)',
  statusBackground: shadcnZinc.zinc800,
  statusText: shadcnZinc.zinc200,
  scrim: 'rgba(0, 0, 0, 0.72)',
  skeleton: shadcnZinc.zinc800,
};
